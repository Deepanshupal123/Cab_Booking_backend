const logger = require("./logger");

const digits = (phone) => String(phone || "").replace(/\D/g, "").slice(-10);

const sendFast2Sms = async (phone, otp) => {
  const key = process.env.FAST2SMS_API_KEY;
  if (!key) return { sent: false, reason: "FAST2SMS_API_KEY missing" };

  const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
    method: "POST",
    headers: {
      authorization: key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      route: "q",
      message: `RideNow OTP ${otp}. Share this with your driver to start the trip.`,
      language: "english",
      flash: 0,
      numbers: digits(phone),
    }),
  });
  const data = await res.json().catch(() => ({}));
  return { sent: Boolean(data.return), reason: data.message || JSON.stringify(data) };
};

const notifyOtp = async ({ phone, email, otp }) => {
  const mobile = digits(phone);
  if (!/^[6-9][0-9]{9}$/.test(mobile)) {
    logger.warn(`OTP ${otp} not SMS'd — save a valid 10-digit Indian mobile first (${email})`);
    return { sent: false };
  }

  try {
    const result = await sendFast2Sms(mobile, otp);
    if (result.sent) logger.info(`OTP SMS sent to ${mobile}`);
    else logger.warn(`OTP SMS failed for ${mobile}: ${result.reason}`);
    return result;
  } catch (err) {
    logger.error(`OTP SMS error: ${err.message}`);
    return { sent: false, reason: err.message };
  }
};

module.exports = { notifyOtp };
