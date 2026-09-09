const asyncHandler = require("express-async-handler");
const bookingService = require("../services/booking.service");
const { ok, created, list } = require("../utils/apiResponse");

const estimate = asyncHandler(async (req, res) => {
  ok(res, bookingService.estimateTrip(req.body));
});

const create = asyncHandler(async (req, res) => {
  const { booking, matched, otpSentTo } = await bookingService.createBooking(
    req.user,
    req.body,
    req.app.get("io")
  );
  created(
    res,
    booking,
    matched
      ? `Booking created. Your OTP is on this customer screen (not SMS). Nearby drivers notified.`
      : `Booking created. Your OTP is on this customer screen (not SMS). No driver nearby yet.`
  );
});

const listMine = asyncHandler(async (req, res) => {
  const { items, pagination } = await bookingService.listBookings(req.user, req.query);
  list(res, items, { pagination });
});

const getOne = asyncHandler(async (req, res) => {
  const booking = await bookingService.getBookingById(req.user, req.params.id);
  ok(res, booking);
});

const accept = asyncHandler(async (req, res) => {
  const booking = await bookingService.acceptBooking(req.user, req.params.id, req.app.get("io"));
  ok(res, booking, "Booking accepted");
});

const arrived = asyncHandler(async (req, res) => {
  const booking = await bookingService.markArrived(req.user, req.params.id, req.app.get("io"));
  ok(res, booking);
});

const start = asyncHandler(async (req, res) => {
  const booking = await bookingService.startTrip(
    req.user,
    req.params.id,
    req.body.otp,
    req.app.get("io")
  );
  ok(res, booking, "Trip started");
});

const complete = asyncHandler(async (req, res) => {
  const booking = await bookingService.completeTrip(req.user, req.params.id, req.app.get("io"));
  ok(res, booking, "Trip completed");
});

const cancel = asyncHandler(async (req, res) => {
  const booking = await bookingService.cancelBooking(
    req.user,
    req.params.id,
    req.body.reason,
    req.app.get("io")
  );
  ok(res, booking, "Booking cancelled");
});

const rate = asyncHandler(async (req, res) => {
  const booking = await bookingService.rateBooking(req.user, req.params.id, req.body);
  ok(res, booking, "Rating submitted");
});

const pay = asyncHandler(async (req, res) => {
  const booking = await bookingService.payBooking(req.user, req.params.id, req.body);
  const message = booking.payment?.status === "cod" ? "Cash on delivery selected" : "Payment successful";
  ok(res, booking, message);
});

const collectCash = asyncHandler(async (req, res) => {
  const booking = await bookingService.collectCash(req.user, req.params.id);
  ok(res, booking, "Cash collected");
});

module.exports = {
  estimate,
  create,
  listMine,
  getOne,
  accept,
  arrived,
  start,
  complete,
  cancel,
  rate,
  pay,
  collectCash,
};
