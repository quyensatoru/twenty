import { describe, expect, it } from 'vitest';

import { describeSessionData } from '../describe-session-entry.util';

describe('describeSessionData', () => {
  it('names app keys for a person and reads each value type', () => {
    const entries = describeSessionData(
      {
        bloy: true,
        bloy_app_plan: 'Growth',
        bloy_store_email: 'timesavvy@probetter.kr',
        bloy_trial_day_left: 0,
        last_ooo_weekdays_message_at: '2026-09-30T01:02:09.702Z',
        custom_flag_x: 'abc',
        empty_value: '',
      },
      'BLOY',
    );

    expect(
      entries.map(({ label, kind, isHighlight }) => ({
        label,
        kind,
        isHighlight,
      })),
    ).toEqual([
      { label: 'App installed', kind: 'boolean', isHighlight: false },
      { label: 'App plan', kind: 'text', isHighlight: true },
      { label: 'Store email', kind: 'email', isHighlight: false },
      { label: 'Trial days left', kind: 'number', isHighlight: true },
      { label: 'Last out-of-office reply', kind: 'date', isHighlight: false },
      { label: 'Custom flag x', kind: 'text', isHighlight: false },
    ]);
  });

  it('treats an epoch under a *_at key as a date', () => {
    expect(
      describeSessionData({ signed_up_at: 1760000000 }, null)[0].kind,
    ).toBe('date');
  });
});
