const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const getToken = () => localStorage.getItem("token");

export const api = async (path, options = {}) => {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API}${path}`, { ...options, headers });
  } catch (_err) {
    throw new Error("Cannot reach API. Start backend or set VITE_API_URL to your live server.");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const details = data.errors?.map((e) => e.message).filter(Boolean).join(", ");
    throw new Error(details || data.message || "Request failed");
  }
  return data;
};

export const apiUrl = API;
