const mongoose = require("mongoose");
const { VEHICLE_TYPES, BOOKING_STATUS } = require("../config/constants");

const geoPointSchema = {
  address: { type: String, required: true, trim: true },
  type: { type: String, enum: ["Point"], default: "Point" },
  coordinates: {
    type: [Number],
    required: true,
    validate: {
      validator: (v) => Array.isArray(v) && v.length === 2,
      message: "Coordinates must be [longitude, latitude]",
    },
  },
};

const bookingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    pickupLocation: geoPointSchema,
    dropLocation: geoPointSchema,
    vehicleType: {
      type: String,
      enum: VEHICLE_TYPES,
      required: true,
    },
    fare: {
      estimated: { type: Number, required: true },
      final: { type: Number, default: null },
    },
    distanceKm: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING,
      index: true,
    },
    cancelledBy: {
      type: String,
      enum: ["customer", "driver", "admin", "system", null],
      default: null,
    },
    cancelReason: {
      type: String,
      default: null,
    },
    otp: {
      type: String,
      select: false,
    },
    rating: {
      score: { type: Number, min: 1, max: 5, default: null },
      comment: { type: String, default: null, maxlength: 300 },
      ratedAt: { type: Date, default: null },
    },
    timeline: {
      requestedAt: { type: Date, default: Date.now },
      acceptedAt: { type: Date, default: null },
      arrivedAt: { type: Date, default: null },
      startedAt: { type: Date, default: null },
      completedAt: { type: Date, default: null },
    },
    payment: {
      method: { type: String, enum: ["cash", "upi", "card", null], default: null },
      status: { type: String, enum: ["unpaid", "paid", "failed", "cod"], default: "unpaid" },
      amount: { type: Number, default: null },
      transactionId: { type: String, default: null },
      paidAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

bookingSchema.index({ pickupLocation: "2dsphere" });
bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ customer: 1, createdAt: -1 });
bookingSchema.index({ driver: 1, createdAt: -1 });

module.exports = mongoose.model("Booking", bookingSchema);
