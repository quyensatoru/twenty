import { isObject } from '@sniptt/guards';

import {
  type MoscowBucket,
  type ProductBacklogSettings,
  type ScoreInputs,
} from '../../types/product-backlog';
import {
  buildNumberScaleOptions,
  type PrioritizationTemplate,
  readFiniteNumber,
  type ScoreClassification,
} from './prioritization-template.util';

// MoSCoW

export const MOSCOW_BUCKETS: Record<MoscowBucket, ScoreClassification> = {
  M: { label: 'Must have', color: 'green', order: 1 },
  S: { label: 'Should have', color: 'blue', order: 2 },
  C: { label: 'Could have', color: 'yellow', order: 3 },
  W: { label: "Won't have", color: 'gray', order: 4 },
};

const MOSCOW_BUCKET_KEYS: MoscowBucket[] = ['M', 'S', 'C', 'W'];

const isMoscowBucket = (value: unknown): value is MoscowBucket =>
  typeof value === 'string' && value in MOSCOW_BUCKETS;

export const readMoscowVotes = (
  inputs: ScoreInputs | undefined,
): Record<string, MoscowBucket> => {
  const votes = inputs?.votes;

  if (!isObject(votes)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(votes).filter((entry): entry is [string, MoscowBucket] =>
      isMoscowBucket(entry[1]),
    ),
  );
};

const readMoscowLabel = (
  inputs: ScoreInputs | undefined,
): MoscowBucket | null => (isMoscowBucket(inputs?.label) ? inputs.label : null);

// Stakeholder votes win over the agreed label when both are set.
export const moscowTotal = (
  inputs: ScoreInputs | undefined,
  settings: ProductBacklogSettings,
): number | null => {
  const votes = Object.values(readMoscowVotes(inputs));

  if (votes.length > 0) {
    return votes.reduce(
      (total, vote) => total + settings.moscowPoints[vote],
      0,
    );
  }

  const label = readMoscowLabel(inputs);

  return label === null ? null : settings.moscowPoints[label];
};

export const MOSCOW_TEMPLATE: PrioritizationTemplate = {
  id: 'moscow',
  name: 'MoSCoW',
  shortName: 'MoSCoW',
  source: 'Backlog Prioritization Techniques (slides 3–4)',
  description:
    "Must / Should / Could / Won't instead of High / Medium / Low. Option 1: agree on one label. Option 2: each stakeholder votes and the points add up (M=10, S=7, C=3, W=0). Must (+ Should) = MVP.",
  formula: "Total = Σ stakeholders' vote points (or the agreed label's points)",
  fields: [
    {
      key: 'label',
      label: 'Agreed label',
      kind: 'select',
      options: MOSCOW_BUCKET_KEYS.map((bucket) => ({
        value: bucket,
        label: `${bucket} · ${MOSCOW_BUCKETS[bucket].label}`,
      })),
    },
  ],
  special: 'votes',
  visual: 'votes',
  compute: (inputs, { settings }) => moscowTotal(inputs, settings),
  classify: (_score, inputs, { settings }) => {
    const label = readMoscowLabel(inputs);

    if (label !== null) {
      return MOSCOW_BUCKETS[label];
    }

    const votes = Object.values(readMoscowVotes(inputs));

    if (votes.length === 0) {
      return null;
    }

    const points = settings.moscowPoints;
    const average =
      votes.reduce((total, vote) => total + points[vote], 0) / votes.length;
    const bucket: MoscowBucket =
      average >= (points.M + points.S) / 2
        ? 'M'
        : average >= (points.S + points.C) / 2
          ? 'S'
          : average >= (points.C + points.W) / 2
            ? 'C'
            : 'W';

    return MOSCOW_BUCKETS[bucket];
  },
};

export type MoscowVoteAnalysis = {
  ties: { total: number; ids: string[] }[];
  // Stakeholders who put every item they voted on in the same bucket.
  flatVoterIds: string[];
};

