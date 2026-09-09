import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth";
import { connectSocket } from "../socket";
import { PLACES, statusLabel } from "../places";
import Shell from "../components/Shell";

export default function DriverPage() {
  const { user } = useAuth();
  const [online, setOnline] = useState(false);
  const [place, setPlace] = useState(PLACES[0].name);
  const [bookings, setBookings] = useState([]);
  const [active, setActive] = useState(null);
  const [otp, setOtp] = useState("");
  const [nearby, setNearby] = useState([]);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const coords = PLACES.find((p) => p.name === place).coordinates;

  const load = async () => {
    const res = await api("/api/bookings?limit=30");
    setBookings(res.data || []);
  };

  const openBooking = async (id) => {
    const res = await api(`/api/bookings/${id}`);
    setActive(res.data);
  };

  const pushLocation = async () => {
    await api("/api/drivers/location", {
      method: "PATCH",
      body: JSON.stringify({ longitude: coords[0], latitude: coords[1] }),
    });
  };

  useEffect(() => {
    load().catch((e) => setErr(e.message));
    const socket = connectSocket(user.token);
    socket.on("newBookingRequest", (payload) => {
      setMsg(`New request nearby · ₹${payload.fare}`);
      load().catch(() => {});
    });
    socket.on("bookingCancelled", () => load().catch(() => {}));
    return () => socket.disconnect();
  }, [user.token]);

  useEffect(() => {
    if (!online) return undefined;
    pushLocation().catch((e) => setErr(e.message));
    const t = setInterval(() => pushLocation().catch(() => {}), 8000);
    return () => clearInterval(t);
  }, [online, place]);

  const toggleOnline = async () => {
    setErr("");
    try {
      if (!online) await pushLocation();
      const res = await api("/api/drivers/availability", {
        method: "PATCH",
        body: JSON.stringify({ isAvailable: !online }),
      });
      setOnline(res.data.isAvailable);
      setMsg(res.data.isAvailable ? "You are online" : "You are offline");
    } catch (e) {
      setErr(e.message);
    }
  };

  const findNearby = async () => {
    try {
      const res = await api(
        `/api/drivers/nearby?lng=${coords[0]}&lat=${coords[1]}&vehicleType=car&radiusKm=8`
      );
      setNearby(res.data || []);
    } catch (e) {
      setErr(e.message);
    }
  };

  const act = async (path, body) => {
    setErr("");
    try {
      const res = await api(`/api/bookings/${active._id}/${path}`, {
        method: path === "rate" ? "POST" : "PATCH",
        body: body ? JSON.stringify(body) : undefined,
      });
      setActive(res.data);
      setMsg(res.message || "Updated");
      await load();
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <Shell title="Driver console" subtitle="Go online, accept trips, complete with OTP">
      <div className="grid">
        <section className="card">
          <h2>Availability</h2>
          <label>
            Current area (GPS for matching)
            <select value={place} onChange={(e) => setPlace(e.target.value)}>
              {PLACES.map((p) => (
                <option key={p.name}>{p.name}</option>
              ))}
            </select>
          </label>
          <div className="row">
            <button type="button" className={online ? "primary" : "ghost"} onClick={toggleOnline}>
              {online ? "Go offline" : "Go online"}
            </button>
            <button type="button" className="ghost" onClick={findNearby}>
              Nearby drivers
            </button>
          </div>
          <p className="muted">Stay online near the customer pickup so matching works (5 km radius).</p>
          {!!nearby.length && (
            <ul>
              {nearby.map((d) => (
                <li key={d._id}>
                  {d.name} · {d.vehicleType} · {d.vehicleNumber}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <h2>Selected trip</h2>
          {!active && <p className="muted">Pick a pending or assigned booking.</p>}
          {active && (
            <>
              <p>
                <span className={`badge ${active.status}`}>{statusLabel(active.status)}</span>
              </p>
              <p>
                {active.pickupLocation?.address} → {active.dropLocation?.address}
              </p>
              <p>₹{active.fare?.estimated}</p>
              <div className="row wrap">
                {active.status === "pending" && (
                  <button type="button" className="primary" onClick={() => act("accept")}>
                    Accept
                  </button>
                )}
                {active.status === "accepted" && (
                  <button type="button" className="primary" onClick={() => act("arrived")}>
                    Arrived
                  </button>
                )}
                {active.status === "arrived" && (
                  <>
                    <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Customer OTP" maxLength={4} />
                    <button type="button" className="primary" onClick={() => act("start", { otp })}>
                      Start trip
                    </button>
                  </>
                )}
                {active.status === "ongoing" && (
                  <button type="button" className="primary" onClick={() => act("complete")}>
                    Complete
                  </button>
                )}
                {["pending", "accepted", "arrived", "ongoing"].includes(active.status) && (
                  <button type="button" className="ghost" onClick={() => act("cancel", { reason: "Driver cancelled" })}>
                    Cancel
                  </button>
                )}
              </div>
            </>
          )}
        </section>
      </div>
      {err && <p className="error">{err}</p>}
      {msg && <p className="ok">{msg}</p>}
      <section className="card">
        <h2>Jobs</h2>
        {bookings.map((b) => (
          <button key={b._id} className="row-btn" type="button" onClick={() => openBooking(b._id)}>
            <span className={`badge ${b.status}`}>{b.status}</span>
            <span>
              {b.pickupLocation?.address} → {b.dropLocation?.address}
            </span>
            <span>₹{b.fare?.estimated}</span>
          </button>
        ))}
      </section>
    </Shell>
  );
}
