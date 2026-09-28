import { describe, expect, it } from 'vitest';

import {
  computeCheckInLateMinutes,
  computePayableMinutes,
  formatWorkingHours,
  getCheckInOpensAtLabel,
  getScheduledMinutes,
  getShiftEndUtcMillis,
  getShiftStartUtcMillis,
  getTodayIct,
  isCheckInWindowOpen,
  isShiftMissed,
  parseHHmm,
} from '../shift-time.util';

describe('parseHHmm', () => {
  it('parses HH:mm into minutes of day', () => {
    expect(parseHHmm('00:00')).toBe(0);
    expect(parseHHmm('05:30')).toBe(330);
    expect(parseHHmm('09:30')).toBe(570);
    expect(parseHHmm('24:00')).toBe(1440);
  });

  it('throws on malformed input', () => {
    expect(() => parseHHmm('25:00')).toThrow();
    expect(() => parseHHmm('5:0')).toThrow();
  });
});

describe('getTodayIct', () => {
  it('formats the ICT calendar date as YYYY-MM-DD', () => {
    // 2026-08-11T18:00:00Z is already 2026-08-12 01:00 ICT (UTC+7).
    expect(getTodayIct(new Date('2026-08-11T18:00:00Z'))).toBe('2026-08-12');
    expect(getTodayIct(new Date('2026-08-11T10:00:00Z'))).toBe('2026-08-11');
  });
});

describe('getShiftStartUtcMillis', () => {
  it('returns the UTC instant of a shift start (ICT -7h)', () => {
    // 2026-08-15 14:00 ICT = 2026-08-15 07:00 UTC.
    expect(getShiftStartUtcMillis('2026-08-15', '14:00')).toBe(
      new Date('2026-08-15T07:00:00Z').getTime(),
    );
  });

  it('gates registration once "now" is past the start instant', () => {
    const startMillis = getShiftStartUtcMillis('2026-08-15', '14:00');

    // 22:00 ICT.
    expect(new Date('2026-08-15T15:00:00Z').getTime() >= startMillis).toBe(
      true,
    );
    // 12:00 ICT.
    expect(new Date('2026-08-15T05:00:00Z').getTime() >= startMillis).toBe(
      false,
    );
  });
});

describe('getShiftEndUtcMillis', () => {
  it('returns the UTC instant of a same-day shift end (ICT -7h)', () => {
    // 2026-08-13 17:00 ICT = 2026-08-13 10:00 UTC.
    expect(getShiftEndUtcMillis('2026-08-13', '09:00', '17:00')).toBe(
      new Date('2026-08-13T10:00:00Z').getTime(),
    );
  });

  it('wraps past midnight for an overnight shift (end <= start)', () => {
    // 19:00 -> 05:00 ends 05:00 the next ICT day = 2026-08-13 22:00 UTC.
    expect(getShiftEndUtcMillis('2026-08-13', '19:00', '05:00')).toBe(
      new Date('2026-08-13T22:00:00Z').getTime(),
    );
  });

  it('gates a check-in as too late once "now" is past the end instant', () => {
    const endMillis = getShiftEndUtcMillis('2026-08-13', '09:00', '17:00');

    // 18:00 ICT.
    expect(new Date('2026-08-13T11:00:00Z').getTime() > endMillis).toBe(true);
    // 12:00 ICT.
    expect(new Date('2026-08-13T05:00:00Z').getTime() > endMillis).toBe(false);
  });
});

describe('getScheduledMinutes', () => {
  it('measures a same-day window', () => {
    expect(getScheduledMinutes('09:00', '17:00')).toBe(480);
  });

  it('wraps an overnight window past midnight', () => {
    expect(getScheduledMinutes('22:00', '06:00')).toBe(480);
  });

  it('returns 0 when the window is incomplete', () => {
    expect(getScheduledMinutes(null, '17:00')).toBe(0);
    expect(getScheduledMinutes('09:00', null)).toBe(0);
  });
});

describe('computePayableMinutes (cap at the scheduled shift length)', () => {
  const template = { startTime: '14:00', endTime: '19:00' };

  it('pays the actual elapsed time when under the shift length', () => {
    expect(
      computePayableMinutes({
        checkInAt: new Date('2026-08-11T07:00:00Z'), // 14:00 ICT
        checkOutAt: new Date('2026-08-11T11:00:00Z'), // 18:00 ICT -> 4h
        ...template,
      }),
    ).toBe(240);
  });

  it('caps at the shift length regardless of early check-in / late check-out', () => {
    expect(
      computePayableMinutes({
        checkInAt: new Date('2026-08-11T06:00:00Z'), // 13:00 ICT (1h early)
        checkOutAt: new Date('2026-08-11T14:00:00Z'), // 21:00 ICT (2h late)
        ...template,
      }),
    ).toBe(300);
  });

  it('caps an overnight shift at its own length (00:00-05:00 punched 23:30 -> 05:30)', () => {
    expect(
      computePayableMinutes({
        checkInAt: new Date('2026-08-10T16:30:00Z'), // 23:30 ICT (08-10)
        checkOutAt: new Date('2026-08-10T22:30:00Z'), // 05:30 ICT (08-11)
        startTime: '00:00',
        endTime: '05:00',
      }),
    ).toBe(300);
  });

  it('pays the full elapsed time when the shift has no scheduled window', () => {
    expect(
      computePayableMinutes({
        checkInAt: new Date('2026-08-11T07:00:00Z'),
        checkOutAt: new Date('2026-08-11T14:00:00Z'),
        startTime: null,
        endTime: null,
      }),
    ).toBe(420);
  });

  it('never returns negative minutes', () => {
    expect(
      computePayableMinutes({
        checkInAt: new Date('2026-08-11T11:00:00Z'),
        checkOutAt: new Date('2026-08-11T10:00:00Z'),
        ...template,
      }),
    ).toBe(0);
  });
});