export const analyzeMoscowVotes = (
  items: readonly { id: string; inputs: ScoreInputs | undefined }[],
  settings: ProductBacklogSettings,
): MoscowVoteAnalysis => {
  const idsByTotal = new Map<number, string[]>();
  const bucketsByVoterId = new Map<string, Set<MoscowBucket>>();

  for (const item of items) {
    const votes = readMoscowVotes(item.inputs);

    if (Object.keys(votes).length === 0) {
      continue;
    }

    const total = moscowTotal(item.inputs, settings) ?? 0;

    idsByTotal.set(total, [...(idsByTotal.get(total) ?? []), item.id]);

    for (const [voterId, vote] of Object.entries(votes)) {
      bucketsByVoterId.set(
        voterId,
        (bucketsByVoterId.get(voterId) ?? new Set()).add(vote),
      );
    }
  }

  return {
    ties: [...idsByTotal.entries()]
      .filter(([, ids]) => ids.length > 1)
      .map(([total, ids]) => ({ total, ids })),
    flatVoterIds: [...bucketsByVoterId.entries()]
      .filter(([, buckets]) => buckets.size === 1)
      .map(([voterId]) => voterId),
  };
};

// Risk / Value (Mike Cohn)

export type RiskValueQuadrant = ScoreClassification & {
  suggestedMoscow: string;
};

export const readRiskValueQuadrant = (
  value: number,
  risk: number,
): RiskValueQuadrant => {
  const isHighValue = value > 5;
  const isHighRisk = risk > 5;

  if (isHighRisk && isHighValue) {
    return {
      order: 1,
      label: '1 · High risk / High value',
      color: 'green',
      suggestedMoscow: 'Must-Have',
    };
  }

  if (!isHighRisk && isHighValue) {
    return {
      order: 2,
      label: '2 · Low risk / High value',
      color: 'turquoise',
      suggestedMoscow: 'Must / Should',
    };
  }

  if (!isHighRisk && !isHighValue) {
    return {
      order: 3,
      label: '3 · Low risk / Low value',
      color: 'yellow',
      suggestedMoscow: 'Should / Could',
    };
  }

  return {
    order: 4,
    label: '? · High risk / Low value',
    color: 'red',
    suggestedMoscow: "Won't-Have",
  };
};

export const RISK_TYPE_OPTIONS = [
  { value: 'SCHEDULE', label: 'Schedule — may miss the deadline' },
  { value: 'COST', label: 'Cost — may cost more than planned' },
  { value: 'BUSINESS', label: 'Functionality — the workflow may be wrong' },
  {
    value: 'TECHNICAL',
    label: 'Technical — may not reach the expected performance',
  },
];

export const RISK_VALUE_TEMPLATE: PrioritizationTemplate = {
  id: 'risk-value',
  name: 'Risk / Value',
  shortName: 'Risk/Value',
  source: 'Backlog Prioritization Techniques (slides 7–8)',
  description:
    'Score Value and Risk. In Scrum, do High risk / High value first; Low risk / High value are quick wins; High risk / Low value stays out of the MVP.',
  formula: 'Quadrant (threshold > 5): 1 HR/HV → 2 LR/HV → 3 LR/LV → ? HR/LV',
  fields: [
    {
      key: 'value',
      label: 'Value',
      kind: 'select',
      options: buildNumberScaleOptions(1, 10),
    },
    {
      key: 'risk',
      label: 'Risk',
      kind: 'select',
      options: buildNumberScaleOptions(1, 10),
    },
    {
      key: 'riskType',
      label: 'Risk type',
      kind: 'select',
      options: RISK_TYPE_OPTIONS,
    },
  ],
  visual: 'matrix',
  compute: (inputs) => {
    const value = readFiniteNumber(inputs?.value);
    const risk = readFiniteNumber(inputs?.risk);

    if (value === null || risk === null) {
      return null;
    }

    const quadrant = readRiskValueQuadrant(value, risk);

    // The quadrant dominates; within it, higher value first, then higher risk
    // in quadrant 1 and lower risk elsewhere.
    return (
      (5 - quadrant.order) * 100 +
      value * 10 +
      (quadrant.order === 1 ? risk : 10 - risk)
    );
  },
  classify: (_score, inputs) => {
    const value = readFiniteNumber(inputs?.value);
    const risk = readFiniteNumber(inputs?.risk);

    if (value === null || risk === null) {
      return null;
    }

    const { label, color, order } = readRiskValueQuadrant(value, risk);

    return { label, color, order };
  },
  format: () => '',
};

