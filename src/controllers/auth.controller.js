const asyncHandler = require("express-async-handler");
const authService = require("../services/auth.service");
const { created, ok } = require("../utils/apiResponse");

const register = asyncHandler(async (req, res) => {
  const data = await authService.register(req.body);
  created(res, data, "Registered successfully");
});

const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body);
  ok(res, data, "Logged in successfully");
});

const me = asyncHandler(async (req, res) => {
  ok(res, req.user);
});

module.exports = { register, login, me };
