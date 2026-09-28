// Twenty's own CSS variables, so the studio follows light and dark mode. The
// fallbacks only matter when the page renders outside a Twenty host.
export const STUDIO_TOKENS = {
  fontFamily: 'var(--t-font-family, Inter, sans-serif)',
  textPrimary: 'var(--t-font-color-primary, #333333)',
  textSecondary: 'var(--t-font-color-secondary, #666666)',
  textTertiary: 'var(--t-font-color-tertiary, #999999)',
  textDanger: 'var(--t-font-color-danger, #d92d20)',
  background: 'var(--t-background-primary, #ffffff)',
  backgroundSecondary: 'var(--t-background-secondary, #fcfcfc)',
  backgroundTertiary: 'var(--t-background-tertiary, #f1f1f1)',
  backgroundHover: 'var(--t-background-transparent-light, rgba(0,0,0,0.04))',
  backgroundTransparentLighter:
    'var(--t-background-transparent-lighter, rgba(0,0,0,0.02))',
  border: 'var(--t-border-color-medium, #ebebeb)',
  borderStrong: 'var(--t-border-color-strong, #d6d6d6)',
  accent: 'var(--t-color-blue, #1961ed)',
  accentSoft: 'var(--t-accent-tertiary, #e8efff)',
  accentHover: 'var(--t-accent-accent10, #1450c7)',
  redSoft: 'var(--t-color-red1, #fff1f1)',
  green: 'var(--t-color-green, #16a34a)',
  orange: 'var(--t-color-orange, #ea580c)',
  red: 'var(--t-color-red, #dc2626)',
  gray: 'var(--t-color-gray, #8a8f98)',
  radius: 'var(--t-border-radius-md, 8px)',
  radiusSmall: 'var(--t-border-radius-sm, 4px)',
} as const;
