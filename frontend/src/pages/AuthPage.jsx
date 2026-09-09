import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";

export default function AuthPage({ mode }) {
  const isLogin = mode === "login";
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

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
        const res = await api("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
            role: "customer",
          }),
        });
        login(res.data);
        navigate("/app");
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
        <p className="muted">{isLogin ? "Login with email and password." : "Only name, email and password."}</p>

        <form onSubmit={submit} className="stack">
          {!isLogin && (
            <label>
              Name
              <input name="name" value={form.name} onChange={onChange} required autoComplete="name" />
            </label>
          )}
          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={onChange} required autoComplete="email" />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              required
              minLength={6}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
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
      </div>
    </div>
  );
}
