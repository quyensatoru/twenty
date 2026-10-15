// Mirrors the server's rich text check (isSafeUrl in twenty-shared): it
// refuses the whole save when any url or href in the BlockNote half is not
// absolute http(s), mailto or tel, or a same-origin path.
const SAFE_URL_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];
const SAME_ORIGIN_PROBE_BASE_URL = 'https://same-origin-probe.invalid';

const MARKDOWN_ESCAPE_PATTERN = /\\([!-/:-@[-`{-~])/g;

// A markdown destination can be wrapped in <…> and carry backslash escapes;
// neither is part of the address.
const normalizeMarkdownUrl = (url: string): string =>
  url
    .trim()
    .replace(/^<(.*)>$/, '$1')
    .replace(MARKDOWN_ESCAPE_PATTERN, '$1')
    .replace(/&amp;/g, '&');

const isSafeUrl = (url: string): boolean => {
  try {
    if (url.startsWith('/')) {
      return (
        new URL(url, SAME_ORIGIN_PROBE_BASE_URL).origin ===
        SAME_ORIGIN_PROBE_BASE_URL
      );
    }

    return SAFE_URL_PROTOCOLS.includes(new URL(url).protocol);
  } catch {
    return false;
  }
};

// The URL as the BlockNote half may carry it, or null when the server would
// reject it (an anchor, a relative path, a bare domain, javascript:, …). The
// markdown half keeps the link either way; only the derived half drops it.
export const readBlocknoteSafeUrl = (url: string): string | null => {
  const normalizedUrl = normalizeMarkdownUrl(url);

  return normalizedUrl !== '' && isSafeUrl(normalizedUrl)
    ? normalizedUrl
    : null;
};
