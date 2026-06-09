const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized = {};

  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }

    sanitized[key] = sanitizeObject(value);
  }

  return sanitized;
};

export const mongoSanitizeMiddleware = () => (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  next();
};
