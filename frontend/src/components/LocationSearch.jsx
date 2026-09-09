import { useEffect, useRef, useState } from "react";
import { PLACES } from "../places";

const formatFeature = (f) => {
  const p = f.properties || {};
  const [lng, lat] = f.geometry?.coordinates || [];
  const parts = [p.name, p.street, p.city, p.state, p.country].filter(Boolean);
  const address = [...new Set(parts)].join(", ");
  return {
    name: p.name || address,
    address: address || p.name,
    coordinates: [lng, lat],
  };
};

const searchOnline = async (q) => {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=7`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.features || [])
    .map(formatFeature)
    .filter((x) => Number.isFinite(x.coordinates[0]) && Number.isFinite(x.coordinates[1]));
};

export default function LocationSearch({ label, value, onSelect, placeholder }) {
  const [query, setQuery] = useState(value?.name || "");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const box = useRef(null);

  useEffect(() => {
    setQuery(value?.name || "");
  }, [value?.name]);

  useEffect(() => {
    const hide = (e) => {
      if (!box.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", hide);
    return () => document.removeEventListener("mousedown", hide);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(PLACES.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || !q));
      return undefined;
    }
    const local = PLACES.filter(
      (p) =>
        p.name.toLowerCase().includes(q.toLowerCase()) || p.address.toLowerCase().includes(q.toLowerCase())
    );
    setResults(local);
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const online = await searchOnline(q);
        const seen = new Set(local.map((p) => p.address));
        setResults([...local, ...online.filter((p) => !seen.has(p.address))]);
      } catch (_e) {
        setResults(local);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <label className="loc-search" ref={box}>
      {label}
      <input
        value={query}
        placeholder={placeholder || "Search any place…"}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {open && (
        <ul className="loc-list">
          {loading && <li className="muted">Searching live places…</li>}
          {!loading && !results.length && <li className="muted">No places found</li>}
          {results.map((p) => (
            <li key={`${p.address}-${p.coordinates.join(",")}`}>
              <button
                type="button"
                onClick={() => {
                  onSelect(p);
                  setQuery(p.name);
                  setOpen(false);
                }}
              >
                <strong>{p.name}</strong>
                <span>{p.address}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </label>
  );
}
