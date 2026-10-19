// The same host tokens and control sizes used by Task Manager's sandbox adapters.
export const PROSPECT_TOKENS = {
  fontFamily: 'var(--t-font-family, Inter, sans-serif)',
  text: 'var(--t-font-color-primary, #333333)',
  secondary: 'var(--t-font-color-secondary, #666666)',
  muted: 'var(--t-font-color-tertiary, #999999)',
  background: 'var(--t-background-primary, #ffffff)',
  subtle: 'var(--t-background-secondary, #fcfcfc)',
  tertiary: 'var(--t-background-tertiary, #f1f1f1)',
  hover: 'var(--t-background-transparent-light, rgba(0,0,0,0.04))',
  border: 'var(--t-border-color-medium, #ebebeb)',
  borderLight: 'var(--t-border-color-light, #f1f1f1)',
  borderStrong: 'var(--t-border-color-strong, #d6d6d6)',
  accent: 'var(--t-color-blue, #1961ed)',
  accentSoft: 'var(--t-accent-tertiary, #e8efff)',
  accentHover: 'var(--t-accent-accent10, #1450c7)',
  danger: 'var(--t-font-color-danger, #d92d20)',
  success: 'var(--t-color-green, #16a34a)',
  inverted: 'var(--t-font-color-inverted, #ffffff)',
  radius: 'var(--t-border-radius-md, 8px)',
  radiusSmall: 'var(--t-border-radius-sm, 8px)',
  radiusExtraSmall: 'var(--t-border-radius-xs, 4px)',
  shadow: 'var(--t-box-shadow-strong, 0 2px 8px rgba(0,0,0,0.16))',
} as const;

export const PROSPECT_SCROLL_STYLE = {
  scrollbarColor: `${PROSPECT_TOKENS.borderStrong} transparent`,
  scrollbarWidth: 'thin',
} as const;
