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
  const { name, email, password, role, vehicleType, vehicleNumber, phone } = payload;
  const safeRole = role === ROLES.DRIVER ? ROLES.DRIVER : ROLES.CUSTOMER;
  const phoneNorm = String(phone || "").replace(/\D/g, "").slice(-10);
  if (!/^[6-9][0-9]{9}$/.test(phoneNorm)) {
    throw ApiError.badRequest("Enter a valid 10-digit Indian mobile number");
  }
  const emailNorm = String(email).toLowerCase().trim();

  const existing = await User.findOne({ $or: [{ email: emailNorm }, { phone: phoneNorm }] });
  if (existing) {
    throw ApiError.conflict("User already exists with this email or phone");
  }

  if (safeRole === ROLES.DRIVER && (!vehicleType || !vehicleNumber)) {
    throw ApiError.badRequest("Vehicle type and number are required for drivers");
  }

  const user = await User.create({
    name,
    email: emailNorm,
    phone: phoneNorm,
    password,
    role: safeRole,
    vehicleType: safeRole === ROLES.DRIVER ? vehicleType : null,
    vehicleNumber: safeRole === ROLES.DRIVER ? vehicleNumber : null,
  });

  return toAuthPayload(user);
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select("+password");
  if (!user || !(await user.matchPassword(password))) {
    throw ApiError.unauthorized("Invalid email or password");
  }
  if (!user.isActive) {
    throw ApiError.forbidden("Account has been deactivated");
  }
  return toAuthPayload(user);
};

const updatePhone = async (userId, phone) => {
  const phoneNorm = String(phone || "").replace(/\D/g, "").slice(-10);
  if (!/^[6-9][0-9]{9}$/.test(phoneNorm)) {
    throw ApiError.badRequest("Enter a valid 10-digit Indian mobile number");
  }
  const taken = await User.findOne({ phone: phoneNorm, _id: { $ne: userId } });
  if (taken) throw ApiError.conflict("This phone is already used");
  const user = await User.findByIdAndUpdate(userId, { phone: phoneNorm }, { new: true });
  return user;
};

module.exports = { register, login, updatePhone };
