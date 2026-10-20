const MARKUP_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export const escapeMarkup = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => MARKUP_ESCAPES[character]);
