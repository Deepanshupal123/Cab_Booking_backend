const asyncHandler = require("express-async-handler");
const driverService = require("../services/driver.service");
const { ok, list } = require("../utils/apiResponse");

const setAvailability = asyncHandler(async (req, res) => {
  const data = await driverService.setAvailability(req.user._id, req.body.isAvailable);
  ok(res, data);
});

const updateLocation = asyncHandler(async (req, res) => {
  const data = await driverService.updateLocation(req.user, req.body, req.app.get("io"));
  ok(res, data);
});

const nearby = asyncHandler(async (req, res) => {
  const drivers = await driverService.findNearby(req.query);
  list(res, drivers);
});

module.exports = { setAvailability, updateLocation, nearby };
