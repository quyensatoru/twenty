import { isObject } from '@sniptt/guards';

import {
  type CompetitorAdoption,
  type ProductBacklogSettings,
  type ScoreInputs,
} from '../../types/product-backlog';
import {
  buildNumberScaleOptions,
  formatToOneDecimal,
  type PrioritizationTemplate,
  readFiniteNumber,
  type ScoreClassification,
} from './prioritization-template.util';

export const COMPETITOR_ADOPTION_LABELS: Record<CompetitorAdoption, string> = {
  NO: 'No',
  BASIC: 'Basic / Limited',
  GOOD: 'Good / Yes',
  ADVANCED: 'Advanced',
};

const isCompetitorAdoption = (value: unknown): value is CompetitorAdoption =>
  typeof value === 'string' && value in COMPETITOR_ADOPTION_LABELS;

export const readCompetitorAdoptions = (
  inputs: ScoreInputs | undefined,
): Record<string, CompetitorAdoption> => {
  const adoption = inputs?.adoption;

  if (!isObject(adoption)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(adoption).filter(
      (entry): entry is [string, CompetitorAdoption] =>
        isCompetitorAdoption(entry[1]),
    ),
  );
};

export const computeIce = (inputs: ScoreInputs | undefined): number | null => {
  const impact = readFiniteNumber(inputs?.impact);
  const confidence = readFiniteNumber(inputs?.confidence);
  const ease = readFiniteNumber(inputs?.ease);

  if (impact === null || confidence === null || ease === null) {
    return null;
  }

  return impact * confidence * ease;
};

// CAF = Σ(adoption score × weight) / Σ weight, over the competitors that have
// an adoption set; none set gives 0, so the final score falls back to ICE.
export const computeCompetitorAdoptionFactor = (
  inputs: ScoreInputs | undefined,
  settings: ProductBacklogSettings,
): number => {
  const adoptions = readCompetitorAdoptions(inputs);
  let weightedSum = 0;
  let weightSum = 0;

  for (const competitor of settings.competitors) {
    const adoption = adoptions[competitor.id];

    if (adoption === undefined) {
      continue;
    }

    const weight = settings.competitorWeights[competitor.type];

    weightedSum += settings.adoptionScores[adoption] * weight;
    weightSum += weight;
  }

  return weightSum === 0 ? 0 : weightedSum / weightSum;
};

export const readImplementationPhase = (
  score: number,
  settings: ProductBacklogSettings,
): ScoreClassification => {
  const { phaseOne, phaseTwo, phaseThree } = settings.phaseThresholds;

  if (score > phaseOne) {
    return { label: 'Phase 1 · High', color: 'green', order: 1 };
  }

  if (score >= phaseTwo) {
    return { label: 'Phase 2 · Medium', color: 'blue', order: 2 };
  }

  if (score >= phaseThree) {
    return { label: 'Phase 3 · Low', color: 'yellow', order: 3 };
  }

  return { label: 'Phase 4 · Niche', color: 'gray', order: 4 };
};

export const PHASE_MEANING: Record<number, string> = {
  1: 'Build immediately – high impact & adoption.',
  2: 'Core expectations – implement next quarter.',
  3: 'Nice-to-have – plan if resources available.',
  4: 'Niche/advanced – keep in backlog until demand arises.',
};

export const SAE_ICE_CAF_TEMPLATE: PrioritizationTemplate = {
  id: 'sae-ice-caf',
  name: 'SAE ICE × CAF',
  shortName: 'ICE×CAF',
  source: 'SAE - Backlog - MIDA Heatmap - Methodology',
  description:
    'Hybrid scoring: ICE (value for merchants) combined with the Competitor Adoption Factor (market pressure), to both differentiate and reach competitive parity.',
  formula:
    'ICE = I × C × E · CAF = Σ(adoption × weight) / Σ weight · Final = ICE × (1 + CAF)',
  fields: [
    {
      key: 'impact',
      label: 'Impact',
      kind: 'select',
      options: buildNumberScaleOptions(1, 10),
      hint: 'Value for merchants (conversion, retention, satisfaction).',
    },
    {
      key: 'confidence',
      label: 'Confidence',
      kind: 'select',
      options: buildNumberScaleOptions(1, 10),
      hint: 'How sure we are about the impact (competitor adoption, customer feedback, internal validation).',
    },
    {
      key: 'ease',
      label: 'Ease',
      kind: 'select',
      options: buildNumberScaleOptions(1, 10),
      hint: 'How easy it is to build (technical complexity, resources).',
    },
  ],
  special: 'competitors',
  visual: 'phase',
  compute: (inputs, { settings }) => {
    const ice = computeIce(inputs);

    if (ice === null) {
      return null;
    }

    return ice * (1 + computeCompetitorAdoptionFactor(inputs, settings));
  },
  classify: (score, _inputs, { settings }) =>
    score === null ? null : readImplementationPhase(score, settings),
  format: formatToOneDecimal,
};
