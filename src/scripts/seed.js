require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const env = require("../config/env");
const logger = require("../utils/logger");

const seed = async () => {
  await mongoose.connect(env.mongoUri);

  await User.deleteMany({ email: { $in: ["admin@demo.com", "driver@demo.com", "customer@demo.com"] } });

  await User.create([
    {
      name: "Demo Admin",
      email: "admin@demo.com",
      phone: "9000000001",
      password: "password123",
      role: "admin",
    },
    {
      name: "Demo Customer",
      email: "customer@demo.com",
      phone: "9000000002",
      password: "password123",
      role: "customer",
    },
    {
      name: "Demo Driver",
      email: "driver@demo.com",
      phone: "9000000003",
      password: "password123",
      role: "driver",
      vehicleType: "car",
      vehicleNumber: "DL01AB1234",
      isAvailable: true,
      currentLocation: { type: "Point", coordinates: [77.209, 28.6139] },
    },
  ]);

  logger.info("Seeded demo admin, customer, and driver (password: password123)");
  await mongoose.connection.close();
};

seed().catch(async (err) => {
  logger.error(err.message);
  await mongoose.connection.close();
  process.exit(1);
});
