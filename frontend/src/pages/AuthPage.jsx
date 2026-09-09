import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";

export default function AuthPage({ mode }) {
  const isLogin = mode === "login";
  const isDriver = mode === "register-driver";
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    vehicleType: "car",
    vehicleNumber: "",
  });

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const goHome = (role) => {
    if (role === "driver") return "/driver";
    if (role === "admin") return "/admin";
    return "/app";
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        const res = await api("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        login(res.data);
        navigate(goHome(res.data.role));
      } else {
        const payload = {
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          role: isDriver ? "driver" : "customer",
        };
        if (isDriver) {
          payload.vehicleType = form.vehicleType;
          payload.vehicleNumber = form.vehicleNumber;
        }
        const res = await api("/api/auth/register", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        login(res.data);
        navigate(goHome(res.data.role));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`auth-wrap ${isDriver ? "theme-driver" : ""}`}>
      <div className="auth-card">
        <p className="brand">{isDriver ? "RideNow Driver" : "RideNow"}</p>
        <h1>{isLogin ? "Welcome back" : isDriver ? "Join as driver" : "Create customer account"}</h1>
        <p className="muted">
          {isLogin ? "Customer, driver, and admin login." : isDriver ? "Vehicle details required." : "Book rides in minutes."}
        </p>

        <form onSubmit={submit} className="stack">
          {!isLogin && (
            <>
            <label>
              Name
              <input name="name" value={form.name} onChange={onChange} required />
            </label>
            <label>
              Mobile number
              <input name="phone" value={form.phone} onChange={onChange} required placeholder="10 digit Indian number" maxLength={10} />
            </label>
            </>
          )}
          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={onChange} required />
          </label>
          <label>
            Password
            <input name="password" type="password" value={form.password} onChange={onChange} required minLength={6} />
          </label>
          {isDriver && (
            <div className="grid-2">
              <label>
                Vehicle
                <select name="vehicleType" value={form.vehicleType} onChange={onChange}>
                  <option value="bike">Bike</option>
                  <option value="auto">Auto</option>
                  <option value="car">Car</option>
                </select>
              </label>
              <label>
                Number plate
                <input name="vehicleNumber" value={form.vehicleNumber} onChange={onChange} required placeholder="DL01AB1234" />
              </label>
            </div>
          )}
          {error && <p className="error">{error}</p>}
          <button className="primary" disabled={loading} type="submit">
            {loading ? "Please wait…" : isLogin ? "Login" : "Register"}
          </button>
        </form>

        <p className="muted small">
          {isLogin ? (
            <>
              Customer? <Link to="/register">Register</Link>
              {" · "}
              Driver? <Link to="/register-driver">Join as driver</Link>
            </>
          ) : (
            <>
              Already have an account? <Link to="/login">Login</Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
