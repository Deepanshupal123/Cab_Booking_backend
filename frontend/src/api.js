const envApi = String(import.meta.env.VITE_API_URL || "")
  .trim()
  .replace(/\/$/, "");

const isLanHost = (host) =>
  /^192\.168\./.test(host) ||
  /^10\./.test(host) ||
  /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);

const resolveApi = () => {
  if (envApi) return envApi;
  if (typeof window === "undefined") return "http://localhost:5000";

  const host = window.location.hostname;
  if (isLanHost(host)) {
    return `${window.location.protocol}//${host}:5000`;
  }
  return "http://localhost:5000";
};

const API = resolveApi();

const getToken = () => localStorage.getItem("token");

const reachError = () => {
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  const hosted = host.includes("vercel.app") || (host && host !== "localhost" && host !== "127.0.0.1" && !isLanHost(host));
  if (hosted && !envApi) {
    return "Frontend has no VITE_API_URL. In Vercel → Settings → Environment Variables add VITE_API_URL = your Render URL (https://....onrender.com), then Redeploy.";
  }
  if (hosted) {
    return `Cannot reach API at ${API}. Open that URL in a browser, confirm Render is Live, and set Render CLIENT_URL to this Vercel site.`;
  }
  return "Cannot reach API. Open http://localhost:3000 and keep backend running on port 5000.";
};

export const api = async (path, options = {}) => {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API}${path}`, { ...options, headers });
  } catch (_err) {
    throw new Error(reachError());
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const details = data.errors?.map((e) => e.message).filter(Boolean).join(", ");
    const err = new Error(details || data.message || "Request failed");
    err.status = res.status;
    throw err;
  }
  return data;
};

export const apiUrl = API;
