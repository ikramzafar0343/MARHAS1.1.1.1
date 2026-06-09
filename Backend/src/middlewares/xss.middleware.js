const PASSWORD_FIELDS = new Set([
  'password',
  'confirmPassword',
  'currentPassword',
  'newPassword'
]);

const PATH_FIELD_KEYS = new Set([
  'path',
  'link',
  'image',
  'jpg',
  'webp',
  'blur',
  'video',
  'avatarUrl',
  'url'
]);

const sanitizeValue = (value, key = '') => {
  if (PASSWORD_FIELDS.has(key) || PATH_FIELD_KEYS.has(key)) {
    return value;
  }

  if (typeof value === 'string') {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, key));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, item]) => [entryKey, sanitizeValue(item, entryKey)])
    );
  }

  return value;
};

export const xssSanitize = () => (req, res, next) => {
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }

  next();
};
