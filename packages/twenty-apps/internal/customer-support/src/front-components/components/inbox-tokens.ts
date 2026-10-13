import { type CSSProperties } from 'react';

// Twenty's own CSS variables, so the inbox follows light and dark mode. The
// fallbacks only matter when the page renders outside a Twenty host.
export const INBOX_TOKENS = {
  fontFamily: 'var(--t-font-family, Inter, sans-serif)',
  textPrimary: 'var(--t-font-color-primary, #333333)',
  textSecondary: 'var(--t-font-color-secondary, #666666)',
  textTertiary: 'var(--t-font-color-tertiary, #999999)',
  textLight: 'var(--t-font-color-light, #b3b3b3)',
  textInverted: 'var(--t-font-color-inverted, #ffffff)',
  background: 'var(--t-background-primary, #ffffff)',
  backgroundSecondary: 'var(--t-background-secondary, #fcfcfc)',
  backgroundTertiary: 'var(--t-background-tertiary, #f1f1f1)',
  backgroundHover: 'var(--t-background-transparent-light, rgba(0,0,0,0.04))',
  backgroundLighter:
    'var(--t-background-transparent-lighter, rgba(0,0,0,0.02))',
  border: 'var(--t-border-color-medium, #ebebeb)',
  borderLight: 'var(--t-border-color-light, #f1f1f1)',
  borderStrong: 'var(--t-border-color-strong, #d6d6d6)',
  accent: 'var(--t-color-blue, #1961ed)',
  accentSoft: 'var(--t-accent-tertiary, #e8efff)',
  danger: 'var(--t-color-red, #dc2626)',
  warning: 'var(--t-color-orange, #ea580c)',
  success: 'var(--t-color-green, #16a34a)',
  shadow: '0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.06)',
  shadowRaised: '0 12px 32px -12px rgba(16,24,40,.18)',
} as const;

export const INBOX_CIRCLE_STYLE = {
  borderRadius: '50%',
  cornerShape: 'round',
} as CSSProperties;

export const INBOX_THIN_SCROLLBAR_STYLE = {
  scrollbarColor: `${INBOX_TOKENS.border} transparent`,
  scrollbarWidth: 'thin',
} as const;

export const INBOX_CARD_STYLE: CSSProperties = {
  background: INBOX_TOKENS.background,
  border: `1px solid ${INBOX_TOKENS.border}`,
  borderRadius: 16,
  boxShadow: INBOX_TOKENS.shadow,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  minWidth: 0,
  overflow: 'hidden',
};

// Twenty's palette names, used through its tag variables so avatars and app
// badges follow the theme.
const PALETTE = [
  'blue',
  'purple',
  'turquoise',
  'orange',
  'pink',
  'green',
  'sky',
  'red',
  'yellow',
  'gray',
] as const;

const FALLBACK_TONES: Record<string, { text: string; background: string }> = {
  blue: { text: '#1961ed', background: 'rgba(25,97,237,0.12)' },
  purple: { text: '#7c3aed', background: 'rgba(124,58,237,0.12)' },
  turquoise: { text: '#0d9488', background: 'rgba(13,148,136,0.12)' },
  orange: { text: '#ea580c', background: 'rgba(234,88,12,0.12)' },
  pink: { text: '#db2777', background: 'rgba(219,39,119,0.12)' },
  green: { text: '#16a34a', background: 'rgba(22,163,74,0.12)' },
  sky: { text: '#0284c7', background: 'rgba(2,132,199,0.12)' },
  red: { text: '#dc2626', background: 'rgba(220,38,38,0.12)' },
  yellow: { text: '#ca8a04', background: 'rgba(202,138,4,0.14)' },
  gray: { text: '#6b7280', background: 'rgba(107,114,128,0.12)' },
};

export type InboxTone = { text: string; background: string };

export const readTone = (color: string): InboxTone => {
  const fallback = FALLBACK_TONES[color] ?? FALLBACK_TONES.gray;

  return {
    text: `var(--t-tag-text-${color}, ${fallback.text})`,
    background: `var(--t-tag-background-${color}, ${fallback.background})`,
  };
};

export const readToneForName = (name: string): InboxTone => {
  let hash = 0;

  for (const character of name) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return readTone(PALETTE[hash % PALETTE.length]);
};

const APP_COLORS: Record<string, string> = {
  MIDA: 'blue',
  BLOY: 'purple',
  FRAUD: 'red',
  EU: 'green',
};

export const readAppTone = (appName: string | null): InboxTone =>
  readTone(APP_COLORS[appName ?? ''] ?? 'gray');
