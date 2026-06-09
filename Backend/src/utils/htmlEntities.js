export const decodeHtmlEntities = (value) => {
  if (typeof value !== 'string' || !value.includes('&')) {
    return value;
  }

  return value
    .replace(/&#x2F;/gi, '/')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
};

export const decodeHtmlEntitiesDeep = (value) => {
  if (value == null) {
    return value;
  }

  if (value instanceof Date) {
    return value;
  }

  if (value instanceof Map) {
    return Object.fromEntries(
      [...value.entries()].map(([key, item]) => [key, decodeHtmlEntitiesDeep(item)])
    );
  }

  if (typeof value === 'string') {
    return decodeHtmlEntities(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => decodeHtmlEntitiesDeep(item));
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, decodeHtmlEntitiesDeep(item)])
    );
  }

  return value;
};
