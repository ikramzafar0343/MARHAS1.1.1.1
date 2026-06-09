export const successResponse = (res, { message = 'Success', data = null, meta = null, statusCode = 200 }) => {
  const payload = { success: true, message, data };
  if (meta) {
    payload.meta = meta;
  }
  return res.status(statusCode).json(payload);
};

export const errorResponse = (res, { message = 'Error', errors = [], statusCode = 400 }) =>
  res.status(statusCode).json({ success: false, message, errors });
