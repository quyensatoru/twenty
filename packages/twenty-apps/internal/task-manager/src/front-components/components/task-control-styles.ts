import { type CSSProperties } from 'react';

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

// The open state of a read-first rich text editor. The host editor already
// draws its frame from Twenty's theme variables, so this recolours that frame
// rather than drawing a second one around it: a wrapper border never matches
// the host's radius and leaves a grey corner inside the accent one. No halo
// either, the scrolling column it sits in clips it.
export const TASK_EDITING_RICH_TEXT_FRAME_STYLE = {
  '--t-border-color-medium': TASK_TOKENS.accent,
} as CSSProperties;

// The host editor's 1px frame plus its 8px inset, which it drops when read
// only. Reading with the same offset keeps the text still when Save toggles
// the editor back to read only.
export const TASK_RICH_TEXT_READING_PADDING = 9;

// A description's editing box, and its reading box too: the same floor in both
// states keeps the page under it still when Save closes the editor, so only
// the Save / Cancel row comes and goes.
export const TASK_DESCRIPTION_MIN_HEIGHT = 180;

// A bordered box for composers, so the one control that takes input reads as
// an input and the rows below it read as content. Rows carry no border of
// their own — only a hover tint — which is what tells the two apart. No
// padding of its own: the editor already spaces its text, and a second inset
// reads as a box inside a box.
export const TASK_COMPOSER_BOX_STYLE = {
  background: TASK_TOKENS.background,
  border: `1px solid ${TASK_TOKENS.border}`,
  borderRadius: TASK_TOKENS.radius,
} as const;

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
