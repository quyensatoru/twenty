// Twenty's own CSS variables, so every screen follows light and dark mode. The
// fallbacks only matter when a page renders outside a Twenty host.
export const TASK_TOKENS = {
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
  borderLight: 'var(--t-border-color-light, #f1f1f1)',
  borderStrong: 'var(--t-border-color-strong, #d6d6d6)',
  accent: 'var(--t-color-blue, #1961ed)',
  accentSoft: 'var(--t-accent-tertiary, #e8efff)',
  accentHover: 'var(--t-accent-accent10, #1450c7)',
  radius: 'var(--t-border-radius-md, 8px)',
  radiusSmall: 'var(--t-border-radius-sm, 4px)',
  shadowStrong: 'var(--t-box-shadow-strong, 0 2px 8px rgba(0,0,0,0.16))',
} as const;

// Maps the option colours the objects declare onto readable foreground and
// background pairs. twenty-ui's Tag cannot be used: it is base-ui backed and
// constructs PointerEvents the sandbox has no constructor for.
export const TAG_COLORS: Record<string, { text: string; background: string }> = {
  gray: { text: '#6b7280', background: 'rgba(107,114,128,0.12)' },
  sky: { text: '#0284c7', background: 'rgba(2,132,199,0.12)' },
  blue: { text: '#1961ed', background: 'rgba(25,97,237,0.12)' },
  purple: { text: '#7c3aed', background: 'rgba(124,58,237,0.12)' },
  turquoise: { text: '#0d9488', background: 'rgba(13,148,136,0.12)' },
  green: { text: '#16a34a', background: 'rgba(22,163,74,0.12)' },
  yellow: { text: '#ca8a04', background: 'rgba(202,138,4,0.14)' },
  orange: { text: '#ea580c', background: 'rgba(234,88,12,0.12)' },
  red: { text: '#dc2626', background: 'rgba(220,38,38,0.12)' },
  pink: { text: '#db2777', background: 'rgba(219,39,119,0.12)' },
};

export const readTagColor = (
  color: string | null | undefined,
): { text: string; background: string } =>
  TAG_COLORS[(color ?? 'gray').toLowerCase()] ?? TAG_COLORS.gray;
