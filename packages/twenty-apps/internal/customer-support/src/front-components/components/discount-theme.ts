// Twenty theme variables only (set up by DiscountThemeRoot), so the page
// follows the host's fonts, sizes and light or dark theme like twenty-ui does.
export const DISCOUNT_TOKENS = {
  fontFamily: 'var(--t-font-family)',
  textPrimary: 'var(--t-font-color-primary)',
  textSecondary: 'var(--t-font-color-secondary)',
  textTertiary: 'var(--t-font-color-tertiary)',
  textLight: 'var(--t-font-color-light)',
  background: 'var(--t-background-primary)',
  backgroundSecondary: 'var(--t-background-secondary)',
  backgroundTertiary: 'var(--t-background-tertiary)',
  backgroundHover: 'var(--t-background-transparent-light)',
  backgroundSelected: 'var(--t-accent-quaternary)',
  border: 'var(--t-border-color-medium)',
  borderLight: 'var(--t-border-color-light)',
  radius: 'var(--t-border-radius-md)',
  radiusSmall: 'var(--t-border-radius-sm)',
  fontSizeXs: 'var(--t-font-size-xs)',
  fontSizeSm: 'var(--t-font-size-sm)',
  fontSizeMd: 'var(--t-font-size-md)',
  fontSizeLg: 'var(--t-font-size-lg)',
  fontSizeXl: 'var(--t-font-size-xl)',
  fontWeightMedium: 'var(--t-font-weight-medium)',
  fontWeightSemiBold: 'var(--t-font-weight-semi-bold)',
  danger: 'var(--t-color-red)',
  warning: 'var(--t-color-orange)',
  success: 'var(--t-color-green)',
} as const;

// Twenty's 4px grid; fractional steps exist in the theme but not as variables.
export const spacing = (units: number) =>
  Number.isInteger(units)
    ? `var(--t-spacing-${units})`
    : `calc(var(--t-spacing-1) * ${units})`;

// Step 3 is Twenty's soft tag background, step 11 its text, step 9 the solid.
export const readColorScale = (color: string) => ({
  soft: `var(--t-color-${color}3)`,
  ink: `var(--t-color-${color}11)`,
  solid: `var(--t-color-${color}9)`,
});

const APP_COLORS: Record<string, string> = {
  MIDA: 'blue',
  BLOY: 'purple',
  FRAUD: 'red',
  EU: 'green',
};

const FALLBACK_APP_COLORS = ['turquoise', 'orange', 'pink', 'sky', 'yellow'];

// Known products keep the colors the support inbox uses; an app added later
// gets a stable one from its name.
export const readAppColor = (appName: string | null): string => {
  if (appName === null) {
    return 'gray';
  }

  const known = APP_COLORS[appName.toUpperCase()];

  if (known !== undefined) {
    return known;
  }

  let hash = 0;

  for (const character of appName) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return FALLBACK_APP_COLORS[hash % FALLBACK_APP_COLORS.length];
};
