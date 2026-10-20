import { describe, expect, it } from 'vitest';

import { describeCardSvg, formatSignerLine } from '../describe-card.util';
import { wrapText } from '../wrap-text.util';

describe('wrapText', () => {
  it('wraps on words and ellipsizes past the line limit', () => {
    expect(wrapText('một hai ba bốn năm sáu', 8, 2)).toEqual(['một hai', 'ba bốn…']);
  });
});

describe('formatSignerLine', () => {
  it('names four signers and counts the rest', () => {
    expect(formatSignerLine(['Huy', 'Đức', 'Anh', 'Linh', 'Nam', 'Mai'])).toBe('HUY · ĐỨC · ANH · LINH · VÀ 2 NGƯỜI KHÁC');
  });
});

describe('describeCardSvg', () => {
  it('escapes user text and renders invitation details', () => {
    const svg = describeCardSvg(
      {
        id: 'card-1',
        occurrenceKey: 'event:e1:2026-12-24',
        eventTitle: 'Year End Party',
        eventDate: '2026-12-24',
        cardKind: 'INVITATION',
        templateKey: 'party',
        recipient: 'Cả team <MIDA>',
        message: 'Hẹn gặp mọi người',
        signatures: [],
        shareToken: 'token',
      },
      { startTime: '18:30', location: 'Tầng 5' },
    );

    expect(svg).toContain('Cả team &lt;MIDA&gt;');
    expect(svg).toContain('THIỆP MỜI · 24 · 12 · 2026');
    expect(svg).toContain('18:30, 24/12/2026');
    expect(svg).toContain('Tầng 5');
    expect(svg).not.toContain('<MIDA>');
  });

  it('renders an embedded background image behind readable card text', () => {
    const svg = describeCardSvg({
      id: 'card-2',
      occurrenceKey: 'event:e2:2026-12-24',
      eventTitle: 'Party',
      eventDate: '2026-12-24',
      cardKind: 'GREETING',
      templateKey: 'party',
      recipient: 'Linh',
      message: 'Chúc mừng!',
      signatures: [],
      shareToken: 'token',
    }, {}, 'data:image/png;base64,aGVsbG8=');

    expect(svg).toContain('href="data:image/png;base64,aGVsbG8="');
    expect(svg).toContain('preserveAspectRatio="xMidYMid slice"');
    expect(svg.indexOf('href="data:image/png')).toBeLessThan(svg.indexOf('>Chúc mừng!</text>'));
    expect(svg).toContain('fill-opacity="0.65"');
  });
});
