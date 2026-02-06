const DEFAULT_API_BASE_URL = 'http://localhost:8000';

const sanitizeBaseUrl = (value: string): string => value.replace(/\/+$/, '');

const resolvedBase = import.meta.env.VITE_API_BASE_URL?.trim();

export const API_BASE_URL = resolvedBase && resolvedBase.length > 0
  ? sanitizeBaseUrl(resolvedBase)
  : sanitizeBaseUrl(DEFAULT_API_BASE_URL);

export const buildApiUrl = (path: string): string => {
  if (!path) {
    return API_BASE_URL;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
