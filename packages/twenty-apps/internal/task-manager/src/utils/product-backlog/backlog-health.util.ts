import { isNonEmptyString } from '@sniptt/guards';

import {
  MAX_SPRINT_ITEM_POINTS,
  STALE_ITEM_MONTHS,
} from '../../constants/product-backlog';
import {
  type ProductBacklogSettings,
  type ProductItem,
} from '../../types/product-backlog';
import { isItemStale } from './backlog-metrics.util';
import {
  type PrioritizationTemplate,
  readFiniteNumber,
} from './prioritization-template.util';
import { scoreItem } from './prioritization-templates.util';

// Used when the team has no finished sprint to measure velocity from.
const FALLBACK_VELOCITY = 30;
const REFINEMENT_HORIZON_SPRINTS = 3;
const UNESTIMATED_ITEM_POINTS = 3;
const LOW_PRIORITY_TIER_ORDER = 3;

export type RefinementHorizon = {
  topItems: ProductItem[];
  notReadyItems: ProductItem[];
  horizonPoints: number;
};

// The top of the backlog that fills about three sprints is what the team
// should keep ready.
export const selectRefinementHorizon = ({
  backlogItems,
  velocity,
  isReady,
}: {
  backlogItems: readonly ProductItem[];
  velocity: number;
  isReady: (item: ProductItem) => boolean;
}): RefinementHorizon => {
  const horizonPoints =
    (velocity || FALLBACK_VELOCITY) * REFINEMENT_HORIZON_SPRINTS;
  const topItems: ProductItem[] = [];
  let accumulatedPoints = 0;

  for (const item of backlogItems) {
    if (accumulatedPoints > horizonPoints) {
      break;
    }

    accumulatedPoints += item.storyPoints ?? UNESTIMATED_ITEM_POINTS;
    topItems.push(item);
  }

  return {
    topItems,
    notReadyItems: topItems.filter((item) => !isReady(item)),
    horizonPoints,
  };
};

export const BACKLOG_HEALTH_FILTER_IDS = [
  'not-ready-top',
  'unscored',
  'no-goal',
  'no-why',
  'low-tier',
  'stale',
  'unestimated',
  'oversized',
  'blocked',
] as const;

export type BacklogHealthFilterId = (typeof BACKLOG_HEALTH_FILTER_IDS)[number];

export type BacklogHealthFilter = {
  id: BacklogHealthFilterId;
  label: string;
  test: (item: ProductItem) => boolean;
};

// Insights counts and the list filters by these same definitions.
export const buildBacklogHealthFilters = ({
  template,
  settings,
  topItemIds,
  isReady,
  hasUnresolvedBlockers,
  now,
}: {
  template: PrioritizationTemplate;
  settings: ProductBacklogSettings;
  topItemIds: ReadonlySet<string>;
  isReady: (item: ProductItem) => boolean;
  hasUnresolvedBlockers: (item: ProductItem) => boolean;
  now: Date;
}): Record<BacklogHealthFilterId, BacklogHealthFilter> => ({
  'not-ready-top': {
    id: 'not-ready-top',
    label: 'Top backlog not ready',
    test: (item) => topItemIds.has(item.id) && !isReady(item),
  },
  unscored: {
    id: 'unscored',
    label: `Not scored with ${template.name}`,
    test: (item) => scoreItem(item, template, settings).score === null,
  },
  'no-goal': {
    id: 'no-goal',
    label: 'No strategic goal',
    test: (item) => !isNonEmptyString(item.strategicGoalId),
  },
  'no-why': {
    id: 'no-why',
    label: 'Missing "why now"',
    test: (item) => !isNonEmptyString(item.whyNow?.trim()),
  },
  'low-tier': {
    id: 'low-tier',
    label: `Low priority tier (${template.name})`,
    test: (item) =>
      (scoreItem(item, template, settings).classification?.order ?? 0) >=
      LOW_PRIORITY_TIER_ORDER,
  },
  stale: {
    id: 'stale',
    label: `Untouched for over ${STALE_ITEM_MONTHS} months`,
    test: (item) => isItemStale(item, now, STALE_ITEM_MONTHS),
  },
  unestimated: {
    id: 'unestimated',
    label: 'Not estimated',
    test: (item) => readFiniteNumber(item.storyPoints) === null,
  },
  oversized: {
    id: 'oversized',
    label: `Larger than ${MAX_SPRINT_ITEM_POINTS} pt`,
    test: (item) => (item.storyPoints ?? 0) > MAX_SPRINT_ITEM_POINTS,
  },
  blocked: {
    id: 'blocked',
    label: 'Blocked by a dependency',
    test: hasUnresolvedBlockers,
  },
});
