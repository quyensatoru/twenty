import { describe, expect, it } from 'vitest';

import { DEFAULT_HOLIDAYS } from '../../constants/default-holidays';
import { getMissingDefaultHolidays } from '../get-missing-default-holidays.util';

describe('getMissingDefaultHolidays', () => {
  it('adds only missing holidays in an existing workspace', () => {
    const missing = getMissingDefaultHolidays([
      { kind: 'HOLIDAY', name: 'Tết Dương lịch', date: '2000-01-01' },
      { kind: 'CUSTOM', name: 'Giỗ Tổ Hùng Vương', date: '2027-04-16' },
    ]);

    expect(missing).not.toContainEqual(DEFAULT_HOLIDAYS[0]);
    expect(missing).toContainEqual({
      name: 'Giỗ Tổ Hùng Vương',
      date: '2027-04-16',
      isYearly: false,
      audience: 'EVERYONE',
    });
    expect(missing).toHaveLength(DEFAULT_HOLIDAYS.length - 1);
  });

  it('has nothing left to add after seeding', () => {
    expect(getMissingDefaultHolidays(DEFAULT_HOLIDAYS.map((holiday) => ({ ...holiday, kind: 'HOLIDAY' })))).toEqual([]);
  });
});
