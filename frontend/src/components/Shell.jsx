import { Link } from "react-router-dom";
import { useAuth } from "../auth";

export default function Shell({ title, subtitle, children }) {
  const { user, logout } = useAuth();
  return (
    <div className="page">
      <header className="topbar">
        <div>
          <p className="brand">RideNow</p>
          <h1>{title}</h1>
          {subtitle && <p className="muted">{subtitle}</p>}
        </div>
        <div className="topbar-right">
          <span className="pill">{user?.role}</span>
          <span className="muted small">{user?.name}</span>
          <button className="ghost" onClick={logout} type="button">
            Logout
          </button>
          <Link className="ghost hide-mobile" to="/login">
            Switch account
          </Link>
        </div>
      </header>
      <main className="content">{children}</main>
    </div>
  );
}
