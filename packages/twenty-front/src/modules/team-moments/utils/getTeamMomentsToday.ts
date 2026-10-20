import { isDefined } from 'twenty-shared/utils';

import {
  type TeamMomentsAudience,
  type TeamMomentsToday,
} from '@/team-moments/types/TeamMomentsToday';

export type TeamMomentsMemberProfileRecord = {
  memberId?: string | null;
  birthday?: string | null;
  joinedAt?: string | null;
  gender?: string | null;
};

export type TeamMomentsTeamEventRecord = {
  id: string;
  name?: string | null;
  kind?: string | null;
  date?: string | null;
  isYearly?: boolean | null;
  audience?: string | null;
};

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const parseIsoDate = (value: string | null | undefined) => {
  const match = ISO_DATE_PATTERN.exec(value ?? '');

  return isDefined(match)
    ? { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
    : null;
};

const isLeapYear = (year: number) =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

// Mirrors the app's rule: 29 February is celebrated on 28 February in
// non-leap years.
const isYearlyMatch = (
  date: { month: number; day: number },
  today: { year: number; month: number; day: number },
) => {
  const day =
    date.month === 2 && date.day === 29 && !isLeapYear(today.year)
      ? 28
      : date.day;

  return date.month === today.month && day === today.day;
};

export const getTeamMomentsToday = ({
  todayIsoDate,
  memberProfiles,
  teamEvents,
}: {
  todayIsoDate: string;
  memberProfiles: TeamMomentsMemberProfileRecord[];
  teamEvents: TeamMomentsTeamEventRecord[];
}): TeamMomentsToday[] => {
  const today = parseIsoDate(todayIsoDate);

  if (!isDefined(today)) {
    return [];
  }

  const moments: TeamMomentsToday[] = [];
  const memberIdsWithGender = (gender: string) =>
    memberProfiles
      .filter((profile) => profile.gender === gender)
      .map((profile) => profile.memberId)
      .filter(isDefined);

  for (const profile of memberProfiles) {
    const memberId = profile.memberId ?? null;
    const birthday = parseIsoDate(profile.birthday);
    const joinedAt = parseIsoDate(profile.joinedAt);

    if (isDefined(birthday) && isYearlyMatch(birthday, today)) {
      moments.push({
        key: `birthday:${memberId}:${today.year}`,
        kind: 'BIRTHDAY',
        name: '',
        memberId,
        years: today.year - birthday.year,
        audience: 'EVERYONE',
        honoreeIds: isDefined(memberId) ? [memberId] : [],
      });
    }

    if (
      isDefined(joinedAt) &&
      today.year > joinedAt.year &&
      isYearlyMatch(joinedAt, today)
    ) {
      moments.push({
        key: `anniversary:${memberId}:${today.year}`,
        kind: 'ANNIVERSARY',
        name: '',
        memberId,
        years: today.year - joinedAt.year,
        audience: 'EVERYONE',
        honoreeIds: isDefined(memberId) ? [memberId] : [],
      });
    }
  }

  for (const teamEvent of teamEvents) {
    const date = parseIsoDate(teamEvent.date);

    if (!isDefined(date)) {
      continue;
    }

    const isToday =
      teamEvent.isYearly === true
        ? isYearlyMatch(date, today)
        : teamEvent.date === todayIsoDate;

    if (isToday) {
      const audience: TeamMomentsAudience =
        teamEvent.audience === 'WOMEN' || teamEvent.audience === 'MEN'
          ? teamEvent.audience
          : 'EVERYONE';

      moments.push({
        key: `event:${teamEvent.id}:${todayIsoDate}`,
        kind: teamEvent.kind === 'HOLIDAY' ? 'HOLIDAY' : 'CUSTOM',
        name: teamEvent.name ?? '',
        memberId: null,
        years: null,
        audience,
        honoreeIds:
          audience === 'WOMEN'
            ? memberIdsWithGender('FEMALE')
            : audience === 'MEN'
              ? memberIdsWithGender('MALE')
              : [],
      });
    }
  }

  return moments;
};
