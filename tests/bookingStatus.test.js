const { assertTransition } = require("../src/utils/bookingStatus");
const { BOOKING_STATUS } = require("../src/config/constants");
const ApiError = require("../src/utils/apiError");

describe("booking status machine", () => {
  test("allows pending -> accepted", () => {
    expect(() => assertTransition(BOOKING_STATUS.PENDING, BOOKING_STATUS.ACCEPTED)).not.toThrow();
  });

  test("blocks skipping arrived before start", () => {
    expect(() => assertTransition(BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.ONGOING)).toThrow(ApiError);
  });

  test("blocks changes after completed", () => {
    expect(() => assertTransition(BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED)).toThrow(ApiError);
  });
});
