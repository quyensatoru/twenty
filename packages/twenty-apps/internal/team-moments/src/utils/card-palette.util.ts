import { type CardTemplate } from '../constants/card-templates';

export type CardPalette = {
  ground: string;
  ink: string;
  mutedInk: string;
  panel: string;
  line: string;
  accent: string;
  onAccent: string;
  darker: string;
  lighter: string;
};

const parseHex = (hex: string): [number, number, number] => {
  const value = Number.parseInt(hex.replace('#', ''), 16);

  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

export const mixColor = (from: string, to: string, amount: number): string => {
  const start = parseHex(from);
  const end = parseHex(to);

  return `#${start
    .map((channel, index) => Math.round(channel + (end[index] - channel) * amount).toString(16).padStart(2, '0'))
    .join('')}`;
};

export const luminance = (hex: string): number => {
  const [red, green, blue] = parseHex(hex);

  return (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
};

// The surface around a card (thumbnail, share page): a shade of the card's
// own ground so the card still stands out on it.
export const buildCardPalette = (template: CardTemplate): CardPalette => {
  const isLight = luminance(template.ground) > 0.6;
  const ground = isLight ? mixColor(template.ground, template.ornament, 0.15) : mixColor(template.ground, '#000000', 0.3);
  const accent = isLight ? mixColor(template.ornament, '#000000', 0.35) : template.ornament;
  const [darker, lighter] = luminance(template.ground) < luminance(template.ink) ? [template.ground, template.ink] : [template.ink, template.ground];

  return {
    ground,
    ink: template.ink,
    mutedInk: mixColor(template.ink, ground, 0.22),
    panel: mixColor(ground, template.ink, 0.08),
    line: mixColor(ground, template.ink, 0.18),
    accent,
    onAccent: luminance(accent) > 0.55 ? darker : lighter,
    darker,
    lighter,
  };
};
