import {
  computeMonthReport,
  formatMonthLabel,
  getCheckOutDeviationMinutes,
  getMonthRange,
  getRecentMonthValues,
  groupShiftsByWeek,
} from '@/shift/utils/shiftReport';

type ReportShift = {
  status: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  checkInAt: string | null;
  checkInLateMinutes: number | null;
  workingMinutes: number | null;
  rateMultiplier: number | null;
  shiftTemplateId: string | null;
};

const makeShift = (overrides: Partial<ReportShift> = {}): ReportShift => ({
  status: 'UPCOMING',
  date: '2026-08-10',
  startTime: '09:00',
  endTime: '17:00',
  checkInAt: null,
  checkInLateMinutes: null,
  workingMinutes: null,
  rateMultiplier: null,
  shiftTemplateId: null,
  ...overrides,
});

describe('computeMonthReport', () => {
  describe('registered totals', () => {
    it('sums scheduled-window hours of non-cancelled shifts and excludes cancelled', () => {
      const shifts = [
        makeShift({ startTime: '09:00', endTime: '17:00' }), // 8h
        makeShift({ startTime: '22:00', endTime: '06:00' }), // 8h overnight
        makeShift({
          status: 'CANCELLED',
          startTime: '09:00',
          endTime: '17:00',
        }), // excluded
      ];

      const report = computeMonthReport(shifts, {});

      expect(report.registeredHours).toBe(16);
      expect(report.registeredShiftCount).toBe(2);
      expect(report.cancelledCount).toBe(1);
    });
  });

  describe('absent inference', () => {
    // 2026-08-14T12:00:00Z is 19:00 ICT on 2026-08-14.
    const now = new Date('2026-08-14T12:00:00Z');

    it('counts an UPCOMING shift whose window has elapsed with no check-in', () => {
      const shifts = [
        makeShift({
          status: 'UPCOMING',
          date: '2026-08-13',
          startTime: '09:00',
          endTime: '17:00',
          checkInAt: null,
        }),
      ];

      expect(computeMonthReport(shifts, {}, now).absentCount).toBe(1);
    });

    it('does not count a shift whose window has not yet ended', () => {
      const shifts = [
        makeShift({
          status: 'UPCOMING',
          date: '2026-08-14',
          startTime: '21:00',
          endTime: '23:00',
          checkInAt: null,
        }),
      ];

      expect(computeMonthReport(shifts, {}, now).absentCount).toBe(0);
    });

    it('does not count an elapsed shift that has a check-in', () => {
      const shifts = [
        makeShift({
          status: 'UPCOMING',
          date: '2026-08-13',
          startTime: '09:00',
          endTime: '17:00',
          checkInAt: '2026-08-13T02:05:00Z',
        }),
      ];

      expect(computeMonthReport(shifts, {}, now).absentCount).toBe(0);
    });
  });

  describe('check-in late count', () => {
    it('counts every shift with checkInLateMinutes >= 1 with no grace threshold', () => {
      const shifts = [
        makeShift({ checkInLateMinutes: 1 }),
        makeShift({ checkInLateMinutes: 5 }),
        makeShift({ checkInLateMinutes: 0 }),
        makeShift({ checkInLateMinutes: null }),
      ];

      expect(computeMonthReport(shifts, {}).checkInLateCount).toBe(2);
    });
  });

  describe('total working hours (CRM-1313 per-shift rounding)', () => {
    it('rounds each shift to 2 decimals before summing, not sum-then-divide', () => {
      // 601 min / 60 = 10.0166… → 10.02 per shift. Three shifts: 30.06 (rounded
      // per shift) vs 1803 / 60 = 30.05 (sum-then-divide) — the two disagree.
      const shifts = [
        makeShift({ status: 'COMPLETED', workingMinutes: 601 }),
        makeShift({ status: 'COMPLETED', workingMinutes: 601 }),
        makeShift({ status: 'COMPLETED', workingMinutes: 601 }),
      ];

      const report = computeMonthReport(shifts, {});

      expect(report.totalWorkingHours).toBe(30.06);
      expect(report.totalWorkingHours).not.toBe(30.05);
    });
  });

  describe('overtime hours', () => {
    it('sums working hours only for shifts with rateMultiplier > 1', () => {
      const shifts = [
        makeShift({
          status: 'COMPLETED',
          workingMinutes: 480,
          rateMultiplier: 1.5,
        }), // 8h overtime
        makeShift({
          status: 'COMPLETED',
          workingMinutes: 480,
          rateMultiplier: 1,
        }), // not overtime
        makeShift({
          status: 'COMPLETED',
          workingMinutes: 240,
          rateMultiplier: 2,
        }), // 4h overtime
      ];

      expect(computeMonthReport(shifts, {}).overtimeHours).toBe(12);
    });
  });

  describe('earnings', () => {
    it('returns null when any completed shift template lacks salaryPerHour', () => {
      const shifts = [
        makeShift({
          status: 'COMPLETED',
          workingMinutes: 480,
          rateMultiplier: 1,
          shiftTemplateId: 'paid',
        }),
        makeShift({
          status: 'COMPLETED',
          workingMinutes: 480,
          rateMultiplier: 1,
          shiftTemplateId: 'unpaid',
        }),
      ];

      const templatesById = {
        paid: { salaryPerHour: 100 },
        unpaid: { salaryPerHour: null },
      };

      expect(computeMonthReport(shifts, templatesById).earnings).toBeNull();
    });

    it('sums hours × salaryPerHour × multiplier when all completed shifts have salary', () => {
      const shifts = [
        makeShift({
          status: 'COMPLETED',
          workingMinutes: 480, // 8h × 100 × 1 = 800
          rateMultiplier: 1,
          shiftTemplateId: 'paid',
        }),
        makeShift({
          status: 'COMPLETED',
          workingMinutes: 240, // 4h × 100 × 1.5 = 600
          rateMultiplier: 1.5,
          shiftTemplateId: 'paid',
        }),
        // An UPCOMING shift with no salary must not block earnings — only
        // completed shifts are reconciled.
        makeShift({ status: 'UPCOMING', shiftTemplateId: 'unpaid' }),
      ];

      const templatesById = {
        paid: { salaryPerHour: 100 },
        unpaid: { salaryPerHour: null },
      };

      expect(computeMonthReport(shifts, templatesById).earnings).toBe(1400);
    });
  });

  describe('status counts', () => {
    it('counts completed and cancelled shifts independently', () => {
      const shifts = [
        makeShift({ status: 'COMPLETED', workingMinutes: 480 }),
        makeShift({ status: 'COMPLETED', workingMinutes: 480 }),
        makeShift({ status: 'CANCELLED' }),
        makeShift({ status: 'UPCOMING' }),
      ];

      const report = computeMonthReport(shifts, {});

      expect(report.completedCount).toBe(2);
      expect(report.cancelledCount).toBe(1);
      expect(report.registeredShiftCount).toBe(3);
    });
  });
});

