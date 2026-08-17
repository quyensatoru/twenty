import {
  computeCheckInLateMinutes,
  computePayableMinutes,
  getShiftEndUtcMillis,
  getShiftStartUtcMillis,
  getTodayIct,
  parseHHmm,
} from 'src/modules/shift/utils/shift-time.util';

describe('parseHHmm', () => {
  it('parses HH:mm into minutes of day', () => {
    expect(parseHHmm('00:00')).toBe(0);
    expect(parseHHmm('05:30')).toBe(330);
    expect(parseHHmm('24:00')).toBe(1440);
  });
  it('throws on malformed input', () => {
    expect(() => parseHHmm('25:00')).toThrow();
    expect(() => parseHHmm('5:0')).toThrow();
  });
});

describe('getTodayIct', () => {
  it('formats the ICT calendar date as YYYY-MM-DD', () => {
    // 2026-08-11T18:00:00Z is already 2026-08-12 01:00 ICT (UTC+7)
    expect(getTodayIct(new Date('2026-08-11T18:00:00Z'))).toBe('2026-08-12');
    expect(getTodayIct(new Date('2026-08-11T10:00:00Z'))).toBe('2026-08-11');
  });
});

describe('getShiftStartUtcMillis', () => {
  it('returns the UTC instant of a shift start (ICT −7h)', () => {
    // 2026-08-15 14:00 ICT = 2026-08-15 07:00 UTC.
    expect(getShiftStartUtcMillis('2026-08-15', '14:00')).toBe(
      new Date('2026-08-15T07:00:00Z').getTime(),
    );
  });

  it('gates registration once "now" is past the start instant', () => {
    const startMillis = getShiftStartUtcMillis('2026-08-15', '14:00');

    expect(new Date('2026-08-15T15:00:00Z').getTime() >= startMillis).toBe(
      true,
    ); // 22:00 ICT
    expect(new Date('2026-08-15T05:00:00Z').getTime() >= startMillis).toBe(
      false,
    ); // 12:00 ICT
  });
});

describe('getShiftEndUtcMillis', () => {
  it('returns the UTC instant of a same-day shift end (ICT −7h)', () => {
    // 2026-08-13 17:00 ICT = 2026-08-13 10:00 UTC.
    expect(getShiftEndUtcMillis('2026-08-13', '09:00', '17:00')).toBe(
      new Date('2026-08-13T10:00:00Z').getTime(),
    );
  });

  it('wraps past midnight for an overnight shift (end <= start)', () => {
    // 19:00→05:00 ends 05:00 the next ICT day = 2026-08-13 22:00 UTC.
    expect(getShiftEndUtcMillis('2026-08-13', '19:00', '05:00')).toBe(
      new Date('2026-08-13T22:00:00Z').getTime(),
    );
  });

  it('gates a check-in as too late once "now" is past the end instant', () => {
    const endMillis = getShiftEndUtcMillis('2026-08-13', '09:00', '17:00');

    expect(new Date('2026-08-13T11:00:00Z').getTime() > endMillis).toBe(true); // 18:00 ICT
    expect(new Date('2026-08-13T05:00:00Z').getTime() > endMillis).toBe(false); // 12:00 ICT
  });
});

describe('computePayableMinutes (cap at the scheduled shift length)', () => {
  const template = { startTime: '14:00', endTime: '19:00' }; // 5h window

  it('pays the actual elapsed time when under the shift length', () => {
    expect(
      computePayableMinutes({
        checkInAt: new Date('2026-08-11T07:00:00Z'), // 14:00 ICT
        checkOutAt: new Date('2026-08-11T11:00:00Z'), // 18:00 ICT → 4h
        ...template,
      }),
    ).toBe(240);
  });

  it('caps at the shift length regardless of early check-in / late check-out', () => {
    expect(
      computePayableMinutes({
        checkInAt: new Date('2026-08-11T06:00:00Z'), // 13:00 ICT (1h early)
        checkOutAt: new Date('2026-08-11T14:00:00Z'), // 21:00 ICT (2h late) → 8h
        ...template,
      }),
    ).toBe(300); // capped to the 5h shift length
  });

  it('caps an overnight shift at its own length (00:00–05:00 punched 23:30 → 05:30)', () => {
    expect(
      computePayableMinutes({
        checkInAt: new Date('2026-08-10T16:30:00Z'), // 23:30 ICT (08-10)
        checkOutAt: new Date('2026-08-10T22:30:00Z'), // 05:30 ICT (08-11) → 6h
        startTime: '00:00',
        endTime: '05:00',
      }),
    ).toBe(300); // 5h, not 6h
  });

  it('pays the full elapsed time when the shift has no scheduled window', () => {
    expect(
      computePayableMinutes({
        checkInAt: new Date('2026-08-11T07:00:00Z'),
        checkOutAt: new Date('2026-08-11T14:00:00Z'), // 7h actual
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
        checkInAt: new Date('2026-08-11T07:00:00Z'),
      }),
    ).toBeNull(); // exactly 14:00 ICT
    expect(
      computeCheckInLateMinutes({
        ...shift,
        checkInAt: new Date('2026-08-11T06:50:00Z'),
      }),
    ).toBeNull(); // 13:50 ICT (early)
  });

  it('returns minutes late from the first minute past start', () => {
    expect(
      computeCheckInLateMinutes({
        ...shift,
        checkInAt: new Date('2026-08-11T07:02:00Z'),
      }),
    ).toBe(2); // 14:02 ICT
    expect(
      computeCheckInLateMinutes({
        ...shift,
        checkInAt: new Date('2026-08-11T07:20:00Z'),
      }),
    ).toBe(20); // 14:20 ICT
  });

  it('handles a punch landing on the next ICT day for a late-evening shift', () => {
    expect(
      computeCheckInLateMinutes({
        date: '2026-08-11',
        startTime: '23:30',
        checkInAt: new Date('2026-08-11T17:10:00Z'),
      }),
    ).toBe(40); // 00:10 ICT on 2026-08-12
  });
});
