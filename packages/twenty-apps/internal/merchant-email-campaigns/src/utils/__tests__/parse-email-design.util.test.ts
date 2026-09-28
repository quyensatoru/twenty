import { describe, expect, it } from 'vitest';

import { DEFAULT_EMAIL_DESIGN } from '../../constants/default-email-design';
import { parseEmailDesign } from '../parse-email-design.util';

describe('parseEmailDesign', () => {
  it('falls back to the default design on garbage', () => {
    expect(parseEmailDesign('not json')).toBe(DEFAULT_EMAIL_DESIGN);
    expect(parseEmailDesign(null)).toBe(DEFAULT_EMAIL_DESIGN);
  });

  it('drops unknown blocks and fills missing settings', () => {
    const design = parseEmailDesign({
      settings: { textColor: '#111111' },
      blocks: [{ type: 'video' }, { type: 'spacer', height: 10 }, 'x'],
    });

    expect(design.settings.textColor).toBe('#111111');
    expect(design.settings.linkColor).toBe(
      DEFAULT_EMAIL_DESIGN.settings.linkColor,
    );
    expect(design.blocks).toEqual([
      { id: 'block-1', type: 'spacer', height: 10 },
    ]);
  });

  it('accepts a JSON string', () => {
    expect(
      parseEmailDesign(JSON.stringify(DEFAULT_EMAIL_DESIGN)).blocks,
    ).toHaveLength(DEFAULT_EMAIL_DESIGN.blocks.length);
  });
});
