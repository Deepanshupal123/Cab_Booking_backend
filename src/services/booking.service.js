const Booking = require("../models/Booking");
const User = require("../models/User");
const env = require("../config/env");
const {
  BOOKING_STATUS,
  ACTIVE_TRIP_STATUSES,
  SOCKET_EVENTS,
  ROLES,
} = require("../config/constants");
const { getDistanceKm, calculateFare, generateOtp, toPoint } = require("../utils/geo");
const { notifyOtp } = require("../utils/notifyOtp");
const ApiError = require("../utils/apiError");
const { assertTransition } = require("../utils/bookingStatus");
const rooms = require("../socket/rooms");

const toGeoLocation = ({ address, coordinates }) => ({
  address,
  ...toPoint(coordinates),
});

const emitSafe = (io, room, event, payload) => {
  if (io) io.to(room).emit(event, payload);
};

const estimateTrip = ({ pickupLocation, dropLocation, vehicleType }) => {
  const distanceKm = Number(
    getDistanceKm(pickupLocation.coordinates, dropLocation.coordinates).toFixed(2)
  );
  if (distanceKm < 0.4) {
    throw ApiError.badRequest("Pickup and drop must be different locations");
  }
  const estimatedFare = calculateFare(vehicleType, distanceKm);
  return { distanceKm, estimatedFare, vehicleType };
};

const findNearbyDrivers = async (vehicleType, coordinates) =>
  User.find({
    role: ROLES.DRIVER,
    isAvailable: true,
    isActive: true,
    vehicleType,
    currentLocation: {
      $near: {
        $geometry: { type: "Point", coordinates },
        $maxDistance: env.driverSearchRadiusM,
      },
    },
  }).limit(15);

const maskPhone = (phone) => {
  const p = String(phone || "");
  if (p.length < 4) return "your registered number";
  return `******${p.slice(-4)}`;
};

const sanitizeBooking = (booking, viewer) => {
  const data = booking.toObject ? booking.toObject() : booking;
  if (viewer?.role !== ROLES.CUSTOMER || String(data.customer?._id || data.customer) !== String(viewer._id)) {
    delete data.otp;
  }
  return data;
};

const createBooking = async (customer, body, io) => {
  const { pickupLocation, dropLocation, vehicleType } = body;
  const { distanceKm, estimatedFare } = estimateTrip(body);

  const booking = await Booking.create({
    customer: customer._id,
    pickupLocation: toGeoLocation(pickupLocation),
    dropLocation: toGeoLocation(dropLocation),
    vehicleType,
    distanceKm,
    fare: { estimated: estimatedFare },
    otp: generateOtp(),
  });

  const nearbyDrivers = await findNearbyDrivers(vehicleType, pickupLocation.coordinates);

  nearbyDrivers.forEach((driver) => {
    emitSafe(io, rooms.driver(driver._id), SOCKET_EVENTS.NEW_BOOKING_REQUEST, {
      bookingId: booking._id,
      pickupLocation,
      dropLocation,
      fare: estimatedFare,
      distanceKm,
    });
  });

  const created = await Booking.findById(booking._id).select("+otp");
  await notifyOtp({ phone: customer.phone, email: customer.email, otp: created.otp });
  const masked = maskPhone(customer.phone);
  return {
    booking: { ...sanitizeBooking(created, customer), otpSentTo: masked },
    matched: nearbyDrivers.length > 0,
    otpSentTo: masked,
  };
};

const populateBooking = (query) =>
  query
    .populate("customer", "name phone")
    .populate("driver", "name phone vehicleType vehicleNumber currentLocation rating");

const acceptBooking = async (driver, bookingId, io) => {
  const existing = await Booking.findById(bookingId);
  if (!existing) throw ApiError.notFound("Booking not found");

  if (
    existing.driver &&
    String(existing.driver) === String(driver._id) &&
    ACTIVE_TRIP_STATUSES.includes(existing.status)
  ) {
    return populateBooking(Booking.findById(existing._id));
  }

  const activeTrip = await Booking.findOne({
    driver: driver._id,
    status: { $in: ACTIVE_TRIP_STATUSES },
  });
  if (activeTrip) {
    throw ApiError.conflict(
      "Finish or cancel your current trip before accepting another ride"
    );
  }

  if (driver.vehicleType && existing.vehicleType && driver.vehicleType !== existing.vehicleType) {
    throw ApiError.badRequest(`This ride needs a ${existing.vehicleType}. Your vehicle is ${driver.vehicleType}.`);
  }

  const booking = await Booking.findOneAndUpdate(
    { _id: bookingId, status: BOOKING_STATUS.PENDING, driver: null },
    {
      $set: {
        driver: driver._id,
        status: BOOKING_STATUS.ACCEPTED,
        "timeline.acceptedAt": new Date(),
      },
    },
    { new: true }
  );

  if (!booking) {
    throw ApiError.badRequest("Booking is not available to accept");
  }

  await User.findByIdAndUpdate(driver._id, { isAvailable: false });

  emitSafe(io, rooms.customer(booking.customer), SOCKET_EVENTS.BOOKING_ACCEPTED, {
    bookingId: booking._id,
    driverId: driver._id,
    driverName: driver.name,
    vehicleType: driver.vehicleType,
    vehicleNumber: driver.vehicleNumber,
  });

  return populateBooking(Booking.findById(booking._id));
};

