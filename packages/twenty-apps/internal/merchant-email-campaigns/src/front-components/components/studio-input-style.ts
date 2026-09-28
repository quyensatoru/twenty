import { STUDIO_TOKENS } from './studio-tokens';

export const STUDIO_INPUT_STYLE = {
  background: STUDIO_TOKENS.background,
  border: `1px solid ${STUDIO_TOKENS.border}`,
  borderRadius: STUDIO_TOKENS.radiusSmall,
  boxSizing: 'border-box',
  color: STUDIO_TOKENS.textPrimary,
  fontFamily: STUDIO_TOKENS.fontFamily,
  fontSize: 13,
  minHeight: 32,
  padding: '6px 8px',
  width: '100%',
} as const;
