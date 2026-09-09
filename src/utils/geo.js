const { BASE_FARE, PER_KM_RATE } = require("../config/constants");

const toRad = (deg) => (deg * Math.PI) / 180;

const getDistanceKm = ([lon1, lat1], [lon2, lat2]) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const calculateFare = (vehicleType, distanceKm) => {
  const base = BASE_FARE[vehicleType] ?? 30;
  const perKm = PER_KM_RATE[vehicleType] ?? 9;
  return Math.round(base + perKm * distanceKm);
};

const generateOtp = () => Math.floor(1000 + Math.random() * 9000).toString();

const toPoint = (coordinates) => ({
  type: "Point",
  coordinates,
});

module.exports = { getDistanceKm, calculateFare, generateOtp, toPoint };