// Value vs Effort

export const readValueEffortQuadrant = (
  value: number,
  effort: number,
): ScoreClassification => {
  const isHighValue = value > 5;
  const isHighEffort = effort > 5;

  if (isHighValue && !isHighEffort) {
    return { label: 'Quick win', color: 'green', order: 1 };
  }

  if (isHighValue && isHighEffort) {
    return { label: 'Big bet', color: 'blue', order: 2 };
  }

  if (!isHighValue && !isHighEffort) {
    return { label: 'Fill-in', color: 'yellow', order: 3 };
  }

  return { label: 'Time sink', color: 'red', order: 4 };
};

export const VALUE_EFFORT_TEMPLATE: PrioritizationTemplate = {
  id: 'value-effort',
  name: 'Value vs Effort',
  shortName: 'Value/Effort',
  source: 'Popular 2×2 framework',
  description:
    '2×2 matrix: Quick wins (high value, low effort) → Big bets → Fill-ins → Time sinks.',
  formula: 'Score = Value ÷ Effort · Quadrant threshold > 5',
  fields: [
    {
      key: 'value',
      label: 'Value',
      kind: 'select',
      options: buildNumberScaleOptions(1, 10),
    },
    {
      key: 'effort',
      label: 'Effort',
      kind: 'select',
      options: buildNumberScaleOptions(1, 10),
    },
  ],
  visual: 'matrix',
  compute: (inputs) => {
    const value = readFiniteNumber(inputs?.value);
    const effort = readFiniteNumber(inputs?.effort);

    return value === null || effort === null ? null : value / effort;
  },
  classify: (_score, inputs) => {
    const value = readFiniteNumber(inputs?.value);
    const effort = readFiniteNumber(inputs?.effort);

    return value === null || effort === null
      ? null
      : readValueEffortQuadrant(value, effort);
  },
  format: (score) => score.toFixed(2),
};

// Kano

export type KanoAnswer = 'LIKE' | 'EXPECT' | 'NEUTRAL' | 'TOLERATE' | 'DISLIKE';

export type KanoCategory =
  | 'MUST'
  | 'PERFORMANCE'
  | 'ATTRACTIVE'
  | 'INDIFFERENT'
  | 'REVERSE'
  | 'QUESTIONABLE';

export type KanoCategoryDefinition = ScoreClassification & {
  description: string;
  weight: number;
};

export const KANO_CATEGORIES: Record<KanoCategory, KanoCategoryDefinition> = {
  MUST: {
    label: 'Must-be',
    color: 'red',
    order: 1,
    weight: 4,
    description:
      'Merchants are unhappy without it, and no happier when it is there.',
  },
  PERFORMANCE: {
    label: 'Performance',
    color: 'blue',
    order: 2,
    weight: 3,
    description: 'The better it is, the more satisfied merchants are.',
  },
  ATTRACTIVE: {
    label: 'Attractive',
    color: 'green',
    order: 3,
    weight: 2,
    description: 'A delighter: unexpected, and sets us apart.',
  },
  INDIFFERENT: {
    label: 'Indifferent',
    color: 'gray',
    order: 4,
    weight: 1,
    description: 'Merchants do not care.',
  },
  REVERSE: {
    label: 'Reverse',
    color: 'purple',
    order: 5,
    weight: 0,
    description: 'Having the feature annoys merchants.',
  },
  QUESTIONABLE: {
    label: 'Questionable',
    color: 'gray',
    order: 6,
    weight: 0,
    description: 'The answers contradict each other: ask again.',
  },
};

const KANO_ANSWERS: KanoAnswer[] = [
  'LIKE',
  'EXPECT',
  'NEUTRAL',
  'TOLERATE',
  'DISLIKE',
];

// The standard Kano evaluation table: rows are the functional answer,
// columns the dysfunctional one, both in KANO_ANSWERS order.
const KANO_TABLE: KanoCategory[][] = [
  ['QUESTIONABLE', 'ATTRACTIVE', 'ATTRACTIVE', 'ATTRACTIVE', 'PERFORMANCE'],
  ['REVERSE', 'INDIFFERENT', 'INDIFFERENT', 'INDIFFERENT', 'MUST'],
  ['REVERSE', 'INDIFFERENT', 'INDIFFERENT', 'INDIFFERENT', 'MUST'],
  ['REVERSE', 'INDIFFERENT', 'INDIFFERENT', 'INDIFFERENT', 'MUST'],
  ['REVERSE', 'REVERSE', 'REVERSE', 'REVERSE', 'QUESTIONABLE'],
];

