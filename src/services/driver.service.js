const User = require("../models/User");
const Booking = require("../models/Booking");
const ApiError = require("../utils/apiError");
const { toPoint } = require("../utils/geo");
const { SOCKET_EVENTS, ACTIVE_TRIP_STATUSES, ROLES } = require("../config/constants");
const rooms = require("../socket/rooms");

const setAvailability = async (driverId, isAvailable) => {
  if (isAvailable) {
    const activeTrip = await Booking.findOne({
      driver: driverId,
      status: { $in: ACTIVE_TRIP_STATUSES },
    });
    if (activeTrip) {
      throw ApiError.badRequest("Cannot go online while a trip is in progress");
    }
  }

  const driver = await User.findByIdAndUpdate(driverId, { isAvailable }, { new: true });
  return { isAvailable: driver.isAvailable };
};

const updateLocation = async (driver, { longitude, latitude }, io) => {
  const currentLocation = toPoint([longitude, latitude]);
  await User.findByIdAndUpdate(driver._id, { currentLocation });

  const activeTrip = await Booking.findOne({
    driver: driver._id,
    status: { $in: ACTIVE_TRIP_STATUSES },
  }).select("customer");

  if (io && activeTrip) {
    io.to(rooms.customer(activeTrip.customer)).emit(SOCKET_EVENTS.DRIVER_LOCATION_UPDATE, {
      driverId: driver._id,
      bookingId: activeTrip._id,
      coordinates: currentLocation.coordinates,
    });
  }

  return { coordinates: currentLocation.coordinates };
};

const findNearby = async ({ lng, lat, vehicleType, radiusKm = 5 }) => {
  const query = {
    role: ROLES.DRIVER,
    isAvailable: true,
    isActive: true,
    currentLocation: {
      $near: {
        $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
        $maxDistance: Number(radiusKm) * 1000,
      },
    },
  };

  if (vehicleType) query.vehicleType = vehicleType;

  return User.find(query).select("name phone vehicleType vehicleNumber rating currentLocation");
};

module.exports = { setAvailability, updateLocation, findNearby };
