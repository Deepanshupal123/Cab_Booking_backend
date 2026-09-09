const env = require("./env");

const allowedList = () =>
  String(env.clientUrl || "")
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean)
    .filter((s) => s !== "*");

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (!env.isProd) return true;

  const list = allowedList();
  if (!list.length) return true;
  if (list.includes(origin)) return true;

  try {
    const { hostname } = new URL(origin);
    if (hostname.endsWith(".vercel.app")) return true;
  } catch (_err) {
    return false;
  }
  return false;
};

const corsOrigins = () => (origin, callback) => {
  if (isAllowedOrigin(origin)) return callback(null, true);
  return callback(new Error(`CORS blocked for ${origin}`));
};

module.exports = { corsOrigins, isAllowedOrigin };
