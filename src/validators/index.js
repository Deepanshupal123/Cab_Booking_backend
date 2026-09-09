const { body, param, query } = require("express-validator");
const { VEHICLE_TYPES } = require("../config/constants");

const registerRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("phone")
    .optional({ checkFalsy: true })
    .matches(/^[0-9]{10}$/)
    .withMessage("Phone must be 10 digits"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("role").optional().isIn(["customer", "driver"]).withMessage("Invalid role"),
];

const loginRules = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const availabilityRules = [
  body("isAvailable").isBoolean().withMessage("isAvailable must be true or false"),
];

const locationRules = [
  body("longitude").isFloat({ min: -180, max: 180 }).withMessage("Invalid longitude"),
  body("latitude").isFloat({ min: -90, max: 90 }).withMessage("Invalid latitude"),
];

const nearbyRules = [
  query("lng").isFloat({ min: -180, max: 180 }).withMessage("lng is required"),
  query("lat").isFloat({ min: -90, max: 90 }).withMessage("lat is required"),
  query("vehicleType").optional().isIn(VEHICLE_TYPES),
  query("radiusKm").optional().isFloat({ min: 0.5, max: 50 }),
];

const locationBody = [
  body("pickupLocation.address").trim().notEmpty().withMessage("Pickup address is required"),
  body("pickupLocation.coordinates").isArray({ min: 2, max: 2 }).withMessage("Pickup coordinates required"),
  body("dropLocation.address").trim().notEmpty().withMessage("Drop address is required"),
  body("dropLocation.coordinates").isArray({ min: 2, max: 2 }).withMessage("Drop coordinates required"),
  body("vehicleType").isIn(VEHICLE_TYPES).withMessage("Invalid vehicle type"),
];

const createBookingRules = locationBody;
const estimateRules = locationBody;

const otpRules = [body("otp").trim().isLength({ min: 4, max: 4 }).withMessage("OTP must be 4 digits")];

const cancelRules = [body("reason").optional().isString().isLength({ max: 300 })];

const rateRules = [
  body("score").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
  body("comment").optional().isString().isLength({ max: 300 }),
];

const mongoIdParam = [param("id").isMongoId().withMessage("Invalid id")];

module.exports = {
  registerRules,
  loginRules,
  availabilityRules,
  locationRules,
  nearbyRules,
  createBookingRules,
  estimateRules,
  otpRules,
  cancelRules,
  rateRules,
  mongoIdParam,
};
