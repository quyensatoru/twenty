import { isNonEmptyString } from '@sniptt/guards';

import {
  type AUTOMATIC_READINESS_CRITERION_IDS,
  MAX_SPRINT_ITEM_POINTS,
} from '../../constants/product-backlog';
import {
  type LinkedIssueSummary,
  type ProductBacklogSettings,
  type ProductItem,
} from '../../types/product-backlog';
import { readFiniteNumber } from './prioritization-template.util';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const EMERGENT_WINDOW_DAYS = 30;
const DETAILED_TOP_SHARE = 0.25;
const DETAILED_TOP_MINIMUM = 5;

type AutomaticReadinessCriterionId =
  (typeof AUTOMATIC_READINESS_CRITERION_IDS)[number];

type ReadinessLookup = {
  linkedIssuesById: ReadonlyMap<string, LinkedIssueSummary>;
  doneStatusIds: ReadonlySet<string>;
};

export type ReadinessCheck = {
  id: string;
  text: string;
  isMet: boolean;
  isAutomatic: boolean;
};

export type ItemReadiness = {
  checks: ReadinessCheck[];
  passedCount: number;
  totalCount: number;
  percent: number;
  isReady: boolean;
};

// Blockers the backlog does not load are ignored rather than counted as open.
export const listUnresolvedBlockers = ({
  item,
  linkedIssuesById,
  doneStatusIds,
}: ReadinessLookup & { item: ProductItem }): LinkedIssueSummary[] =>
  (item.blockedByIssueIds ?? [])
    .map((issueId) => linkedIssuesById.get(issueId))
    .filter(
      (blocker): blocker is LinkedIssueSummary =>
        blocker !== undefined &&
        blocker.stage !== 'ARCHIVED' &&
        !(
          isNonEmptyString(blocker.statusId) &&
          doneStatusIds.has(blocker.statusId)
        ),
    );

const hasUserStory = (item: ProductItem) =>
  isNonEmptyString(item.userStory?.iWant?.trim());

const hasAcceptanceCriteria = (item: ProductItem) =>
  (item.acceptanceCriteria?.length ?? 0) > 0;

const AUTOMATIC_READINESS_CHECKS: Record<
  AutomaticReadinessCriterionId,
  (item: ProductItem, lookup: ReadinessLookup) => boolean
> = {
  'user-story': hasUserStory,
  'acceptance-criteria': hasAcceptanceCriteria,
  estimated: (item) => readFiniteNumber(item.storyPoints) !== null,
  'small-enough': (item) => {
    const storyPoints = readFiniteNumber(item.storyPoints);

    return storyPoints !== null && storyPoints <= MAX_SPRINT_ITEM_POINTS;
  },
  unblocked: (item, lookup) =>
    listUnresolvedBlockers({ item, ...lookup }).length === 0,
};

const isAutomaticReadinessCriterionId = (
  id: string,
): id is AutomaticReadinessCriterionId => id in AUTOMATIC_READINESS_CHECKS;

export const readItemReadiness = ({
  item,
  settings,
  linkedIssuesById,
  doneStatusIds,
}: ReadinessLookup & {
  item: ProductItem;
  settings: ProductBacklogSettings;
}): ItemReadiness => {
  const checks = settings.readinessCriteria.map(({ id, text }) =>
    isAutomaticReadinessCriterionId(id)
      ? {
          id,
          text,
          isMet: AUTOMATIC_READINESS_CHECKS[id](item, {
            linkedIssuesById,
            doneStatusIds,
          }),
          isAutomatic: true,
        }
      : {
          id,
          text,
          isMet: item.readinessChecks?.[id] === true,
          isAutomatic: false,
        },
  );
  const passedCount = checks.filter((check) => check.isMet).length;

  return {
    checks,
    passedCount,
    totalCount: checks.length,
    percent:
      checks.length === 0
        ? 100
        : Math.round((passedCount / checks.length) * 100),
    isReady: passedCount === checks.length,
  };
};

export type BacklogDeepPartKey =
  | 'DETAILED'
  | 'ESTIMATED'
  | 'EMERGENT'
  | 'PRIORITIZED';

export type BacklogDeepPart = {
  key: BacklogDeepPartKey;
  name: string;
  // Share of items meeting the part, 0 to 1.
  value: number;
  hint: string;
};

export type BacklogDeep = {
  parts: BacklogDeepPart[];
  overall: number;
};

// DEEP (Roman Pichler) over the backlog as ranked.
export const computeBacklogDeep = ({
  orderedItems,
  isScored,
  now,
}: {
  orderedItems: readonly ProductItem[];
  isScored: (item: ProductItem) => boolean;
  now: Date;
}): BacklogDeep => {
  const itemCount = orderedItems.length || 1;
  const topItems = orderedItems.slice(
    0,
    Math.max(
      DETAILED_TOP_MINIMUM,
      Math.ceil(orderedItems.length * DETAILED_TOP_SHARE),
    ),
  );
  const emergentCutoff = now.getTime() - EMERGENT_WINDOW_DAYS * DAY_IN_MS;

  const detailed =
    topItems.filter((item) => hasUserStory(item) && hasAcceptanceCriteria(item))
      .length / (topItems.length || 1);
  const estimated =
    orderedItems.filter((item) => readFiniteNumber(item.storyPoints) !== null)
      .length / itemCount;
  const emergent =
    orderedItems.filter((item) => {
      const lastTouchedAt = item.refinedAt ?? item.updatedAt;

      return (
        isNonEmptyString(lastTouchedAt) &&
        new Date(lastTouchedAt).getTime() >= emergentCutoff
      );
    }).length / itemCount;
  const prioritized = orderedItems.filter(isScored).length / itemCount;

  const parts: BacklogDeepPart[] = [
    {
      key: 'DETAILED',
      name: 'Detailed appropriately',
      value: detailed,
      hint: 'Top 25% of the backlog has a user story and acceptance criteria',
    },
    {
      key: 'ESTIMATED',
      name: 'Estimated',
      value: estimated,
      hint: 'Items with story points',
    },
    {
      key: 'EMERGENT',
      name: 'Emergent',
      value: emergent,
      hint: 'Items created or refined in the last 30 days',
    },
    {
      key: 'PRIORITIZED',
      name: 'Prioritized',
      value: prioritized,
      hint: 'Items scored with the active template',
    },
  ];

  return {
    parts,
    overall:
      parts.reduce((total, part) => total + part.value, 0) / parts.length,
  };
};
