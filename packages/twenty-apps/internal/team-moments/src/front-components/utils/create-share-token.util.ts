const TOKEN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const TOKEN_LENGTH = 24;

export const createShareToken = (): string => {
  const bytes = new Uint8Array(TOKEN_LENGTH);

  crypto.getRandomValues(bytes);

  return [...bytes].map((byte) => TOKEN_ALPHABET[byte % TOKEN_ALPHABET.length]).join('');
};
