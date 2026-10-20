import { describe, expect, it } from 'vitest';

import { buildOccurrences } from '../build-occurrences.util';
import { getTodayIct, ictDateTimeToMillis, nextYearlyDate } from '../moments-date.util';

const profile = (overrides: Record<string, unknown> = {}) => ({
  id: 'profile-1',
  memberId: 'member-1',
  displayName: 'Trần Thu Hà',
  birthday: '1999-10-23',
  joinedAt: '2024-06-14',
  hideBirthYear: true,
  gender: 'FEMALE' as const,
  ...overrides,
});

describe('buildOccurrences', () => {
  it('derives the next birthday with age and a per-year key', () => {
    const [birthday] = buildOccurrences({
      todayIso: '2026-10-20',
      profiles: [profile({ joinedAt: null })],
      events: [],
      memberNames: {},
    });

    expect(birthday).toMatchObject({
      key: 'birthday:member-1:2026',
      kind: 'BIRTHDAY',
      date: '2026-10-23',
      daysLeft: 3,
      years: 27,
      title: 'Sinh nhật Trần Thu Hà',
    });
  });

  it('rolls a passed birthday over to next year', () => {
    const [birthday] = buildOccurrences({
      todayIso: '2026-10-24',
      profiles: [profile({ joinedAt: null })],
      events: [],
      memberNames: {},
    });

    expect(birthday.date).toBe('2027-10-23');
    expect(birthday.key).toBe('birthday:member-1:2027');
  });

  it('skips the anniversary before the first full year', () => {
    const occurrences = buildOccurrences({
      todayIso: '2026-10-20',
      profiles: [profile({ birthday: null, joinedAt: '2026-10-25' })],
      events: [],
      memberNames: {},
    });

    expect(occurrences).toHaveLength(0);
  });

  it('counts anniversary years and prefers the live member name', () => {
    const [anniversary] = buildOccurrences({
      todayIso: '2026-10-20',
      profiles: [profile({ birthday: null, joinedAt: '2023-10-27' })],
      events: [],
      memberNames: { 'member-1': 'Thu Hà' },
    });

    expect(anniversary).toMatchObject({
      kind: 'ANNIVERSARY',
      years: 3,
      daysLeft: 7,
      title: 'Thu Hà · 3 năm làm việc',
    });
  });

  it('keeps today, drops past one-off events and sorts by countdown', () => {
    const occurrences = buildOccurrences({
      todayIso: '2026-10-20',
      profiles: [],
      events: [
        { id: 'e1', name: 'Year End Party', kind: 'CUSTOM', date: '2026-12-24', isYearly: false, startTime: '18:30', location: null, description: null, organizerId: null, audience: null },
        { id: 'e2', name: 'Ngày Phụ nữ Việt Nam', kind: 'HOLIDAY', date: '2000-10-20', isYearly: true, startTime: null, location: null, description: null, organizerId: null, audience: null },
        { id: 'e3', name: 'Kick-off', kind: 'CUSTOM', date: '2026-01-05', isYearly: false, startTime: null, location: null, description: null, organizerId: null, audience: null },
      ],
      memberNames: {},
    });

    expect(occurrences.map((occurrence) => occurrence.key)).toEqual([
      'event:e2:2026-10-20',
      'event:e1:2026-12-24',
    ]);
    expect(occurrences[0].daysLeft).toBe(0);
  });
});

describe('moments dates', () => {
  it('reads today in Vietnam time', () => {
    expect(getTodayIct(new Date('2026-10-19T17:30:00Z'))).toBe('2026-10-20');
    expect(getTodayIct(new Date('2026-10-19T16:30:00Z'))).toBe('2026-10-19');
  });

  it('moves 29 February to 28 February in a non-leap year', () => {
    expect(nextYearlyDate({ month: 2, day: 29 }, '2026-01-10')).toEqual({ year: 2026, month: 2, day: 28 });
  });

  it('converts an ICT wall-clock time to an instant', () => {
    expect(new Date(ictDateTimeToMillis('2026-10-23', '08:30')).toISOString()).toBe('2026-10-23T01:30:00.000Z');
  });
});

describe('buildOccurrences honorees', () => {
  it('lists every female member as honoree of a women-only occasion', () => {
    const [womensDay] = buildOccurrences({
      todayIso: '2026-10-20',
      profiles: [
        profile({ memberId: 'member-1', birthday: null, joinedAt: null, gender: 'FEMALE' }),
        profile({ memberId: 'member-2', birthday: null, joinedAt: null, gender: 'MALE' }),
        profile({ memberId: 'member-3', birthday: null, joinedAt: null, gender: 'UNSPECIFIED' }),
      ],
      events: [
        { id: 'e1', name: 'Ngày Phụ nữ Việt Nam', kind: 'HOLIDAY', date: '2000-10-20', isYearly: true, startTime: null, location: null, description: null, organizerId: null, audience: 'WOMEN' },
      ],
      memberNames: {},
    });

    expect(womensDay.audience).toBe('WOMEN');
    expect(womensDay.honoreeIds).toEqual(['member-1']);
  });
});