const readKanoAnswerIndex = (value: unknown): number =>
  typeof value === 'string' ? KANO_ANSWERS.indexOf(value as KanoAnswer) : -1;

const isKanoCategory = (value: unknown): value is KanoCategory =>
  typeof value === 'string' && value in KANO_CATEGORIES;

export const readKanoCategory = (
  inputs: ScoreInputs | undefined,
): KanoCategory | null => {
  const functionalIndex = readKanoAnswerIndex(inputs?.functional);
  const dysfunctionalIndex = readKanoAnswerIndex(inputs?.dysfunctional);

  if (functionalIndex >= 0 && dysfunctionalIndex >= 0) {
    return KANO_TABLE[functionalIndex][dysfunctionalIndex];
  }

  return isKanoCategory(inputs?.category) ? inputs.category : null;
};

const KANO_ANSWER_OPTIONS: { value: KanoAnswer; label: string }[] = [
  { value: 'LIKE', label: 'I like it' },
  { value: 'EXPECT', label: 'I expect it' },
  { value: 'NEUTRAL', label: 'I am neutral' },
  { value: 'TOLERATE', label: 'I can tolerate it' },
  { value: 'DISLIKE', label: 'I dislike it' },
];

const MANUAL_KANO_CATEGORIES: KanoCategory[] = [
  'MUST',
  'PERFORMANCE',
  'ATTRACTIVE',
  'INDIFFERENT',
  'REVERSE',
];

export const KANO_TEMPLATE: PrioritizationTemplate = {
  id: 'kano',
  name: 'Kano',
  shortName: 'Kano',
  source: 'Kano model',
  description:
    'Classifies by merchant satisfaction. Ask two questions: "How do you feel if you have this feature?" (functional) and "…if you do not?" (dysfunctional), then look up the Kano table. Or pick the category directly.',
  formula: 'Priority: Must-be → Performance → Attractive → Indifferent',
  fields: [
    {
      key: 'functional',
      label: 'If present',
      kind: 'select',
      options: KANO_ANSWER_OPTIONS,
    },
    {
      key: 'dysfunctional',
      label: 'If absent',
      kind: 'select',
      options: KANO_ANSWER_OPTIONS,
    },
    {
      key: 'category',
      label: 'Category (manual)',
      kind: 'select',
      options: MANUAL_KANO_CATEGORIES.map((category) => ({
        value: category,
        label: KANO_CATEGORIES[category].label,
      })),
    },
  ],
  visual: 'kano',
  compute: (inputs) => {
    const category = readKanoCategory(inputs);

    return category === null ? null : KANO_CATEGORIES[category].weight;
  },
  classify: (_score, inputs) => {
    const category = readKanoCategory(inputs);

    if (category === null) {
      return null;
    }

    const { label, color, order } = KANO_CATEGORIES[category];

    return { label, color, order };
  },
  format: () => '',
};

// 20/20 force rank

// Turns rank 1..n into a score where a better rank is higher.
const FORCE_RANK_SCORE_BASE = 10000;

export const FORCE_RANK_TEMPLATE: PrioritizationTemplate = {
  id: 'force-rank',
  name: '20/20 Force-rank',
  shortName: '20/20',
  source: 'Backlog Prioritization Techniques (slides 5–6)',
  description:
    'Compare items in pairs, like an eye exam ("A or B, which is clearer?"). Always start from the top of the list and compare only two items at a time; a facilitator helps negotiate.',
  formula: 'Insertion sort by pairwise comparison → rank 1..n',
  fields: [],
  special: 'pairwise',
  visual: 'rank',
  compute: (inputs) => {
    const rank = readFiniteNumber(inputs?.rank);

    return rank === null ? null : FORCE_RANK_SCORE_BASE - rank;
  },
  format: (score) => `#${FORCE_RANK_SCORE_BASE - score}`,
};
