import { type Occurrence } from '../../types/occurrence';
import { parseIsoDate } from '../../utils/moments-date.util';

const WEEKDAYS = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

export const formatLongDate = (isoDate: string): string => {
  const date = parseIsoDate(isoDate);

  if (date === null) {
    return isoDate;
  }

  const weekday = WEEKDAYS[new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay()];

  return `${weekday}, ${String(date.day).padStart(2, '0')}/${String(date.month).padStart(2, '0')}/${date.year}`;
};

export const formatDaysLeft = (daysLeft: number): string => {
  if (daysLeft === 0) {
    return 'Hôm nay';
  }

  if (daysLeft === 1) {
    return 'Ngày mai';
  }

  return `còn ${daysLeft} ngày`;
};

export const describeHonorees = (occurrence: Occurrence): string | null => {
  if (occurrence.audience === 'EVERYONE') {
    return null;
  }

  const group = occurrence.audience === 'WOMEN' ? 'chị em' : 'anh em';

  return occurrence.honoreeIds.length === 0
    ? `chưa khai giới tính ai là ${group}`
    : `dành cho ${occurrence.honoreeIds.length} ${group}`;
};

export const describeOccurrence = (occurrence: Occurrence): string => {
  const parts: string[] = [formatLongDate(occurrence.date)];

  if (occurrence.kind === 'BIRTHDAY' && occurrence.years !== null && occurrence.years > 0 && occurrence.years < 120) {
    parts.push(`tròn ${occurrence.years} tuổi`);
  }

  if (occurrence.startTime !== null && occurrence.startTime.length > 0) {
    parts.push(occurrence.startTime);
  }

  if (occurrence.location !== null && occurrence.location.length > 0) {
    parts.push(occurrence.location);
  }

  const honoreeLabel = describeHonorees(occurrence);

  if (honoreeLabel !== null) {
    parts.push(honoreeLabel);
  }

  return parts.join(' · ');
};

type OccurrenceGroup = { title: string; occurrences: Occurrence[] };

export const groupOccurrences = (occurrences: Occurrence[]): OccurrenceGroup[] => {
  const groups: OccurrenceGroup[] = [
    { title: 'Hôm nay', occurrences: occurrences.filter((occurrence) => occurrence.daysLeft === 0) },
    { title: 'Trong 7 ngày tới', occurrences: occurrences.filter((occurrence) => occurrence.daysLeft >= 1 && occurrence.daysLeft <= 7) },
    { title: 'Trong 30 ngày tới', occurrences: occurrences.filter((occurrence) => occurrence.daysLeft > 7 && occurrence.daysLeft <= 30) },
    { title: 'Sau đó', occurrences: occurrences.filter((occurrence) => occurrence.daysLeft > 30) },
  ];

  return groups.filter((group) => group.occurrences.length > 0);
};
