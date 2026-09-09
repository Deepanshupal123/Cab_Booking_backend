import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth";
import { connectSocket } from "../socket";
import { PLACES, statusLabel } from "../places";
import Shell from "../components/Shell";
import LocationSearch from "../components/LocationSearch";
import MapEmbed from "../components/MapEmbed";

export default function CustomerPage() {
  const { user, login } = useAuth();
  const [phoneInput, setPhoneInput] = useState("");
  const [pickupPlace, setPickupPlace] = useState(PLACES[0]);
  const [dropPlace, setDropPlace] = useState(PLACES[2]);
  const [vehicleType, setVehicleType] = useState("car");
  const [estimate, setEstimate] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [active, setActive] = useState(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [score, setScore] = useState(5);
  const [payMethod, setPayMethod] = useState("upi");
  const [live, setLive] = useState(null);
  const [nearby, setNearby] = useState([]);

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

  useEffect(() => {
    const [lng, lat] = pickupPlace.coordinates;
    api(`/api/drivers/nearby?lng=${lng}&lat=${lat}&vehicleType=${vehicleType}&radiusKm=8`)
      .then((res) => setNearby(res.data || []))
      .catch(() => setNearby([]));
    api("/api/bookings/estimate", { method: "POST", body: JSON.stringify(tripBody()) })
      .then((res) => setEstimate(res.data))
      .catch(() => setEstimate(null));
  }, [pickupPlace, dropPlace, vehicleType]);

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
    if (
      pickupPlace.coordinates[0] === dropPlace.coordinates[0] &&
      pickupPlace.coordinates[1] === dropPlace.coordinates[1]
    ) {
      setErr("Pickup and drop must be different");
      return;
    }
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
      await api(`/api/bookings/${id}/cancel`, { method: "PATCH", body: JSON.stringify({ reason: "Cancelled from app" }) });
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
      setMsg("Thanks for rating");
    } catch (e) {
      setErr(e.message);
    }
  };

  const pay = async (id) => {
    try {
      if (payMethod === "cash") {
        const res = await api(`/api/bookings/${id}/pay`, {
          method: "POST",
          body: JSON.stringify({ method: "cash" }),
        });
        setActive(res.data);
        setMsg("Cash on delivery selected. Pay the driver in cash.");
        await load();
        return;
      }
      const cfg = await api("/api/payments/config");
      if (!cfg.data.enabled) {
        setErr("Razorpay keys missing. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend .env (test mode).");
        return;
      }
      if (!window.Razorpay) {
        setErr("Razorpay script not loaded. Refresh the page.");
        return;
      }
      const order = await api("/api/payments/create-order", {
        method: "POST",
        body: JSON.stringify({ bookingId: id }),
      });
      const rzp = new window.Razorpay({
        key: order.data.keyId,
        amount: order.data.amount,
        currency: order.data.currency,
        order_id: order.data.orderId,
        name: "RideNow",
        description: "Trip payment",
        handler: async (response) => {
          const verified = await api("/api/payments/verify", {
            method: "POST",
            body: JSON.stringify({ bookingId: id, ...response }),
          });
          setActive(verified.data);
          setMsg(`Paid · ${verified.data.payment.transactionId}`);
          await load();
        },
      });
      rzp.open();
    } catch (e) {
      setErr(e.message);
    }
  };

  const fare = active?.fare?.final || active?.fare?.estimated;
  const hasRealPhone = /^[6-9][0-9]{9}$/.test(String(user?.phone || ""));

  const savePhone = async () => {
    try {
      const res = await api("/api/auth/phone", {
        method: "PATCH",
        body: JSON.stringify({ phone: phoneInput }),
      });
      login({ ...user, phone: res.data.phone, token: user.token });
      setMsg("Phone saved. Next booking OTP can go to this number.");
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <Shell theme="customer" title="Customer dashboard" subtitle="Plan a trip, track OTP, pay after the ride">
      {!hasRealPhone && (
        <section className="card">
          <h2>Save mobile for OTP SMS</h2>
          <p className="muted">OTP tabhi number pe jayegi jab valid 10-digit number save ho aur Fast2SMS key backend .env me ho.</p>
          <div className="row">
            <input value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} placeholder="98XXXXXXXX" maxLength={10} />
            <button type="button" className="primary" onClick={savePhone}>
              Save number
            </button>
          </div>
        </section>
      )}
      <div className="grid">
        <section className="card">
          <h2>Plan your ride</h2>
          <LocationSearch label="Pickup" value={pickupPlace} onSelect={setPickupPlace} placeholder="Search pickup…" />
          <LocationSearch label="Drop" value={dropPlace} onSelect={setDropPlace} placeholder="Search drop…" />
          <MapEmbed
            pickup={pickupPlace.coordinates}
            drop={dropPlace.coordinates}
            title={estimate ? `Route · ${estimate.distanceKm} km · ₹${estimate.estimatedFare}` : "Google Maps route"}
          />
          <div className="vehicle-row">
            {["bike", "auto", "car"].map((v) => (
              <button key={v} type="button" className={vehicleType === v ? "chip on" : "chip"} onClick={() => setVehicleType(v)}>
                {v}
              </button>
            ))}
          </div>
          <div className="row">
            <button type="button" className="ghost" onClick={runEstimate}>
              Estimate fare
            </button>
            <button type="button" className="primary" onClick={book}>
              Book now
            </button>
          </div>
          {estimate && (
            <div className="fare-box">
              <strong>₹{estimate.estimatedFare}</strong>
              <span>
                {estimate.distanceKm} km · {estimate.vehicleType}
              </span>
            </div>
          )}
          <div className="avail-box">
            <h3>Drivers online near pickup</h3>
            {!nearby.length && <p className="muted">No {vehicleType} drivers nearby right now.</p>}
            {nearby.map((d) => (
              <p key={d._id}>
                {d.name} · {d.vehicleType} · {d.vehicleNumber} · ★{d.rating?.average ?? d.rating}
              </p>
            ))}
          </div>
        </section>

        <section className="card highlight">
          <h2>Live trip</h2>
          {!active && <p className="muted">Your current ride details will show here.</p>}
          {active && (
            <>
              <p>
                <span className={`badge ${active.status}`}>{statusLabel(active.status)}</span>
                {active.payment?.status === "paid" && <span className="badge completed">paid</span>}
              </p>
              <p className="route">
                {active.pickupLocation?.address}
                <span> → </span>
                {active.dropLocation?.address}
              </p>
              <p className="fare-line">Amount due ₹{fare}</p>
              {active.pickupLocation?.coordinates && active.dropLocation?.coordinates && (
                <MapEmbed
                  pickup={active.pickupLocation.coordinates}
                  drop={active.dropLocation.coordinates}
                  title="Google Maps route"
                />
              )}
              {active.otp && active.status !== "completed" && (
                <div className="otp-box">
                  <span>OTP SMS se nahi jaati. Yeh code isi screen pe hai — driver ko bolo.</span>
                  <strong>{active.otp}</strong>
                </div>
              )}
              {live && <p className="ok">Driver moving · {live.coordinates?.join(", ")}</p>}
              {["pending", "accepted", "arrived", "ongoing"].includes(active.status) && (
                <button type="button" className="ghost" onClick={() => cancel(active._id)}>
                  Cancel ride
                </button>
              )}
              {active.status === "completed" && active.payment?.status !== "paid" && active.payment?.status !== "cod" && (
                <div className="pay-box">
                  <h3>Pay for this trip</h3>
                  <div className="vehicle-row">
                    <button type="button" className={payMethod === "upi" ? "chip on" : "chip"} onClick={() => setPayMethod("upi")}>
                      UPI / Card (Razorpay)
                    </button>
                    <button type="button" className={payMethod === "cash" ? "chip on" : "chip"} onClick={() => setPayMethod("cash")}>
                      Cash on delivery
                    </button>
                  </div>
                  <button type="button" className="primary" onClick={() => pay(active._id)}>
                    {payMethod === "cash" ? "Confirm COD" : `Pay ₹${fare} with Razorpay`}
                  </button>
                </div>
              )}
              {active.payment?.status === "cod" && (
                <p className="ok">Cash on delivery. Pay the driver in cash.</p>
              )}
              {active.payment?.status === "paid" && (
                <p className="ok">
                  Paid {active.payment.method} · {active.payment.transactionId}
                </p>
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
                  <button type="button" className="ghost" onClick={() => rate(active._id)}>
                    Rate driver
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
        <h2>Trip history</h2>
        {bookings.map((b) => (
          <button key={b._id} className="row-btn" type="button" onClick={() => openBooking(b._id)}>
            <span className={`badge ${b.status}`}>{b.status}</span>
            <span>
              {b.pickupLocation?.address} → {b.dropLocation?.address}
            </span>
            <span>₹{b.fare?.estimated}</span>
          </button>
        ))}
        {!bookings.length && <p className="muted">No trips yet.</p>}
      </section>
    </Shell>
  );
}
