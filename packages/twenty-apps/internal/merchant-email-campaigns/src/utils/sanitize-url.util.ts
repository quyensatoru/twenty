const SAFE_URL_PATTERN = /^(https?:\/\/|mailto:|#)/i;

export const sanitizeUrl = (url: string): string => {
  const trimmed = url.trim();

  return SAFE_URL_PATTERN.test(trimmed) ? trimmed : '#';
};
