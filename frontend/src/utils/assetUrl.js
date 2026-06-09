const backendBase = () =>
  import.meta.env.VITE_ASSET_URL ||
  import.meta.env.VITE_API_URL?.replace(/\/api\/v\d+\/?$/, '') ||
  'http://localhost:5000';

const decodeHtmlEntities = (value) => {
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

const isFrontendStaticAsset = (url) => {
  const path = extractPath(url);
  if (!path) {
    return false;
  }

  return (
    path.startsWith('/assets/images/') ||
    path.startsWith('/assets/') ||
    path.startsWith('/src/assets/') ||
    path.startsWith('assets/') ||
    path.startsWith('src/assets/')
  );
};

const extractPath = (url) => {
  if (!url || typeof url !== 'string') {
    return '';
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return '';
  }

  if (trimmed.startsWith('http')) {
    try {
      return new URL(trimmed).pathname;
    } catch {
      return trimmed;
    }
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
};

export const normalizeStorefrontAssetPath = (url) => {
  if (!url || typeof url !== 'string') {
    return url;
  }

  const trimmed = decodeHtmlEntities(url.trim());
  if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  if (trimmed.startsWith('http')) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.pathname.startsWith('/uploads/')) {
        return trimmed;
      }
      if (isFrontendStaticAsset(parsed.pathname)) {
        return parsed.pathname;
      }
      return trimmed;
    } catch {
      return trimmed;
    }
  }

  let path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  path = path.replace(/^\/src\/assets\/images\//, '/assets/images/');

  return path;
};

const isValidAssetPath = (url) => {
  const path = extractPath(url);
  if (!path || path === '&' || path === '/&' || path === '?') {
    return false;
  }
  return path.length > 1 || path === '/';
};

export const resolveAssetUrl = (url) => {
  const normalized = normalizeStorefrontAssetPath(url);

  if (!normalized || !isValidAssetPath(normalized)) {
    return '';
  }

  if (normalized.startsWith('http') || normalized.startsWith('data:') || normalized.startsWith('blob:')) {
    return normalized;
  }

  if (isFrontendStaticAsset(normalized)) {
    const path = extractPath(normalized);
    return path.startsWith('/') ? path : `/${path}`;
  }

  const path = extractPath(normalized);
  const base = backendBase().replace(/\/$/, '');
  return `${base}${path}`;
};