const getOwnedForDriver = async (driverId, bookingId) => {
  const booking = await Booking.findById(bookingId);
  if (!booking || String(booking.driver) !== String(driverId)) {
    throw ApiError.notFound("Booking not found for this driver");
  }
  return booking;
};

const markArrived = async (driver, bookingId, io) => {
  const booking = await getOwnedForDriver(driver._id, bookingId);
  assertTransition(booking.status, BOOKING_STATUS.ARRIVED);
  booking.status = BOOKING_STATUS.ARRIVED;
  booking.timeline.arrivedAt = new Date();
  await booking.save();

  emitSafe(io, rooms.customer(booking.customer), SOCKET_EVENTS.DRIVER_ARRIVED, {
    bookingId: booking._id,
  });
  return booking;
};

const startTrip = async (driver, bookingId, otp, io) => {
  const booking = await Booking.findById(bookingId).select("+otp");
  if (!booking || String(booking.driver) !== String(driver._id)) {
    throw ApiError.notFound("Booking not found for this driver");
  }
  if (![BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.ARRIVED].includes(booking.status)) {
    throw ApiError.badRequest("Accept the ride before starting with OTP");
  }
  if (booking.otp !== otp) {
    throw ApiError.badRequest("Invalid OTP");
  }

  booking.status = BOOKING_STATUS.ONGOING;
  booking.timeline.startedAt = new Date();
  await booking.save();

  emitSafe(io, rooms.customer(booking.customer), SOCKET_EVENTS.TRIP_STARTED, {
    bookingId: booking._id,
  });
  return booking;
};

const completeTrip = async (driver, bookingId, io) => {
  const booking = await getOwnedForDriver(driver._id, bookingId);
  assertTransition(booking.status, BOOKING_STATUS.COMPLETED);

  booking.status = BOOKING_STATUS.COMPLETED;
  booking.fare.final = booking.fare.estimated;
  booking.timeline.completedAt = new Date();
  await booking.save();
  await User.findByIdAndUpdate(driver._id, { isAvailable: true });

  emitSafe(io, rooms.customer(booking.customer), SOCKET_EVENTS.TRIP_COMPLETED, {
    bookingId: booking._id,
    finalFare: booking.fare.final,
  });
  return booking;
};

const cancelBooking = async (user, bookingId, reason, io) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notFound("Booking not found");

  if ([BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED].includes(booking.status)) {
    throw ApiError.badRequest(`Cannot cancel a ${booking.status} booking`);
  }

  const isCustomer = String(booking.customer) === String(user._id);
  const isDriver = booking.driver && String(booking.driver) === String(user._id);
  const isAdmin = user.role === ROLES.ADMIN;

  if (!isCustomer && !isDriver && !isAdmin) {
    throw ApiError.forbidden("Not authorized to cancel this booking");
  }

  assertTransition(booking.status, BOOKING_STATUS.CANCELLED);

  booking.status = BOOKING_STATUS.CANCELLED;
  booking.cancelledBy = isAdmin ? "admin" : isCustomer ? "customer" : "driver";
  booking.cancelReason = reason || "No reason provided";
  await booking.save();

  if (booking.driver) {
    await User.findByIdAndUpdate(booking.driver, { isAvailable: true });
  }

  emitSafe(io, rooms.customer(booking.customer), SOCKET_EVENTS.BOOKING_CANCELLED, {
    bookingId: booking._id,
  });
  if (booking.driver) {
    emitSafe(io, rooms.driver(booking.driver), SOCKET_EVENTS.BOOKING_CANCELLED, {
      bookingId: booking._id,
    });
  }

  return booking;
};

