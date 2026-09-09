import { useAuth } from "../auth";

export default function Shell({ title, subtitle, theme = "customer", children }) {
  const { user, logout } = useAuth();
  return (
    <div className={`page theme-${theme}`}>
      <header className="topbar">
        <div>
          <p className="brand">{theme === "driver" ? "RideNow Driver" : theme === "admin" ? "RideNow Admin" : "RideNow"}</p>
          <h1>{title}</h1>
          {subtitle && <p className="muted">{subtitle}</p>}
        </div>
        <div className="topbar-right">
          <span className="pill">{user?.role}</span>
          <span className="muted small">{user?.name}</span>
          <button className="ghost" onClick={logout} type="button">
            Logout
          </button>
        </div>
      </header>
      <main className="content">{children}</main>
    </div>
  );
}
