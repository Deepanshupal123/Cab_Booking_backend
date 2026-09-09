const User = require("../models/User");
const Booking = require("../models/Booking");
const ApiError = require("../utils/apiError");
const { BOOKING_STATUS, ROLES } = require("../config/constants");

const listUsers = async ({ role, page = 1, limit = 20 }) => {
  const filter = {};
  if (role) filter.role = role;
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Math.max(1, Number(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    User.countDocuments(filter),
  ]);

  return {
    items,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) || 1 },
  };
};

const setUserActive = async (userId, isActive) => {
  const user = await User.findByIdAndUpdate(userId, { isActive, isAvailable: false }, { new: true });
  if (!user) throw ApiError.notFound("User not found");
  return user;
};

const getStats = async () => {
  const [users, driversOnline, bookings, byStatus] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: ROLES.DRIVER, isAvailable: true, isActive: true }),
    Booking.countDocuments(),
    Booking.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);

  const statusMap = Object.values(BOOKING_STATUS).reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {});
  byStatus.forEach((row) => {
    statusMap[row._id] = row.count;
  });

  return { users, driversOnline, bookings, bookingsByStatus: statusMap };
};

module.exports = { listUsers, setUserActive, getStats };
