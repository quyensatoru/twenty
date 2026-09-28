import { SHIFT_TOKENS } from './shift-tokens';

// Twenty's text-field look (twenty-ui Input), reproduced with its CSS
// variables: twenty-ui's own inputs rely on base-ui event handling the sandbox
// cannot run.
export const getShiftControlStyle = (isFocused: boolean) =>
  ({
    background: SHIFT_TOKENS.backgroundTransparentLighter,
    border: `1px solid ${isFocused ? SHIFT_TOKENS.accent : SHIFT_TOKENS.border}`,
    borderRadius: SHIFT_TOKENS.radiusSmall,
    boxShadow: isFocused ? `0 0 0 3px ${SHIFT_TOKENS.accentSoft}` : 'none',
    boxSizing: 'border-box',
    color: SHIFT_TOKENS.textPrimary,
    fontFamily: SHIFT_TOKENS.fontFamily,
    fontSize: 13,
    outline: 'none',
    transition: 'border-color 0.1s ease, box-shadow 0.1s ease',
    width: '100%',
  }) as const;
