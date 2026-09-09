const express = require("express");
const { setAvailability, updateLocation, nearby } = require("../controllers/driver.controller");
const { protect, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { availabilityRules, locationRules, nearbyRules } = require("../validators");
const { ROLES } = require("../config/constants");

const router = express.Router();

router.patch(
  "/availability",
  protect,
  authorize(ROLES.DRIVER),
  availabilityRules,
  validate,
  setAvailability
);

router.patch("/location", protect, authorize(ROLES.DRIVER), locationRules, validate, updateLocation);
router.get("/nearby", protect, nearbyRules, validate, nearby);

module.exports = router;
