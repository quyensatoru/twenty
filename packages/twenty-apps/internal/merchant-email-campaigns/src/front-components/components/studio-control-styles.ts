import { STUDIO_TOKENS } from './studio-tokens';

// Twenty's text-field look (twenty-ui Input), reproduced with its CSS
// variables: twenty-ui's own inputs rely on base-ui event handling the
// sandbox cannot run.
export const getStudioControlStyle = (isFocused: boolean) =>
  ({
    background: STUDIO_TOKENS.backgroundTransparentLighter,
    border: `1px solid ${isFocused ? STUDIO_TOKENS.accent : STUDIO_TOKENS.border}`,
    borderRadius: STUDIO_TOKENS.radiusSmall,
    boxShadow: isFocused ? `0 0 0 3px ${STUDIO_TOKENS.accentSoft}` : 'none',
    boxSizing: 'border-box',
    color: STUDIO_TOKENS.textPrimary,
    fontFamily: STUDIO_TOKENS.fontFamily,
    fontSize: 13,
    outline: 'none',
    transition: 'border-color 0.1s ease, box-shadow 0.1s ease',
    width: '100%',
  }) as const;
