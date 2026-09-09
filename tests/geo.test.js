const { getDistanceKm, calculateFare, generateOtp } = require("../src/utils/geo");

describe("geo utils", () => {
  test("computes haversine distance between Delhi and Noida-ish points", () => {
    const km = getDistanceKm([77.209, 28.6139], [77.391, 28.5355]);
    expect(km).toBeGreaterThan(15);
    expect(km).toBeLessThan(25);
  });

  test("returns 0 for identical coordinates", () => {
    expect(getDistanceKm([77.2, 28.6], [77.2, 28.6])).toBe(0);
  });
});

describe("fare calculation", () => {
  test("uses vehicle-specific base and per-km rates", () => {
    expect(calculateFare("bike", 10)).toBe(80);
    expect(calculateFare("auto", 10)).toBe(120);
    expect(calculateFare("car", 10)).toBe(190);
  });

  test("rounds to nearest rupee", () => {
    expect(calculateFare("car", 1.4)).toBe(70);
  });
});

describe("otp", () => {
  test("generates a 4-digit string", () => {
    const otp = generateOtp();
    expect(otp).toMatch(/^\d{4}$/);
  });
});
