// Twenty's palette, in the order twenty-ui's MAIN_COLOR_NAMES declares it. The
// index is what the hash below picks, so the order is load-bearing: change it
// and every avatar in the app changes colour.
export const THEME_COLOR_NAMES = [
  'red',
  'ruby',
  'crimson',
  'tomato',
  'orange',
  'amber',
  'yellow',
  'lime',
  'grass',
  'green',
  'jade',
  'mint',
  'turquoise',
  'cyan',
  'sky',
  'blue',
  'iris',
  'violet',
  'purple',
  'plum',
  'pink',
  'bronze',
  'gold',
  'brown',
  'gray',
] as const;

export type ThemeColorName = (typeof THEME_COLOR_NAMES)[number];

// Colours stored on a record — an issue status, say — arrive as plain strings
// from the API, so they have to be checked against the palette before they can
// be built into a CSS variable name.
export const isThemeColorName = (value: unknown): value is ThemeColorName =>
  typeof value === 'string' &&
  THEME_COLOR_NAMES.includes(value as ThemeColorName);

// The same hash twenty-ui's stringToThemeColor uses, so a member's avatar here
// is the colour the rest of Twenty gives them. An app cannot import it: the
// twenty-ui entry that exports it pulls in the theme provider, which the
// sandbox has no React context for.
export const stringToThemeColorName = (value: string): ThemeColorName => {
  let hash = 0;

  for (let index = 0; index < value.length; index++) {
    hash = value.charCodeAt(index) + ((hash << 5) - hash);
  }

  return (
    THEME_COLOR_NAMES[Math.abs(hash) % THEME_COLOR_NAMES.length] ??
    THEME_COLOR_NAMES[0]
  );
};
