export const generateBlockId = (): string =>
  `block-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
