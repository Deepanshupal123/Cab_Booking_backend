const asyncHandler = require("express-async-handler");
const paymentService = require("../services/payment.service");
const { ok } = require("../utils/apiResponse");

const config = asyncHandler(async (_req, res) => {
  ok(res, paymentService.publicConfig());
});

const createOrder = asyncHandler(async (req, res) => {
  const data = await paymentService.createOrder(req.user, req.body.bookingId);
  ok(res, data, "Razorpay order created");
});

const verify = asyncHandler(async (req, res) => {
  const booking = await paymentService.verifyPayment(req.user, req.body);
  ok(res, booking, "Payment verified");
});

module.exports = { config, createOrder, verify };
