import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth";
import { connectSocket } from "../socket";
import { PLACES, statusLabel } from "../places";
import Shell from "../components/Shell";
import LocationSearch from "../components/LocationSearch";
import MapEmbed from "../components/MapEmbed";

const LIVE = ["accepted", "arrived", "ongoing"];

export default function DriverPage() {
  const { user } = useAuth();
  const [online, setOnline] = useState(Boolean(user?.isAvailable));
  const [zone, setZone] = useState(PLACES[0]);
  const [bookings, setBookings] = useState([]);
  const [active, setActive] = useState(null);
  const [otp, setOtp] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const coords = zone.coordinates;

  const load = async () => {
    const res = await api("/api/bookings?limit=30");
    const items = res.data || [];
    setBookings(items);
    const current = items.find((b) => LIVE.includes(b.status));
    setActive((prev) => {
      if (current) return current;
      if (prev && LIVE.includes(prev.status)) {
        return items.find((b) => b._id === prev._id) || null;
      }
      return prev;
    });
    if (current) setOnline(true);
    return items;
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
      setMsg(`New ride request · ₹${payload.fare} · ${payload.distanceKm} km`);
      load().catch(() => {});
      if (payload.bookingId) openBooking(payload.bookingId).catch(() => {});
    });
    socket.on("bookingCancelled", () => load().catch(() => {}));
    return () => socket.disconnect();
  }, [user.token]);

  useEffect(() => {
    if (!online) return undefined;
    pushLocation().catch((e) => setErr(e.message));
    const t = setInterval(() => pushLocation().catch(() => {}), 8000);
    return () => clearInterval(t);
  }, [online, zone]);

  const toggleOnline = async () => {
    setErr("");
    try {
      if (!online) await pushLocation();
      const res = await api("/api/drivers/availability", {
        method: "PATCH",
        body: JSON.stringify({ isAvailable: !online }),
      });
      setOnline(res.data.isAvailable);
      setMsg(res.data.isAvailable ? "You are online for rides" : "You are offline");
    } catch (e) {
      setErr(e.message);
      await load().catch(() => {});
    }
  };

  const actOn = async (id, path, body) => {
    setErr("");
    try {
      const res = await api(`/api/bookings/${id}/${path}`, {
        method: "PATCH",
        body: body ? JSON.stringify(body) : "{}",
      });
      setActive(res.data);
      setMsg(res.message || "Updated");
      setOtp("");
      await load();
    } catch (e) {
      setErr(e.message);
      const items = await load().catch(() => []);
      const current = items.find((b) => LIVE.includes(b.status));
      if (current) setActive(current);
    }
  };

  const act = async (path, body) => {
    if (!active?._id) return;
    await actOn(active._id, path, body);
  };

  const pending = bookings.filter((b) => b.status === "pending");
  const mine = bookings.filter((b) => b.status !== "pending");

  return (
    <Shell theme="driver" title="Driver dashboard" subtitle="Go online, take jobs, collect OTP, finish trip">
      <section className={`status-banner ${online ? "on" : ""}`}>
        <div>
          <strong>{online ? "Online" : "Offline"}</strong>
          <p>
            {LIVE.includes(active?.status)
              ? "Current trip is open below. Finish or cancel it before taking a new request."
              : "Set your area same as customer pickup, then go online and Accept ride."}
          </p>
        </div>
        <button type="button" className={online ? "ghost" : "primary"} onClick={toggleOnline}>
          {online ? "Go offline" : "Go online"}
        </button>
      </section>

      <div className="grid">
        <section className="card">
          <h2>Your zone</h2>
          <LocationSearch label="Search your live area" value={zone} onSelect={setZone} placeholder="Type any location…" />
          <MapEmbed point={zone.coordinates} title="Your current zone on Google Maps" />
          <p className="muted">Matching uses this GPS point (5 km). Stay near the customer pickup.</p>
        </section>

        <section className="card highlight">
          <h2>Active job</h2>
          {!active && <p className="muted">Go online, then Accept a request from Incoming.</p>}
          {active && (
            <>
              <p>
                <span className={`badge ${active.status}`}>{statusLabel(active.status)}</span>
              </p>
              <p className="route">
                {active.pickupLocation?.address} → {active.dropLocation?.address}
              </p>
              <p className="fare-line">Fare ₹{active.fare?.estimated}</p>
              {active.pickupLocation?.coordinates && active.dropLocation?.coordinates && (
                <MapEmbed
                  pickup={active.pickupLocation.coordinates}
                  drop={active.dropLocation.coordinates}
                  title="Navigate pickup → drop"
                />
              )}
              {active.payment?.status === "paid" && (
                <p className="ok">Customer paid · {active.payment.method} · {active.payment.transactionId}</p>
              )}
              {active.payment?.status === "cod" && (
                <p className="ok">Customer chose cash on delivery</p>
              )}
              <div className="row wrap">
                {active.status === "pending" && (
                  <button type="button" className="primary" onClick={() => act("accept")}>
                    Accept ride
                  </button>
                )}
                {["accepted", "arrived"].includes(active.status) && (
                  <>
                    <p className="muted">Customer ke phone pe SMS nahi jaati. Unki RideNow screen ka 4-digit OTP maango, phir Start ride dabao.</p>
                    <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter customer OTP" maxLength={4} />
                    <button type="button" className="primary" onClick={() => act("start", { otp })}>
                      Start ride
                    </button>
                    {active.status === "accepted" && (
                      <button type="button" className="ghost" onClick={() => act("arrived")}>
                        Arrived at pickup
                      </button>
                    )}
                  </>
                )}
                {active.status === "ongoing" && (
                  <button type="button" className="primary" onClick={() => act("complete")}>
                    Complete trip
                  </button>
                )}
                {active.status === "completed" && active.payment?.status === "cod" && (
                  <button
                    type="button"
                    className="primary"
                    onClick={() => act("collect-cash")}
                  >
                    Cash collected
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
        <h2>Incoming requests</h2>
        {pending.map((b) => (
          <div key={b._id} className="job-card">
            <div>
              <span className="badge pending">pending</span>
              <p className="route">
                {b.pickupLocation?.address} → {b.dropLocation?.address}
              </p>
              <p>₹{b.fare?.estimated} · {b.vehicleType} · {b.distanceKm} km</p>
            </div>
            <button
              type="button"
              className="primary"
              disabled={LIVE.includes(active?.status) && active?._id !== b._id}
              onClick={() => actOn(b._id, "accept")}
            >
              Accept ride
            </button>
          </div>
        ))}
        {!pending.length && <p className="muted">No open requests. Stay online near pickup.</p>}
      </section>
      <section className="card">
        <h2>My trips</h2>
        {mine.map((b) => (
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
