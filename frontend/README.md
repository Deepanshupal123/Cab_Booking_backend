# RideNow frontend

React + Vite UI for the cab booking API. Covers customer, driver, and admin flows plus Socket.io live updates.

## Run

1. Start backend on port 5000 (`npm run dev` in repo root).
2. In this folder:

```bash
npm install
npm run dev
```

Opens http://localhost:3000 (`VITE_API_URL` in `.env`).

## Deploy on Vercel

1. Push this repo to GitHub.
2. Open [vercel.com](https://vercel.com) → **Add New** → **Project** → import the repo.
3. Set **Root Directory** to `frontend` (Edit, then select `frontend`).
4. Framework: **Vite** (auto).
5. Environment variable:

| Name | Value |
|---|---|
| `VITE_API_URL` | Live backend URL, e.g. `https://your-api.onrender.com` (no trailing slash) |

6. Deploy.

`localhost:5000` Vercel se **kaam nahi karega**. Pehle backend ko Render / Railway pe live karo, us URL ko `VITE_API_URL` me do.

Backend `.env` me:

```env
CLIENT_URL=https://your-app.vercel.app
```

Agar preview URLs bhi chahiye:

```env
CLIENT_URL=https://your-app.vercel.app,http://localhost:3000
```

Phir backend restart / redeploy.

## How to test a full trip

1. `npm run seed` in the backend (demo users, password `password123`).
2. Browser A: login `driver@demo.com` → set area to **Connaught Place** → **Go online**.
3. Browser B (incognito): login `customer@demo.com` → pickup Connaught Place, drop Hauz Khas, vehicle **car** → Estimate → Book now.
4. Driver: accept → arrived → enter customer OTP → start → complete.
5. Customer: rate the trip.
6. Admin: `admin@demo.com` for stats and user activate/deactivate.

Driver and customer pickup should be the same area so geospatial matching (5 km) works.
