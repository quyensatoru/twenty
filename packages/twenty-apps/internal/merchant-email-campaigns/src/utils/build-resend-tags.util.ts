// Resend tag values only accept ASCII letters, digits, underscores and dashes.
export const buildResendTags = (
  tags: Record<string, string>,
): { name: string; value: string }[] =>
  Object.entries(tags).map(([name, value]) => ({
    name,
    value: value.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 256),
  }));
