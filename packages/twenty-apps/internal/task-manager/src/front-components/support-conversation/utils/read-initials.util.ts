export const readInitials = (name: string): string => {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 0);

  if (words.length === 0) {
    return '?';
  }

  const first = words[0].charAt(0);
  const last = words.length > 1 ? words[words.length - 1].charAt(0) : '';

  return `${first}${last}`.toUpperCase();
};
