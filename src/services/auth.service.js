const User = require("../models/User");
const { generateToken } = require("../utils/token");
const ApiError = require("../utils/apiError");
const { ROLES } = require("../config/constants");

const toAuthPayload = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  token: generateToken(user._id, user.role),
});

const register = async (payload) => {
  const { name, email, phone, password, role, vehicleType, vehicleNumber } = payload;
  const safeRole = role === ROLES.DRIVER ? ROLES.DRIVER : ROLES.CUSTOMER;

  const existing = await User.findOne({ $or: [{ email }, { phone }] });
  if (existing) {
    throw ApiError.conflict("User already exists with this email or phone");
  }

  if (safeRole === ROLES.DRIVER && (!vehicleType || !vehicleNumber)) {
    throw ApiError.badRequest("Vehicle type and number are required for drivers");
  }

  const user = await User.create({
    name,
    email,
    phone,
    password,
    role: safeRole,
    vehicleType: safeRole === ROLES.DRIVER ? vehicleType : null,
    vehicleNumber: safeRole === ROLES.DRIVER ? vehicleNumber : null,
  });

  return toAuthPayload(user);
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.matchPassword(password))) {
    throw ApiError.unauthorized("Invalid email or password");
  }
  if (!user.isActive) {
    throw ApiError.forbidden("Account has been deactivated");
  }
  return toAuthPayload(user);
};

module.exports = { register, login };
