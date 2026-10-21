import { type HealthLevel } from '../../types/health-dashboard';

// Twenty theme variables only, so the app follows the host's light and dark
// themes the way twenty-ui components do.
export const HEALTH_TOKENS = {
  fontFamily: 'var(--t-font-family)',
  textPrimary: 'var(--t-font-color-primary)',
  textSecondary: 'var(--t-font-color-secondary)',
  textTertiary: 'var(--t-font-color-tertiary)',
  background: 'var(--t-background-primary)',
  backgroundSecondary: 'var(--t-background-secondary)',
  backgroundTertiary: 'var(--t-background-tertiary)',
  border: 'var(--t-border-color-medium)',
  borderLight: 'var(--t-border-color-light)',
  borderStrong: 'var(--t-border-color-strong)',
  accent: 'var(--t-color-blue)',
  shadow: 'var(--t-box-shadow-strong)',
  radius: 'var(--t-border-radius-md)',
  radiusSmall: 'var(--t-border-radius-sm)',
  fontSizeXs: 'var(--t-font-size-xs)',
  fontSizeSm: 'var(--t-font-size-sm)',
  fontSizeMd: 'var(--t-font-size-md)',
  fontSizeLg: 'var(--t-font-size-lg)',
  fontSizeXl: 'var(--t-font-size-xl)',
  fontWeightMedium: 'var(--t-font-weight-medium)',
  fontWeightSemiBold: 'var(--t-font-weight-semi-bold)',
  tooltipBackground: 'var(--t-background-inverted-primary)',
  tooltipText: 'var(--t-font-color-inverted)',
} as const;

// Twenty's 4px spacing grid; fractional steps exist in the theme but not as variables.
export const spacing = (units: number) =>
  Number.isInteger(units)
    ? `var(--t-spacing-${units})`
    : `calc(var(--t-spacing-1) * ${units})`;

type LevelStyle = {
  label: string;
  tagColor: 'green' | 'orange' | 'red' | 'gray';
  ink: string;
  soft: string;
  fill: string;
  line: string;
};

// Labels are English source strings; callers pass them through t().
export const LEVEL_STYLES: Record<HealthLevel, LevelStyle> = {
  OK: {
    label: 'Healthy',
    tagColor: 'green',
    ink: 'var(--t-color-green11)',
    soft: 'var(--t-color-green3)',
    fill: 'var(--t-color-green6)',
    line: 'var(--t-color-green9)',
  },
  WARNING: {
    label: 'Warning',
    tagColor: 'orange',
    ink: 'var(--t-color-orange11)',
    soft: 'var(--t-color-orange3)',
    fill: 'var(--t-color-orange9)',
    line: 'var(--t-color-orange9)',
  },
  CRITICAL: {
    label: 'Critical',
    tagColor: 'red',
    ink: 'var(--t-color-red11)',
    soft: 'var(--t-color-red3)',
    fill: 'var(--t-color-red9)',
    line: 'var(--t-color-red9)',
  },
  NONE: {
    label: 'No data',
    tagColor: 'gray',
    ink: 'var(--t-color-gray11)',
    soft: 'var(--t-color-gray3)',
    fill: 'var(--t-color-gray5)',
    line: 'var(--t-color-gray8)',
  },
};
