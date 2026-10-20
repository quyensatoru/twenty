import { describe, expect, it } from 'vitest';

import { findCardTemplate } from '../../constants/card-templates';
import { buildCardPalette, luminance } from '../card-palette.util';

describe('buildCardPalette', () => {
  it('darkens a dark card ground and keeps its ink', () => {
    const template = findCardTemplate('women');
    const palette = buildCardPalette(template);

    expect(luminance(palette.ground)).toBeLessThan(luminance(template.ground));
    expect(palette.ink).toBe(template.ink);
  });

  it('tints a light card ground and darkens its accent for contrast', () => {
    const template = findCardTemplate('birthday');
    const palette = buildCardPalette(template);

    expect(palette.ground).not.toBe(template.ground);
    expect(luminance(palette.accent)).toBeLessThan(luminance(template.ornament));
  });
});
