const request = require("supertest");
const createApp = require("../src/app");
const { estimateTrip } = require("../src/services/booking.service");

describe("health endpoint", () => {
  test("returns success payload", async () => {
    const app = createApp();
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty("database");
  });

  test("returns 404 json for unknown routes", async () => {
    const app = createApp();
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe("estimateTrip service", () => {
  test("returns distance and fare without persisting", () => {
    const result = estimateTrip({
      pickupLocation: { address: "A", coordinates: [77.209, 28.6139] },
      dropLocation: { address: "B", coordinates: [77.219, 28.6239] },
      vehicleType: "car",
    });
    expect(result.distanceKm).toBeGreaterThan(0);
    expect(result.estimatedFare).toBeGreaterThan(50);
    expect(result.vehicleType).toBe("car");
  });
});
