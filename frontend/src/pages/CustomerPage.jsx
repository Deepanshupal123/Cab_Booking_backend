import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth";
import { connectSocket } from "../socket";
import { PLACES, statusLabel } from "../places";
import Shell from "../components/Shell";

export default function CustomerPage() {
  const { user } = useAuth();
  const [pickup, setPickup] = useState(PLACES[0].name);
  const [drop, setDrop] = useState(PLACES[2].name);
  const [vehicleType, setVehicleType] = useState("car");
  const [estimate, setEstimate] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [active, setActive] = useState(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [score, setScore] = useState(5);
  const [live, setLive] = useState(null);

  const pickupPlace = useMemo(() => PLACES.find((p) => p.name === pickup), [pickup]);
  const dropPlace = useMemo(() => PLACES.find((p) => p.name === drop), [drop]);

  const tripBody = () => ({
    pickupLocation: { address: pickupPlace.address, coordinates: pickupPlace.coordinates },
    dropLocation: { address: dropPlace.address, coordinates: dropPlace.coordinates },
    vehicleType,
  });

  const load = async () => {
    const res = await api("/api/bookings?limit=20");
    setBookings(res.data || []);
  };

  const openBooking = async (id) => {
    const res = await api(`/api/bookings/${id}`);
    setActive(res.data);
  };

  useEffect(() => {
    load().catch((e) => setErr(e.message));
    const socket = connectSocket(user.token);
    const refresh = (payload) => {
      setMsg(`Realtime: ${JSON.stringify(payload).slice(0, 80)}`);
      if (payload.bookingId) openBooking(payload.bookingId).catch(() => {});
      load().catch(() => {});
    };
    socket.on("bookingAccepted", refresh);
    socket.on("driverArrived", refresh);
    socket.on("tripStarted", refresh);
    socket.on("tripCompleted", refresh);
    socket.on("bookingCancelled", refresh);
    socket.on("driverLocationUpdate", (payload) => setLive(payload));
    return () => socket.disconnect();
  }, [user.token]);

  const runEstimate = async () => {
    setErr("");
    try {
      const res = await api("/api/bookings/estimate", { method: "POST", body: JSON.stringify(tripBody()) });
      setEstimate(res.data);
    } catch (e) {
      setErr(e.message);
    }
  };

  const book = async () => {
    setErr("");
    try {
      const res = await api("/api/bookings", { method: "POST", body: JSON.stringify(tripBody()) });
      setMsg(res.message);
      setActive(res.data);
      await load();
    } catch (e) {
      setErr(e.message);
    }
  };

  const cancel = async (id) => {
    try {
      await api(`/api/bookings/${id}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({ reason: "Cancelled from app" }),
      });
      await openBooking(id);
      await load();
    } catch (e) {
      setErr(e.message);
    }
  };

  const rate = async (id) => {
    try {
      await api(`/api/bookings/${id}/rate`, {
        method: "POST",
        body: JSON.stringify({ score: Number(score), comment: "Good ride" }),
      });
      await openBooking(id);
      setMsg("Rating saved");
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <Shell title="Book a ride" subtitle="Estimate fare, create a trip, watch live status">
      <div className="grid">
        <section className="card">
          <h2>New trip</h2>
          <label>
            Pickup
            <select value={pickup} onChange={(e) => setPickup(e.target.value)}>
              {PLACES.map((p) => (
                <option key={p.name}>{p.name}</option>
              ))}
            </select>
          </label>
          <label>
            Drop
            <select value={drop} onChange={(e) => setDrop(e.target.value)}>
              {PLACES.map((p) => (
                <option key={p.name}>{p.name}</option>
              ))}
            </select>
          </label>
          <label>
            Vehicle
            <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
              <option value="bike">Bike</option>
              <option value="auto">Auto</option>
              <option value="car">Car</option>
            </select>
          </label>
          <div className="row">
            <button type="button" className="ghost" onClick={runEstimate}>
              Estimate
            </button>
            <button type="button" className="primary" onClick={book}>
              Book now
            </button>
          </div>
          {estimate && (
            <p className="ok">
              {estimate.distanceKm} km · ₹{estimate.estimatedFare} ({estimate.vehicleType})
            </p>
          )}
        </section>

        <section className="card">
          <h2>Active booking</h2>
          {!active && <p className="muted">Create or select a booking.</p>}
          {active && (
            <>
              <p>
                <span className={`badge ${active.status}`}>{statusLabel(active.status)}</span>
              </p>
              <p>
                {active.pickupLocation?.address} → {active.dropLocation?.address}
              </p>
              <p>Fare: ₹{active.fare?.final || active.fare?.estimated}</p>
              {active.otp && (
                <p className="otp">
                  Trip OTP <strong>{active.otp}</strong>
                  <span className="muted"> Share with driver to start</span>
                </p>
              )}
              {live && <p className="ok">Driver GPS: {live.coordinates?.join(", ")}</p>}
              {["pending", "accepted", "arrived", "ongoing"].includes(active.status) && (
                <button type="button" className="ghost" onClick={() => cancel(active._id)}>
                  Cancel
                </button>
              )}
              {active.status === "completed" && !active.rating?.score && (
                <div className="row">
                  <select value={score} onChange={(e) => setScore(e.target.value)}>
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n} stars
                      </option>
                    ))}
                  </select>
                  <button type="button" className="primary" onClick={() => rate(active._id)}>
                    Rate trip
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {err && <p className="error">{err}</p>}
      {msg && <p className="ok">{msg}</p>}

      <section className="card">
        <h2>My bookings</h2>
        <div className="table">
          {bookings.map((b) => (
            <button key={b._id} className="row-btn" type="button" onClick={() => openBooking(b._id)}>
              <span className={`badge ${b.status}`}>{b.status}</span>
              <span>
                {b.pickupLocation?.address} → {b.dropLocation?.address}
              </span>
              <span>₹{b.fare?.estimated}</span>
            </button>
          ))}
          {!bookings.length && <p className="muted">No bookings yet.</p>}
        </div>
      </section>
    </Shell>
  );
}