describe('computeCheckInLateMinutes (NO grace — BR-9.1)', () => {
  const shift = { date: '2026-08-11', startTime: '14:00' };

  it('returns null when punching at or before start', () => {
    expect(
      computeCheckInLateMinutes({
        ...shift,
        checkInAt: new Date('2026-08-11T07:00:00Z'), // exactly 14:00 ICT
      }),
    ).toBeNull();
    expect(
      computeCheckInLateMinutes({
        ...shift,
        checkInAt: new Date('2026-08-11T06:50:00Z'), // 13:50 ICT
      }),
    ).toBeNull();
  });

  it('returns minutes late from the first minute past start', () => {
    expect(
      computeCheckInLateMinutes({
        ...shift,
        checkInAt: new Date('2026-08-11T07:02:00Z'), // 14:02 ICT
      }),
    ).toBe(2);
    expect(
      computeCheckInLateMinutes({
        ...shift,
        checkInAt: new Date('2026-08-11T07:20:00Z'), // 14:20 ICT
      }),
    ).toBe(20);
  });

  it('handles a punch landing on the next ICT day for a late-evening shift', () => {
    expect(
      computeCheckInLateMinutes({
        date: '2026-08-11',
        startTime: '23:30',
        checkInAt: new Date('2026-08-11T17:10:00Z'), // 00:10 ICT on 2026-08-12
      }),
    ).toBe(40);
  });
});

describe('isCheckInWindowOpen', () => {
  it('is closed when the shift is not today (ICT)', () => {
    expect(
      isCheckInWindowOpen({
        date: '2026-08-12',
        startTime: '09:00',
        endTime: '17:00',
        earlyCheckInMinutes: 15,
        reference: new Date('2026-08-12T18:00:00Z'),
      }),
    ).toBe(false);
  });

  it('is open once the early window has opened on the shift day', () => {
    expect(
      isCheckInWindowOpen({
        date: '2026-08-13',
        startTime: '09:00',
        endTime: '17:00',
        earlyCheckInMinutes: 15,
        reference: new Date('2026-08-13T02:00:00Z'), // 09:00 ICT
      }),
    ).toBe(true);
  });

  it('is closed before the early window opens', () => {
    expect(
      isCheckInWindowOpen({
        date: '2026-08-13',
        startTime: '09:00',
        endTime: '17:00',
        earlyCheckInMinutes: 15,
        reference: new Date('2026-08-13T01:30:00Z'), // 08:30 ICT, opens 08:45
      }),
    ).toBe(false);
  });

  it('is closed once the scheduled window has fully elapsed (missed)', () => {
    expect(
      isCheckInWindowOpen({
        date: '2026-08-13',
        startTime: '09:00',
        endTime: '17:00',
        earlyCheckInMinutes: 15,
        reference: new Date('2026-08-13T11:00:00Z'), // 18:00 ICT
      }),
    ).toBe(false);
  });
});

describe('isShiftMissed', () => {
  const baseShift = {
    status: 'UPCOMING',
    date: '2026-08-13',
    startTime: '09:00',
    endTime: '17:00',
    checkInAt: null,
  };

  it('is missed when an UPCOMING shift with no check-in has ended', () => {
    expect(isShiftMissed(baseShift, new Date('2026-08-13T11:00:00Z'))).toBe(
      true,
    );
  });

  it('is not missed while the window is still open', () => {
    expect(isShiftMissed(baseShift, new Date('2026-08-13T05:00:00Z'))).toBe(
      false,
    );
  });

  it('is not missed when the member already checked in', () => {
    expect(
      isShiftMissed(
        { ...baseShift, checkInAt: '2026-08-13T02:05:00Z' },
        new Date('2026-08-13T11:00:00Z'),
      ),
    ).toBe(false);
  });

  it('is not missed for a non-UPCOMING status', () => {
    expect(
      isShiftMissed(
        { ...baseShift, status: 'COMPLETED' },
        new Date('2026-08-13T11:00:00Z'),
      ),
    ).toBe(false);
  });
});

describe('getCheckInOpensAtLabel', () => {
  it('formats the opens-at time as HH:mm', () => {
    expect(getCheckInOpensAtLabel('09:00', 15)).toBe('08:45');
    expect(getCheckInOpensAtLabel('09:00', null)).toBe('09:00');
  });
});

describe('formatWorkingHours', () => {
  it('formats minutes as X.XXh', () => {
    expect(formatWorkingHours(465)).toBe('7.75h');
    expect(formatWorkingHours(0)).toBe('0.00h');
  });
});
