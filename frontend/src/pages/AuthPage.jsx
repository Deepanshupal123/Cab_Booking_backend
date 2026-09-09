import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";

export default function AuthPage({ mode }) {
  const isLogin = mode === "login";
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState("customer");
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
        const dest = res.data.role === "driver" ? "/driver" : res.data.role === "admin" ? "/admin" : "/app";
        navigate(dest);
      } else {
        const payload = {
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          role,
        };
        if (role === "driver") {
          payload.vehicleType = form.vehicleType;
          payload.vehicleNumber = form.vehicleNumber;
        }
        const res = await api("/api/auth/register", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        login(res.data);
        navigate(role === "driver" ? "/driver" : "/app");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <p className="brand">RideNow</p>
        <h1>{isLogin ? "Welcome back" : "Create account"}</h1>
        <p className="muted">Cab booking API demo — customer, driver, and admin.</p>

        <form onSubmit={submit} className="stack">
          {!isLogin && (
            <>
              <label>
                Name
                <input name="name" value={form.name} onChange={onChange} required />
              </label>
              <label>
                Phone
                <input name="phone" value={form.phone} onChange={onChange} required placeholder="9876543210" />
              </label>
              <div className="seg">
                <button type="button" className={role === "customer" ? "on" : ""} onClick={() => setRole("customer")}>
                  Customer
                </button>
                <button type="button" className={role === "driver" ? "on" : ""} onClick={() => setRole("driver")}>
                  Driver
                </button>
              </div>
              {role === "driver" && (
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
                    Number
                    <input name="vehicleNumber" value={form.vehicleNumber} onChange={onChange} required />
                  </label>
                </div>
              )}
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
          {error && <p className="error">{error}</p>}
          <button className="primary" disabled={loading} type="submit">
            {loading ? "Please wait…" : isLogin ? "Login" : "Register"}
          </button>
        </form>

        <p className="muted small">
          {isLogin ? (
            <>
              New here? <Link to="/register">Register</Link>
            </>
          ) : (
            <>
              Already have an account? <Link to="/login">Login</Link>
            </>
          )}
        </p>
        <p className="hint">
          Demo after <code>npm run seed</code>:  admin@demo.com / customer@demo.com / driver@demo.com — password
          <code> password123</code>
        </p>
      </div>
    </div>
  );
}
