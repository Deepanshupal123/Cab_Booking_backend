const { generateToken, verifyToken } = require("../src/utils/token");

describe("jwt helpers", () => {
  test("signs and verifies a token payload", () => {
    const token = generateToken("user123", "customer");
    const decoded = verifyToken(token);
    expect(decoded.id).toBe("user123");
    expect(decoded.role).toBe("customer");
  });
});
