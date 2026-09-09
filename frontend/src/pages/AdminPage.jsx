import { useEffect, useState } from "react";
import { api } from "../api";
import Shell from "../components/Shell";

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState("");

  const load = async () => {
    const [s, u] = await Promise.all([api("/api/admin/stats"), api("/api/admin/users?limit=50")]);
    setStats(s.data);
    setUsers(u.data || []);
  };

  useEffect(() => {
    load().catch((e) => setErr(e.message));
  }, []);

  const toggle = async (id, isActive) => {
    try {
      await api(`/api/admin/users/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !isActive }),
      });
      await load();
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <Shell title="Admin" subtitle="Platform stats and user control">
      {err && <p className="error">{err}</p>}
      {stats && (
        <div className="stats">
          <div className="stat">
            <strong>{stats.users}</strong>
            <span>Users</span>
          </div>
          <div className="stat">
            <strong>{stats.driversOnline}</strong>
            <span>Drivers online</span>
          </div>
          <div className="stat">
            <strong>{stats.bookings}</strong>
            <span>Bookings</span>
          </div>
        </div>
      )}
      {stats?.bookingsByStatus && (
        <section className="card">
          <h2>Bookings by status</h2>
          <div className="row wrap">
            {Object.entries(stats.bookingsByStatus).map(([k, v]) => (
              <span key={k} className={`badge ${k}`}>
                {k}: {v}
              </span>
            ))}
          </div>
        </section>
      )}
      <section className="card">
        <h2>Users</h2>
        {users.map((u) => (
          <div key={u._id} className="row-btn static">
            <span>
              {u.name} · {u.email}
            </span>
            <span className="pill">{u.role}</span>
            <button type="button" className="ghost" onClick={() => toggle(u._id, u.isActive)}>
              {u.isActive ? "Deactivate" : "Activate"}
            </button>
          </div>
        ))}
      </section>
    </Shell>
  );
}
