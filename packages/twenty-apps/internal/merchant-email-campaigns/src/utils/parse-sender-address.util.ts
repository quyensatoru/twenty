// Splits `MIDA Team <hello@mida.so>` into its parts; a bare address has no name.
export const parseSenderAddress = (
  value: string,
): { name: string; email: string } => {
  const match = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);

  if (match === null) {
    return { name: '', email: value.trim() };
  }

  return {
    name: match[1].replace(/^"|"$/g, '').trim(),
    email: match[2].trim(),
  };
};
