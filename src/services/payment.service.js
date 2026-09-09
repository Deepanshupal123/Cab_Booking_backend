const crypto = require("crypto");
const Razorpay = require("razorpay");
const env = require("../config/env");
const Booking = require("../models/Booking");
const { BOOKING_STATUS } = require("../config/constants");
const ApiError = require("../utils/apiError");

const isConfigured = () => Boolean(env.razorpayKeyId && env.razorpayKeySecret);

const getClient = () => {
  if (!isConfigured()) {
    throw ApiError.badRequest("Razorpay keys are not set. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }
  return new Razorpay({ key_id: env.razorpayKeyId, key_secret: env.razorpayKeySecret });
};

const publicConfig = () => ({
  enabled: isConfigured(),
  keyId: env.razorpayKeyId || null,
});

const createOrder = async (customer, bookingId) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notFound("Booking not found");
  if (String(booking.customer) !== String(customer._id)) {
    throw ApiError.forbidden("Not your booking");
  }
  if (booking.status !== BOOKING_STATUS.COMPLETED) {
    throw ApiError.badRequest("Pay after the trip is completed");
  }
  if (booking.payment?.status === "paid") {
    throw ApiError.conflict("Already paid");
  }

  const amount = booking.fare.final || booking.fare.estimated;
  const order = await getClient().orders.create({
    amount: Math.round(amount * 100),
    currency: "INR",
    receipt: String(booking._id).slice(-40),
    notes: { bookingId: String(booking._id) },
  });

  return { orderId: order.id, amount: order.amount, currency: order.currency, keyId: env.razorpayKeyId, bookingId };
};

const verifyPayment = async (customer, { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notFound("Booking not found");
  if (String(booking.customer) !== String(customer._id)) {
    throw ApiError.forbidden("Not your booking");
  }

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = crypto.createHmac("sha256", env.razorpayKeySecret).update(body).digest("hex");
  if (expected !== razorpay_signature) {
    throw ApiError.badRequest("Payment signature mismatch");
  }

  const amount = booking.fare.final || booking.fare.estimated;
  booking.payment = {
    method: "upi",
    status: "paid",
    amount,
    transactionId: razorpay_payment_id,
    paidAt: new Date(),
  };
  await booking.save();
  return booking;
};

module.exports = { publicConfig, createOrder, verifyPayment };
