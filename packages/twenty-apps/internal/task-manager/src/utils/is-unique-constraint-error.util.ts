const UNIQUE_VIOLATION_MARKERS = [
  'duplicate key',
  'unique constraint',
  'already exists',
  'uniqueness',
];

// The GraphQL layer surfaces a Postgres unique violation as a message, not a
// typed error, so the retry loop has to recognise it by text.
export const isUniqueConstraintError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const lowerCaseMessage = message.toLowerCase();

  return UNIQUE_VIOLATION_MARKERS.some((marker) =>
    lowerCaseMessage.includes(marker),
  );
};
