import { isNonEmptyString } from '@sniptt/guards';

import {
  STALE_ITEM_MONTHS,
  VELOCITY_SPRINT_COUNT,
} from '../../constants/product-backlog';
import {
  type ProductItem,
  type SprintVelocity,
} from '../../types/product-backlog';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DAYS_PER_MONTH = 30;

export const sumStoryPoints = (
  items: readonly { storyPoints?: number | null }[],
): number => items.reduce((total, item) => total + (item.storyPoints ?? 0), 0);

export const averageVelocity = (
  velocity: readonly SprintVelocity[],
  sprintCount: number = VELOCITY_SPRINT_COUNT,
): number => {
  const finishedSprints = velocity
    .filter((sprint) => !sprint.isActive)
    .slice(-sprintCount);

  return finishedSprints.length === 0
    ? 0
    : Math.round(
        finishedSprints.reduce(
          (total, sprint) => total + sprint.completedPoints,
          0,
        ) / finishedSprints.length,
      );
};

export type SprintBurndownRow = {
  // yyyy-mm-dd, in UTC.
  date: string;
  ideal: number;
  remaining: number | null;
  scope: number | null;
};

export type SprintBurndown = {
  rows: SprintBurndownRow[];
  initialScope: number;
};

const readUtcDayIndex = (value: string | Date): number | null => {
  const time = new Date(value).getTime();

  return Number.isNaN(time) ? null : Math.floor(time / DAY_IN_MS);
};

const formatUtcDay = (dayIndex: number): string =>
  new Date(dayIndex * DAY_IN_MS).toISOString().slice(0, 10);

// Ideal falls linearly from the committed scope; remaining and scope stop at
// today, and include the items added after the sprint started.
export const buildSprintBurndown = ({
  startDate,
  endDate,
  items,
  committedIssueIds,
  doneAtByIssueId,
  today,
}: {
  startDate: string | null | undefined;
  endDate: string | null | undefined;
  items: readonly ProductItem[];
  committedIssueIds?: readonly string[] | null;
  doneAtByIssueId: Readonly<Record<string, string>>;
  today: Date;
}): SprintBurndown => {
  const committedIssueIdSet = new Set(committedIssueIds ?? []);
  const initialScope = sumStoryPoints(
    committedIssueIdSet.size === 0
      ? items
      : items.filter((item) => committedIssueIdSet.has(item.id)),
  );
  const startDay = isNonEmptyString(startDate)
    ? readUtcDayIndex(startDate)
    : null;
  const endDay = isNonEmptyString(endDate) ? readUtcDayIndex(endDate) : null;
  const todayDay = readUtcDayIndex(today);

  if (startDay === null || endDay === null || todayDay === null) {
    return { rows: [], initialScope };
  }

  const dayCount = Math.max(0, endDay - startDay);
  const scope = sumStoryPoints(items);
  const doneTimeByIssueId = new Map(
    items.flatMap((item) => {
      const doneAt = doneAtByIssueId[item.id];
      const doneTime = isNonEmptyString(doneAt)
        ? new Date(doneAt).getTime()
        : NaN;

      return Number.isNaN(doneTime) ? [] : [[item.id, doneTime] as const];
    }),
  );
  const rows: SprintBurndownRow[] = [];

  for (let dayOffset = 0; dayOffset <= dayCount; dayOffset++) {
    const day = startDay + dayOffset;
    const endOfDayTime = (day + 1) * DAY_IN_MS;
    const hasStarted = day <= todayDay;
    const donePoints = sumStoryPoints(
      items.filter((item) => {
        const doneTime = doneTimeByIssueId.get(item.id);

        return doneTime !== undefined && doneTime < endOfDayTime;
      }),
    );
    const idealRatio = dayCount === 0 ? 1 : dayOffset / dayCount;

    rows.push({
      date: formatUtcDay(day),
      ideal: Math.round(initialScope * (1 - idealRatio) * 10) / 10,
      remaining: hasStarted ? scope - donePoints : null,
      scope: hasStarted ? scope : null,
    });
  }

  return { rows, initialScope };
};

export const isItemStale = (
  item: ProductItem,
  now: Date,
  months: number = STALE_ITEM_MONTHS,
): boolean => {
  const lastTouchedAt = item.refinedAt ?? item.updatedAt ?? item.createdAt;

  if (!isNonEmptyString(lastTouchedAt)) {
    return false;
  }

  const lastTouchedTime = new Date(lastTouchedAt).getTime();

  return (
    !Number.isNaN(lastTouchedTime) &&
    now.getTime() - lastTouchedTime > months * DAYS_PER_MONTH * DAY_IN_MS
  );
};
