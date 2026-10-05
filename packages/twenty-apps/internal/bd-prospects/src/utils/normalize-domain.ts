const MAX_DOMAIN_LENGTH = 253;
const MAX_INPUT_LENGTH = 2048;
const MAX_LABEL_LENGTH = 63;

// Every writer of a prospect (merchant sync, CSV import) must agree on this,
// because the record id is derived from the result: "ABC.myshopify.com",
// "abc.myshopify.com/" and "https://abc.myshopify.com" have to collapse into
// the same row rather than three.
export const normalizeDomain = (rawDomain: string): string | null => {
  if (rawDomain.length > MAX_INPUT_LENGTH) {
    return null;
  }

  const lowered = rawDomain.trim().toLowerCase();
  const schemeSeparatorIndex = lowered.indexOf('://');
  const withoutScheme =
    schemeSeparatorIndex === -1
      ? lowered
      : lowered.slice(schemeSeparatorIndex + 3);

  const host = withoutScheme.split('/')[0].split('?')[0].split('#')[0];
  const withoutPort = host.split(':')[0];
  const withoutWww = withoutPort.startsWith('www.')
    ? withoutPort.slice('www.'.length)
    : withoutPort;

  const domain = withoutWww.replace(/^\.+/, '').replace(/\.+$/, '');

  if (domain.length === 0 || domain.length > MAX_DOMAIN_LENGTH) {
    return null;
  }

  const labels = domain.split('.');

  if (labels.length < 2) {
    return null;
  }

  const hasInvalidLabel = labels.some(
    (label) =>
      label.length === 0 ||
      label.length > MAX_LABEL_LENGTH ||
      label.startsWith('-') ||
      label.endsWith('-') ||
      !isLabelCharacterSetValid(label),
  );

  return hasInvalidLabel ? null : domain;
};

// Character-by-character instead of a regex with nested quantifiers, which is
// the usual shape that backtracks badly on hostile input.
const isLabelCharacterSetValid = (label: string): boolean => {
  for (const character of label) {
    const isDigit = character >= '0' && character <= '9';
    const isLetter = character >= 'a' && character <= 'z';

    if (!isDigit && !isLetter && character !== '-') {
      return false;
    }
  }

  return true;
};
