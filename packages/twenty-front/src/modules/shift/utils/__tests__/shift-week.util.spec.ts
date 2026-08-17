import {
  computeSpecialDayDatesInWeek,
  computeWeekTotals,
  formatWorkingHours,
  getCheckInOpensAtLabel,
  getIctToday,
  getIctWeekRange,
  getScheduledMinutes,
  isCheckInWindowOpen,
  isShiftMissed,
  parseHHmm,
} from '@/shift/utils/shiftWeek';

const ictWeekday = (isoDate: string): string =>
  // Anchor the pure date at UTC noon so no timezone can roll it to an adjacent day.
  new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
  }).format(new Date(`${isoDate}T12:00:00Z`));

describe('getIctWeekRange', () => {
  it('places a Wednesday-evening UTC instant that is already Thursday ICT in the correct week', () => {
    // 18:00 UTC Wed 2026-08-12 is 01:00 ICT Thu 2026-08-13.
    const reference = new Date('2026-08-12T18:00:00Z');

    const { days, fromDate, toDate } = getIctWeekRange(reference);

    expect(getIctToday(reference)).toBe('2026-08-13');
    expect(days).toContain('2026-08-13');
    expect(fromDate).toBe('2026-08-10');
    expect(toDate).toBe('2026-08-16');
  });

  it('starts the week on Monday and ends on Sunday (ICT)', () => {
    const { days } = getIctWeekRange(new Date('2026-08-12T18:00:00Z'));

    expect(ictWeekday(days[0])).toBe('Mon');
    expect(ictWeekday(days[6])).toBe('Sun');
  });

  it('returns 7 consecutive day entries Monday→Sunday', () => {
    const { days } = getIctWeekRange(new Date('2026-08-12T18:00:00Z'));

    expect(days).toHaveLength(7);
    expect(days).toEqual([
      '2026-08-10',
      '2026-08-11',
      '2026-08-12',
      '2026-08-13',
      '2026-08-14',
      '2026-08-15',
      '2026-08-16',
    ]);
  });

  it('rolls into the next week when a Sunday-evening UTC instant is already Monday ICT', () => {
    // 18:00 UTC Sun 2026-08-16 is 01:00 ICT Mon 2026-08-17 — a week boundary a
    // UTC-based computation would get wrong (it would return the previous week).
    const reference = new Date('2026-08-16T18:00:00Z');

    const { days, fromDate, toDate } = getIctWeekRange(reference);

    expect(getIctToday(reference)).toBe('2026-08-17');
    expect(fromDate).toBe('2026-08-17');
    expect(toDate).toBe('2026-08-23');
    expect(days[0]).toBe('2026-08-17');
  });

  it('keeps fromDate lexicographically before or equal to toDate', () => {
    const { fromDate, toDate } = getIctWeekRange(
      new Date('2026-08-12T18:00:00Z'),
    );

    expect(fromDate <= toDate).toBe(true);
  });
});

describe('parseHHmm', () => {
  it('converts HH:mm to minutes of day', () => {
    expect(parseHHmm('00:00')).toBe(0);
    expect(parseHHmm('09:30')).toBe(570);
    expect(parseHHmm('24:00')).toBe(1440);
  });

  it('throws on an invalid time string', () => {
    expect(() => parseHHmm('25:00')).toThrow();
    expect(() => parseHHmm('9:5')).toThrow();
  });
});

