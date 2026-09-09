const ok = (res, data, message, statusCode = 200) => {
  const payload = { success: true };
  if (message) payload.message = message;
  if (data !== undefined) payload.data = data;
  return res.status(statusCode).json(payload);
};

const created = (res, data, message) => ok(res, data, message, 201);

const list = (res, items, extra = {}) =>
  res.status(200).json({
    success: true,
    count: items.length,
    ...extra,
    data: items,
  });

module.exports = { ok, created, list };