const listBookings = async (user, { status, page = 1, limit = 20 }) => {
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Math.max(1, Number(limit)));
  const skip = (pageNum - 1) * limitNum;

  if (user.role === ROLES.DRIVER && !status) {
    const [active, pending, history] = await Promise.all([
      populateBooking(
        Booking.find({
          driver: user._id,
          status: { $in: ACTIVE_TRIP_STATUSES },
        }).sort({ updatedAt: -1 })
      ),
      populateBooking(
        Booking.find({ status: BOOKING_STATUS.PENDING, driver: null })
          .sort({ createdAt: -1 })
          .limit(20)
      ),
      populateBooking(
        Booking.find({
          driver: user._id,
          status: { $nin: [...ACTIVE_TRIP_STATUSES, BOOKING_STATUS.PENDING] },
        })
          .sort({ createdAt: -1 })
          .limit(15)
      ),
    ]);
    const seen = new Set();
    const items = [...active, ...pending, ...history].filter((b) => {
      const id = String(b._id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    return {
      items,
      pagination: { page: 1, limit: items.length, total: items.length, pages: 1 },
    };
  }

  let filter = {};
  if (user.role === ROLES.CUSTOMER) filter.customer = user._id;
  if (user.role === ROLES.DRIVER) {
    filter = {
      $or: [{ driver: user._id }, { status: BOOKING_STATUS.PENDING, driver: null }],
    };
  }
  if (status) {
    filter = { $and: [filter, { status }] };
  }

  const [items, total] = await Promise.all([
    populateBooking(
      Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum)
    ),
    Booking.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum) || 1,
    },
  };
};

const getBookingById = async (user, bookingId) => {
  const query = populateBooking(Booking.findById(bookingId));

  if (user.role === ROLES.CUSTOMER) query.select("+otp");

  const booking = await query;
  if (!booking) throw ApiError.notFound("Booking not found");

  const isOwner =
    String(booking.customer._id) === String(user._id) ||
    (booking.driver && String(booking.driver._id) === String(user._id));
  const openForDrivers =
    user.role === ROLES.DRIVER &&
    booking.status === BOOKING_STATUS.PENDING &&
    !booking.driver;

  if (!isOwner && user.role !== ROLES.ADMIN && !openForDrivers) {
    throw ApiError.forbidden("Not authorized to view this booking");
  }

  return sanitizeBooking(booking, user);
};

const rateBooking = async (customer, bookingId, { score, comment }) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notFound("Booking not found");
  if (String(booking.customer) !== String(customer._id)) {
    throw ApiError.forbidden("Only the customer can rate this trip");
  }
  if (booking.status !== BOOKING_STATUS.COMPLETED) {
    throw ApiError.badRequest("Only completed trips can be rated");
  }
  if (booking.rating?.score) {
    throw ApiError.conflict("This trip has already been rated");
  }
  if (!booking.driver) {
    throw ApiError.badRequest("No driver assigned to this booking");
  }

  booking.rating = { score, comment: comment || null, ratedAt: new Date() };
  await booking.save();

  const driver = await User.findById(booking.driver);
  const nextCount = driver.rating.count + 1;
  const nextAverage = (driver.rating.average * driver.rating.count + score) / nextCount;
  driver.rating = { average: Number(nextAverage.toFixed(2)), count: nextCount };
  await driver.save();

  return booking;
};

const payBooking = async (customer, bookingId, { method }) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notFound("Booking not found");
  if (String(booking.customer) !== String(customer._id)) {
    throw ApiError.forbidden("Only the customer can pay for this trip");
  }
  if (booking.status !== BOOKING_STATUS.COMPLETED) {
    throw ApiError.badRequest("Pay after the trip is completed");
  }
  if (booking.payment?.status === "paid") {
    throw ApiError.conflict("This trip is already paid");
  }

  const amount = booking.fare.final || booking.fare.estimated;
  if (method === "cash") {
    booking.payment = {
      method: "cash",
      status: "cod",
      amount,
      transactionId: null,
      paidAt: null,
    };
    await booking.save();
    return booking;
  }

  throw ApiError.badRequest("Use Razorpay checkout for UPI or card");
};

const collectCash = async (driver, bookingId) => {
  const booking = await Booking.findById(bookingId);
  if (!booking || String(booking.driver) !== String(driver._id)) {
    throw ApiError.notFound("Booking not found for this driver");
  }
  if (booking.status !== BOOKING_STATUS.COMPLETED) {
    throw ApiError.badRequest("Collect cash after the trip is completed");
  }
  if (booking.payment?.status === "paid") {
    throw ApiError.conflict("Already paid");
  }
  if (booking.payment?.status !== "cod" && booking.payment?.method !== "cash") {
    throw ApiError.badRequest("This booking is not cash on delivery");
  }
  const amount = booking.fare.final || booking.fare.estimated;
  booking.payment = {
    method: "cash",
    status: "paid",
    amount,
    transactionId: `COD${Date.now()}`,
    paidAt: new Date(),
  };
  await booking.save();
  return booking;
};

module.exports = {
  estimateTrip,
  createBooking,
  acceptBooking,
  markArrived,
  startTrip,
  completeTrip,
  cancelBooking,
  listBookings,
  getBookingById,
  rateBooking,
  payBooking,
  collectCash,
};
