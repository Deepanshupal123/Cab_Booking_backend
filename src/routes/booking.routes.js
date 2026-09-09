const express = require("express");
const ctrl = require("../controllers/booking.controller");
const { protect, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
  createBookingRules,
  estimateRules,
  otpRules,
  cancelRules,
  rateRules,
  payRules,
  mongoIdParam,
} = require("../validators");
const { ROLES } = require("../config/constants");

const router = express.Router();

router.post("/estimate", protect, authorize(ROLES.CUSTOMER), estimateRules, validate, ctrl.estimate);
router.post("/", protect, authorize(ROLES.CUSTOMER), createBookingRules, validate, ctrl.create);
router.get("/", protect, ctrl.listMine);
router.get("/:id", protect, mongoIdParam, validate, ctrl.getOne);
router.patch("/:id/accept", protect, authorize(ROLES.DRIVER), mongoIdParam, validate, ctrl.accept);
router.patch("/:id/arrived", protect, authorize(ROLES.DRIVER), mongoIdParam, validate, ctrl.arrived);
router.patch("/:id/start", protect, authorize(ROLES.DRIVER), mongoIdParam, otpRules, validate, ctrl.start);
router.patch("/:id/complete", protect, authorize(ROLES.DRIVER), mongoIdParam, validate, ctrl.complete);
router.patch(
  "/:id/cancel",
  protect,
  authorize(ROLES.CUSTOMER, ROLES.DRIVER, ROLES.ADMIN),
  mongoIdParam,
  cancelRules,
  validate,
  ctrl.cancel
);
router.post("/:id/rate", protect, authorize(ROLES.CUSTOMER), mongoIdParam, rateRules, validate, ctrl.rate);
router.post("/:id/pay", protect, authorize(ROLES.CUSTOMER), mongoIdParam, payRules, validate, ctrl.pay);
router.patch("/:id/collect-cash", protect, authorize(ROLES.DRIVER), mongoIdParam, validate, ctrl.collectCash);

module.exports = router;
