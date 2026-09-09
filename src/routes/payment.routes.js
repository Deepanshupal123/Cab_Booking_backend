const express = require("express");
const { body } = require("express-validator");
const { config, createOrder, verify } = require("../controllers/payment.controller");
const { protect, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { ROLES } = require("../config/constants");

const router = express.Router();

router.get("/config", protect, config);
router.post(
  "/create-order",
  protect,
  authorize(ROLES.CUSTOMER),
  [body("bookingId").isMongoId()],
  validate,
  createOrder
);
router.post(
  "/verify",
  protect,
  authorize(ROLES.CUSTOMER),
  [
    body("bookingId").isMongoId(),
    body("razorpay_order_id").notEmpty(),
    body("razorpay_payment_id").notEmpty(),
    body("razorpay_signature").notEmpty(),
  ],
  validate,
  verify
);

module.exports = router;
