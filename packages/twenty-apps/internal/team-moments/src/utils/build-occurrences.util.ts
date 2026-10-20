import { type Occurrence } from '../types/occurrence';
import { type MemberProfileRow, type TeamEventRow } from '../types/moments-records';
import {
  daysBetween,
  formatIsoDate,
  nextYearlyDate,
  parseIsoDate,
} from './moments-date.util';

const DEFAULT_HORIZON_DAYS = 400;

type BuildOccurrencesInput = {
  todayIso: string;
  profiles: MemberProfileRow[];
  events: TeamEventRow[];
  memberNames: Record<string, string>;
  horizonDays?: number;
};

// Expands stored rows into dated occurrences from today on: every member's
// next birthday and next work anniversary, every yearly event's next date and
// every one-off event still ahead. The key identifies the occurrence across
// years, so one year's chat room and card never leak into the next.
export const buildOccurrences = ({
  todayIso,
  profiles,
  events,
  memberNames,
  horizonDays = DEFAULT_HORIZON_DAYS,
}: BuildOccurrencesInput): Occurrence[] => {
  const occurrences: Occurrence[] = [];
  const memberIdsByGender = {
    FEMALE: profiles.filter((profile) => profile.gender === 'FEMALE').map((profile) => profile.memberId),
    MALE: profiles.filter((profile) => profile.gender === 'MALE').map((profile) => profile.memberId),
  };

  const push = (occurrence: Omit<Occurrence, 'daysLeft'>) => {
    const daysLeft = daysBetween(todayIso, occurrence.date);

    if (daysLeft >= 0 && daysLeft <= horizonDays) {
      occurrences.push({ ...occurrence, daysLeft });
    }
  };

  for (const profile of profiles) {
    const name = memberNames[profile.memberId] ?? profile.displayName;
    const birthday = parseIsoDate(profile.birthday);
    const joinedAt = parseIsoDate(profile.joinedAt);

    if (birthday !== null) {
      const next = nextYearlyDate(birthday, todayIso);

      push({
        key: `birthday:${profile.memberId}:${next.year}`,
        kind: 'BIRTHDAY',
        title: `Sinh nhật ${name}`,
        date: formatIsoDate(next),
        memberId: profile.memberId,
        memberName: name,
        years: next.year - birthday.year,
        eventId: null,
        startTime: null,
        location: null,
        description: null,
        audience: 'EVERYONE',
        honoreeIds: [profile.memberId],
      });
    }

    if (joinedAt !== null) {
      const next = nextYearlyDate(joinedAt, todayIso);
      const years = next.year - joinedAt.year;

      if (years >= 1) {
        push({
          key: `anniversary:${profile.memberId}:${next.year}`,
          kind: 'ANNIVERSARY',
          title: `${name} · ${years} năm làm việc`,
          date: formatIsoDate(next),
          memberId: profile.memberId,
          memberName: name,
          years,
          eventId: null,
          startTime: null,
          location: null,
          description: null,
          audience: 'EVERYONE',
          honoreeIds: [profile.memberId],
        });
      }
    }
  }

  for (const event of events) {
    const stored = parseIsoDate(event.date);

    if (stored === null) {
      continue;
    }

    const date = event.isYearly ? nextYearlyDate(stored, todayIso) : stored;
    const isoDate = formatIsoDate(date);

    push({
      key: `event:${event.id}:${isoDate}`,
      kind: event.kind,
      title: event.name,
      date: isoDate,
      memberId: null,
      memberName: null,
      years: null,
      eventId: event.id,
      startTime: event.startTime,
      location: event.location,
      description: event.description,
      audience: event.audience ?? 'EVERYONE',
      honoreeIds:
        event.audience === 'WOMEN'
          ? memberIdsByGender.FEMALE
          : event.audience === 'MEN'
            ? memberIdsByGender.MALE
            : [],
    });
  }

  return occurrences.sort(
    (first, second) =>
      first.daysLeft - second.daysLeft || first.title.localeCompare(second.title),
  );
};
