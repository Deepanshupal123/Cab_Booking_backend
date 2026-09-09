const env = require("./env");

const corsOrigins = () => {
  const raw = env.clientUrl;
  if (!raw || raw === "*") return true;
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length === 1 ? list[0] : list;
};

module.exports = { corsOrigins };
