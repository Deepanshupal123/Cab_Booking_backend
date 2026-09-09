const asyncHandler = require("express-async-handler");
const adminService = require("../services/admin.service");
const { ok, list } = require("../utils/apiResponse");

const stats = asyncHandler(async (_req, res) => {
  ok(res, await adminService.getStats());
});

const users = asyncHandler(async (req, res) => {
  const { items, pagination } = await adminService.listUsers(req.query);
  list(res, items, { pagination });
});

const setUserStatus = asyncHandler(async (req, res) => {
  const user = await adminService.setUserActive(req.params.id, req.body.isActive);
  ok(res, user);
});

module.exports = { stats, users, setUserStatus };