describe('isCheckInWindowOpen', () => {
  it('is closed when the shift is not today (ICT)', () => {
    // Reference is Thu 2026-08-13 ICT; the shift is dated the previous day.
    const reference = new Date('2026-08-12T18:00:00Z');

    expect(
      isCheckInWindowOpen({
        date: '2026-08-12',
        startTime: '09:00',
        endTime: '17:00',
        earlyCheckInMinutes: 15,
        reference,
      }),
    ).toBe(false);
  });

  it('is open once the early window has opened on the shift day', () => {
    // 02:00 UTC = 09:00 ICT, exactly at start; 15 min early padding is already open.
    const reference = new Date('2026-08-13T02:00:00Z');

    expect(
      isCheckInWindowOpen({
        date: '2026-08-13',
        startTime: '09:00',
        endTime: '17:00',
        earlyCheckInMinutes: 15,
        reference,
      }),
    ).toBe(true);
  });

  it('is closed before the early window opens', () => {
    // 01:30 UTC = 08:30 ICT; window for a 09:00 start with 15 min padding opens 08:45.
    const reference = new Date('2026-08-13T01:30:00Z');

    expect(
      isCheckInWindowOpen({
        date: '2026-08-13',
        startTime: '09:00',
        endTime: '17:00',
        earlyCheckInMinutes: 15,
        reference,
      }),
    ).toBe(false);
  });

  it('is closed once the scheduled window has fully elapsed (missed)', () => {
    // 11:00 UTC = 18:00 ICT, past a 09:00–17:00 shift's end even though it is
    // still the shift day and the lower bound is long open.
    const reference = new Date('2026-08-13T11:00:00Z');

    expect(
      isCheckInWindowOpen({
        date: '2026-08-13',
        startTime: '09:00',
        endTime: '17:00',
        earlyCheckInMinutes: 15,
        reference,
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
    // 11:00 UTC = 18:00 ICT, past the 17:00 end.
    expect(isShiftMissed(baseShift, new Date('2026-08-13T11:00:00Z'))).toBe(
      true,
    );
  });

  it('is not missed while the window is still open', () => {
    // 05:00 UTC = 12:00 ICT, inside the 09:00–17:00 window.
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

describe('computeWeekTotals', () => {
  const templatesById = {
    weekday: { startTime: '08:00', endTime: '13:00', dayKind: 'WEEKDAY' },
    weekend: { startTime: '08:00', endTime: '12:00', dayKind: 'WEEKEND' },
    holidayOt: { startTime: '08:00', endTime: '11:00', dayKind: 'HOLIDAY_OT' },
  };

  const registeredShift = (
    startTime: string,
    endTime: string,
    shiftTemplateId: string,
    status = 'UPCOMING',
  ) => ({ status, startTime, endTime, shiftTemplateId });

  it('sums 5 weekday (24h) and 2 weekend (8h) shifts into neutral totals', () => {
    const shifts = [
      registeredShift('08:00', '13:00', 'weekday'), // 5h
      registeredShift('08:00', '13:00', 'weekday'), // 5h
      registeredShift('08:00', '13:00', 'weekday'), // 5h
      registeredShift('08:00', '13:00', 'weekday'), // 5h
      registeredShift('08:00', '12:00', 'weekday'), // 4h → weekday 24h
      registeredShift('08:00', '12:00', 'weekend'), // 4h
      registeredShift('08:00', '12:00', 'weekend'), // 4h → weekend 8h
    ];

    expect(
      computeWeekTotals({ shifts, selections: [], templatesById }),
    ).toEqual({
      totalHours: 32,
      totalShiftCount: 7,
      weekdayShiftCount: 5,
      weekendShiftCount: 2,
    });
  });

  it('counts an overnight 19:00–05:00 window as 10 hours', () => {
    const shifts = [registeredShift('19:00', '05:00', 'weekday')];

    expect(
      computeWeekTotals({ shifts, selections: [], templatesById }),
    ).toEqual({
      totalHours: 10,
      totalShiftCount: 1,
      weekdayShiftCount: 1,
      weekendShiftCount: 0,
    });
  });

  it('excludes cancelled shifts from both hours and counts', () => {
    const shifts = [
      registeredShift('08:00', '12:00', 'weekend'), // 4h, counts
      registeredShift('08:00', '16:00', 'weekday', 'CANCELLED'), // excluded
    ];

    expect(
      computeWeekTotals({ shifts, selections: [], templatesById }),
    ).toEqual({
      totalHours: 4,
      totalShiftCount: 1,
      weekdayShiftCount: 0,
      weekendShiftCount: 1,
    });
  });

  it('includes newly selected cells using their template window', () => {
    const selections = [{ templateId: 'weekday' }, { templateId: 'weekend' }];

    expect(
      computeWeekTotals({ shifts: [], selections, templatesById }),
    ).toEqual({
      totalHours: 9,
      totalShiftCount: 2,
      weekdayShiftCount: 1,
      weekendShiftCount: 1,
    });
  });

  it('counts a HOLIDAY_OT shift into totalHours/totalShiftCount but not the weekday/weekend split', () => {
    const shifts = [
      registeredShift('08:00', '13:00', 'weekday'), // 5h
      registeredShift('08:00', '12:00', 'weekend'), // 4h
      registeredShift('08:00', '11:00', 'holidayOt'), // 3h, HOLIDAY_OT
    ];

    expect(
      computeWeekTotals({ shifts, selections: [], templatesById }),
    ).toEqual({
      totalHours: 12,
      totalShiftCount: 3,
      weekdayShiftCount: 1,
      weekendShiftCount: 1,
    });
  });
});

describe('computeSpecialDayDatesInWeek', () => {
  const days = [
    '2026-08-10',
    '2026-08-11',
    '2026-08-12',
    '2026-08-13',
    '2026-08-14',
    '2026-08-15',
    '2026-08-16',
  ];

  it('matches a SPECIFIC date that falls inside the week', () => {
    const specialDays = [
      { kind: 'SPECIFIC', month: null, day: null, date: '2026-08-13' },
    ];

    expect(computeSpecialDayDatesInWeek({ specialDays, days })).toEqual(
      new Set(['2026-08-13']),
    );
  });

  it('matches a YEARLY month/day that falls inside the week', () => {
    const specialDays = [{ kind: 'YEARLY', month: 8, day: 15, date: null }];

    expect(computeSpecialDayDatesInWeek({ specialDays, days })).toEqual(
      new Set(['2026-08-15']),
    );
  });

  it('does not match a special day outside the week', () => {
    const specialDays = [
      { kind: 'SPECIFIC', month: null, day: null, date: '2026-08-01' },
      { kind: 'YEARLY', month: 1, day: 1, date: null },
    ];

    expect(computeSpecialDayDatesInWeek({ specialDays, days })).toEqual(
      new Set(),
    );
  });

  it('returns an empty set when there are no special days', () => {
    expect(computeSpecialDayDatesInWeek({ specialDays: [], days })).toEqual(
      new Set(),
    );
  });
});