describe('getCheckOutDeviationMinutes', () => {
  const shift = {
    date: '2026-08-13',
    startTime: '09:00',
    endTime: '17:00', // scheduled end 17:00 ICT = 2026-08-13T10:00:00Z
    checkOutAt: null as string | null,
  };

  it('measures minutes between the check-out and the scheduled window end', () => {
    expect(
      getCheckOutDeviationMinutes({
        ...shift,
        checkOutAt: '2026-08-13T10:20:00Z', // 17:20 ICT → 20 min late
      }),
    ).toBe(20);
  });

  it('returns null when the check-out is unknown', () => {
    expect(
      getCheckOutDeviationMinutes({ ...shift, checkOutAt: null }),
    ).toBeNull();
  });
});

describe('getRecentMonthValues', () => {
  it('lists the current ICT month first, then previous months', () => {
    // 2026-08-14T12:00:00Z is still 2026-08 in ICT.
    const months = getRecentMonthValues(3, new Date('2026-08-14T12:00:00Z'));

    expect(months).toEqual(['2026-08', '2026-07', '2026-06']);
  });

  it('rolls the year boundary correctly', () => {
    const months = getRecentMonthValues(3, new Date('2026-01-14T12:00:00Z'));

    expect(months).toEqual(['2026-01', '2025-12', '2025-11']);
  });
});

describe('getMonthRange', () => {
  it('spans the first to last day of a 31-day month', () => {
    expect(getMonthRange('2026-08')).toEqual({
      fromDate: '2026-08-01',
      toDate: '2026-08-31',
    });
  });

  it('resolves February in a leap year to 29 days', () => {
    expect(getMonthRange('2028-02')).toEqual({
      fromDate: '2028-02-01',
      toDate: '2028-02-29',
    });
  });
});

describe('formatMonthLabel', () => {
  it('formats a YYYY-MM value as a month-and-year label', () => {
    expect(formatMonthLabel('2026-08')).toBe('August 2026');
  });
});

describe('groupShiftsByWeek', () => {
  // 2026-08-10..16 is one ICT Mon–Sun week; 2026-08-17..23 is the next.
  const groups = groupShiftsByWeek([
    makeShift({
      date: '2026-08-14',
      status: 'COMPLETED',
      startTime: '14:00',
      endTime: '19:00',
      workingMinutes: 300,
    }),
    makeShift({
      date: '2026-08-11',
      status: 'UPCOMING',
      startTime: '09:00',
      endTime: '12:00',
    }),
    makeShift({
      date: '2026-08-14',
      status: 'CANCELLED',
      startTime: '19:00',
      endTime: '24:00',
    }),
    makeShift({
      date: '2026-08-18',
      status: 'COMPLETED',
      startTime: '08:00',
      endTime: '10:00',
      workingMinutes: 90,
    }),
  ]);

  it('splits shifts into ICT Mon–Sun weeks, oldest first', () => {
    expect(groups).toHaveLength(2);
    expect(groups[0].weekStart).toBe('2026-08-10');
    expect(groups[0].weekEnd).toBe('2026-08-16');
    expect(groups[1].weekStart).toBe('2026-08-17');
    expect(groups[1].weekEnd).toBe('2026-08-23');
  });

  it('orders shifts inside a week by day then start time', () => {
    expect(
      groups[0].shifts.map((shift) => `${shift.date} ${shift.startTime}`),
    ).toEqual(['2026-08-11 09:00', '2026-08-14 14:00', '2026-08-14 19:00']);
  });

  it('sums registered hours over non-cancelled shifts and working hours over all', () => {
    // Registered: 09:00–12:00 (3h) + 14:00–19:00 (5h); the cancelled 19:00–24:00
    // is excluded → 8h. Working: only the completed 300 min → 5h.
    expect(groups[0].registeredHours).toBe(8);
    expect(groups[0].workingHours).toBe(5);
    expect(groups[1].registeredHours).toBe(2);
    expect(groups[1].workingHours).toBe(1.5);
  });
});
