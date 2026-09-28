const FALLBACK_KEY = 'PROJ';
const MAX_KEY_LENGTH = 10;
const SINGLE_WORD_KEY_LENGTH = 4;

export const buildProjectKeyFromName = (name: string): string => {
  const words = name
    .replace(/đ|Đ/g, 'd')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return FALLBACK_KEY;
  }

  const acronym =
    words.length === 1
      ? words[0].slice(0, SINGLE_WORD_KEY_LENGTH)
      : words
          .map((word) => word[0])
          .join('')
          .slice(0, MAX_KEY_LENGTH);

  return acronym.toUpperCase() || FALLBACK_KEY;
};
