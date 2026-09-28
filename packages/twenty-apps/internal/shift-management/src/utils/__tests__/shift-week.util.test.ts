import { describe, expect, it } from 'vitest';

import {
  computeSpecialDayDatesInWeek,
  computeWeekTotals,
} from '../shift-week.util';

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
      registeredShift('08:00', '12:00', 'weekday'), // 4h -> weekday 24h
      registeredShift('08:00', '12:00', 'weekend'), // 4h
      registeredShift('08:00', '12:00', 'weekend'), // 4h -> weekend 8h
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

  it('counts an overnight 19:00-05:00 window as 10 hours', () => {
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
