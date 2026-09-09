const { STATUS_TRANSITIONS } = require("../config/constants");
const ApiError = require("./apiError");

const assertTransition = (from, to) => {
  const allowed = STATUS_TRANSITIONS[from] || [];
  if (!allowed.includes(to)) {
    throw ApiError.badRequest(`Cannot move booking from '${from}' to '${to}'`);
  }
};

module.exports = { assertTransition };
