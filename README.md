# Cab Booking Backend

REST API for an Uber/Ola-style ride platform. Customers request trips, drivers are matched with MongoDB geospatial queries, and trip updates are pushed over Socket.io.

## What this project demonstrates

- Layered Node.js architecture: routes → controllers → services → models
- JWT auth with role-based access (`customer`, `driver`, `admin`)
- Geospatial nearest-driver matching (`2dsphere`)
- Booking lifecycle as an explicit status machine
- Real-time events (Socket.io rooms per user)
- Input validation, rate limiting, Helmet, centralized errors

## Architecture

```
src/
  app.js                 Express app (middleware + routes)
  server.js              HTTP server, Socket.io, graceful shutdown
  config/                Env validation, DB, domain constants
  routes/                HTTP route maps
  controllers/           Request/response only
  services/              Business rules
  models/                Mongoose schemas
  middleware/            Auth, validation, errors
  validators/            express-validator rules
  socket/                Auth handshake + rooms
  utils/                 Geo/fare, JWT, logger, ApiError
  scripts/seed.js        Demo users
```

## Booking lifecycle

`pending → accepted → arrived → ongoing → completed`  
Cancel is allowed until the trip is completed.

Start-trip requires a 4-digit OTP shown only to the customer. Driver accept is atomic (`findOneAndUpdate` on `pending`) so two drivers cannot take the same ride.

## API

Base URL: `http://localhost:5000`

### Auth
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register customer or driver |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/me` | Private | Current profile |

### Drivers
| Method | Route | Access | Description |
|---|---|---|---|
| PATCH | `/api/drivers/availability` | Driver | Online / offline |
| PATCH | `/api/drivers/location` | Driver | Live GPS (`longitude`, `latitude`) |
| GET | `/api/drivers/nearby` | Private | Nearby available drivers |

### Bookings
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/bookings/estimate` | Customer | Distance + fare preview |
| POST | `/api/bookings` | Customer | Create booking + notify nearest driver |
| GET | `/api/bookings` | Private | Paginated list (`page`, `limit`, `status`) |
| GET | `/api/bookings/:id` | Private | Booking detail (OTP only for customer) |
| PATCH | `/api/bookings/:id/accept` | Driver | Accept pending booking |
| PATCH | `/api/bookings/:id/arrived` | Driver | Arrived at pickup |
| PATCH | `/api/bookings/:id/start` | Driver | Start trip (`otp`) |
| PATCH | `/api/bookings/:id/complete` | Driver | Complete trip |
| PATCH | `/api/bookings/:id/cancel` | Customer/Driver/Admin | Cancel |
| POST | `/api/bookings/:id/rate` | Customer | Rate completed trip (1–5) |

### Admin
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/admin/stats` | Admin | Users, online drivers, bookings by status |
| GET | `/api/admin/users` | Admin | Paginated users |
| PATCH | `/api/admin/users/:id/status` | Admin | Activate / deactivate |

### Health
`GET /api/health` — process uptime and Mongo connection state.

## Socket.io events

Connect with `handshake.auth.token` (JWT). Users join `customer_<id>` or `driver_<id>`.

| Event | To | When |
|---|---|---|
| `newBookingRequest` | Driver | Nearby match on create |
| `bookingAccepted` | Customer | Driver accepted |
| `driverArrived` | Customer | Driver at pickup |
| `tripStarted` | Customer | OTP verified |
| `tripCompleted` | Customer | Trip finished |
| `bookingCancelled` | Both | Cancel |
| `driverLocationUpdate` | Customer | Driver GPS during an active trip |

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

MongoDB is required (`MONGO_URI`). Optional demo users:

```bash
npm run seed
```

| Email | Password | Role |
|---|---|---|
| `admin@demo.com` | `password123` | admin |
| `customer@demo.com` | `password123` | customer |
| `driver@demo.com` | `password123` | driver (car, near Delhi) |

Auth header: `Authorization: Bearer <token>`

### Example: create a booking

```json
POST /api/bookings
{
  "pickupLocation": {
    "address": "Connaught Place, Delhi",
    "coordinates": [77.2167, 28.6333]
  },
  "dropLocation": {
    "address": "Hauz Khas, Delhi",
    "coordinates": [77.2066, 28.5494]
  },
  "vehicleType": "car"
}
```

Coordinates are `[longitude, latitude]`.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Nodemon |
| `npm start` | Production process |
| `npm run seed` | Demo users |

## Fare

| Type | Base | Per km |
|---|---|---|
| bike | 20 | 6 |
| auto | 30 | 9 |
| car | 50 | 14 |

Distance uses the Haversine formula.

## License

MIT
