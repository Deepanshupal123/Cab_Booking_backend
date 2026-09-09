const ROLES = Object.freeze({
  CUSTOMER: "customer",
  DRIVER: "driver",
  ADMIN: "admin",
});

const VEHICLE_TYPES = Object.freeze(["bike", "auto", "car"]);

const BOOKING_STATUS = Object.freeze({
  PENDING: "pending",
  ACCEPTED: "accepted",
  ARRIVED: "arrived",
  ONGOING: "ongoing",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
});

const ACTIVE_TRIP_STATUSES = [
  BOOKING_STATUS.ACCEPTED,
  BOOKING_STATUS.ARRIVED,
  BOOKING_STATUS.ONGOING,
];

const STATUS_TRANSITIONS = Object.freeze({
  [BOOKING_STATUS.PENDING]: [BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.CANCELLED],
  [BOOKING_STATUS.ACCEPTED]: [BOOKING_STATUS.ARRIVED, BOOKING_STATUS.ONGOING, BOOKING_STATUS.CANCELLED],
  [BOOKING_STATUS.ARRIVED]: [BOOKING_STATUS.ONGOING, BOOKING_STATUS.CANCELLED],
  [BOOKING_STATUS.ONGOING]: [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED],
  [BOOKING_STATUS.COMPLETED]: [],
  [BOOKING_STATUS.CANCELLED]: [],
});

const BASE_FARE = Object.freeze({ bike: 20, auto: 30, car: 50 });
const PER_KM_RATE = Object.freeze({ bike: 6, auto: 9, car: 14 });

const SOCKET_EVENTS = Object.freeze({
  NEW_BOOKING_REQUEST: "newBookingRequest",
  BOOKING_ACCEPTED: "bookingAccepted",
  DRIVER_ARRIVED: "driverArrived",
  TRIP_STARTED: "tripStarted",
  TRIP_COMPLETED: "tripCompleted",
  BOOKING_CANCELLED: "bookingCancelled",
  DRIVER_LOCATION_UPDATE: "driverLocationUpdate",
});

module.exports = {
  ROLES,
  VEHICLE_TYPES,
  BOOKING_STATUS,
  ACTIVE_TRIP_STATUSES,
  STATUS_TRANSITIONS,
  BASE_FARE,
  PER_KM_RATE,
  SOCKET_EVENTS,
};
