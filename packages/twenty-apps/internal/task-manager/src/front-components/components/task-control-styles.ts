import { TASK_TOKENS } from './task-tokens';

// Twenty's text-field look (twenty-ui Input), reproduced with its CSS
// variables: twenty-ui's own inputs rely on base-ui event handling that the
// sandbox cannot run — the proxied event has no pointerType and the component
// throws. Focus state is driven from React state because an app cannot ship a
// stylesheet, so there is no `:focus` selector to declare.
export const getTaskControlStyle = (isFocused: boolean) =>
  ({
    background: TASK_TOKENS.backgroundTransparentLighter,
    border: `1px solid ${isFocused ? TASK_TOKENS.accent : TASK_TOKENS.border}`,
    borderRadius: TASK_TOKENS.radiusSmall,
    boxShadow: isFocused ? `0 0 0 3px ${TASK_TOKENS.accentSoft}` : 'none',
    boxSizing: 'border-box',
    color: TASK_TOKENS.textPrimary,
    fontFamily: TASK_TOKENS.fontFamily,
    fontSize: 13,
    outline: 'none',
    transition: 'border-color 0.1s ease, box-shadow 0.1s ease',
    width: '100%',
  }) as const;

// The borderless field that sits inside a control wrapper already carrying the
// border, background and focus ring.
export const TASK_BARE_FIELD_STYLE = {
  background: 'transparent',
  border: 'none',
  color: TASK_TOKENS.textPrimary,
  flex: 1,
  fontFamily: TASK_TOKENS.fontFamily,
  fontSize: 13,
  minWidth: 0,
  outline: 'none',
  padding: 0,
} as const;
