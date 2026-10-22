import { describe, expect, it } from 'vitest';

import { describePollSvg } from '../describe-poll-svg.util';

describe('describePollSvg', () => {
  it('renders the question and each option with its vote share', () => {
    const svg = describePollSvg({
      question: 'Ăn gì <tối nay>?',
      options: [
        { id: 'a', label: 'BBQ', emoji: '🍖' },
        { id: 'b', label: 'Lẩu', emoji: null },
      ],
      votes: [
        { memberId: 'm1', optionId: 'a', votedAt: '2026-01-01T00:00:00.000Z' },
        { memberId: 'm2', optionId: 'a', votedAt: '2026-01-01T00:00:00.000Z' },
        { memberId: 'm3', optionId: 'b', votedAt: '2026-01-01T00:00:00.000Z' },
      ],
    });

    expect(svg).toContain('Ăn gì &lt;tối nay&gt;?');
    expect(svg).toContain('🍖 BBQ');
    expect(svg).toContain('67% · 2');
    expect(svg).toContain('33% · 1');
  });

  it('renders zero-width bars without dividing by zero when there are no votes', () => {
    const svg = describePollSvg({
      question: 'Chưa ai vote',
      options: [{ id: 'a', label: 'A', emoji: null }],
      votes: [],
    });

    expect(svg).toContain('0% · 0');
  });
});
