const env = require("../config/env");

const stamp = () => new Date().toISOString();

const logger = {
  info: (message, extra) => {
    if (extra) console.log(`${stamp()} [INFO] ${message}`, extra);
    else console.log(`${stamp()} [INFO] ${message}`);
  },
  warn: (message, extra) => {
    if (extra) console.warn(`${stamp()} [WARN] ${message}`, extra);
    else console.warn(`${stamp()} [WARN] ${message}`);
  },
  error: (message, extra) => {
    if (extra) console.error(`${stamp()} [ERROR] ${message}`, extra);
    else console.error(`${stamp()} [ERROR] ${message}`);
  },
  debug: (message, extra) => {
    if (env.isProd) return;
    if (extra) console.log(`${stamp()} [DEBUG] ${message}`, extra);
    else console.log(`${stamp()} [DEBUG] ${message}`);
  },
};

module.exports = logger;
