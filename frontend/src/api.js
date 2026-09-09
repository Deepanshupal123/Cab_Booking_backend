const envApi = import.meta.env.VITE_API_URL;

const resolveApi = () => {
  if (typeof window === "undefined") return envApi || "http://localhost:5000";
  const host = window.location.hostname;
  if (host !== "localhost" && host !== "127.0.0.1") {
    return `${window.location.protocol}//${host}:5000`;
  }
  return envApi || "http://localhost:5000";
};

const API = resolveApi();

const getToken = () => localStorage.getItem("token");

export const api = async (path, options = {}) => {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API}${path}`, { ...options, headers });
  } catch (_err) {
    throw new Error("Cannot reach API. Open http://localhost:3000 and keep backend running on port 5000.");
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
