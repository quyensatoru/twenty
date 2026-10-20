import { getTeamMomentsToday } from '@/team-moments/utils/getTeamMomentsToday';
import { getTeamMomentsTodayIsoDate } from '@/team-moments/utils/getTeamMomentsTodayIsoDate';

describe('getTeamMomentsToday', () => {
  it('finds birthdays, anniversaries and events falling today', () => {
    const moments = getTeamMomentsToday({
      todayIsoDate: '2026-10-20',
      memberProfiles: [
        {
          memberId: 'member-1',
          birthday: '1999-10-20',
          joinedAt: '2023-10-20',
          gender: 'FEMALE',
        },
        {
          memberId: 'member-2',
          birthday: '1990-10-21',
          joinedAt: '2026-10-20',
          gender: 'MALE',
        },
      ],
      teamEvents: [
        {
          id: 'event-1',
          name: 'Ngày Phụ nữ Việt Nam',
          kind: 'HOLIDAY',
          date: '2000-10-20',
          isYearly: true,
          audience: 'WOMEN',
        },
        {
          id: 'event-2',
          name: 'Kick-off',
          kind: 'CUSTOM',
          date: '2025-10-20',
          isYearly: false,
        },
      ],
    });

    expect(moments).toEqual([
      {
        key: 'birthday:member-1:2026',
        kind: 'BIRTHDAY',
        name: '',
        memberId: 'member-1',
        years: 27,
        audience: 'EVERYONE',
        honoreeIds: ['member-1'],
      },
      {
        key: 'anniversary:member-1:2026',
        kind: 'ANNIVERSARY',
        name: '',
        memberId: 'member-1',
        years: 3,
        audience: 'EVERYONE',
        honoreeIds: ['member-1'],
      },
      {
        key: 'event:event-1:2026-10-20',
        kind: 'HOLIDAY',
        name: 'Ngày Phụ nữ Việt Nam',
        memberId: null,
        years: null,
        audience: 'WOMEN',
        honoreeIds: ['member-1'],
      },
    ]);
  });

  it('celebrates 29 February birthdays on 28 February in non-leap years', () => {
    const moments = getTeamMomentsToday({
      todayIsoDate: '2027-02-28',
      memberProfiles: [{ memberId: 'member-1', birthday: '2000-02-29' }],
      teamEvents: [],
    });

    expect(moments).toHaveLength(1);
  });
});

describe('getTeamMomentsTodayIsoDate', () => {
  it('flips the day at midnight Vietnam time', () => {
    expect(getTeamMomentsTodayIsoDate(new Date('2026-10-19T17:00:00Z'))).toBe(
      '2026-10-20',
    );
    expect(getTeamMomentsTodayIsoDate(new Date('2026-10-19T16:59:00Z'))).toBe(
      '2026-10-19',
    );
  });
});
