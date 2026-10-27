import { STORY_POINT_SCALE } from '../../constants/product-backlog';
import {
  buildNumberScaleOptions,
  formatToOneDecimal,
  type PrioritizationTemplate,
  readFiniteNumber,
  type ScoreFieldOption,
} from './prioritization-template.util';
import { computeIce } from './sae-ice-caf-template.util';

const FIBONACCI_OPTIONS: ScoreFieldOption[] = STORY_POINT_SCALE.map(
  (value) => ({ value, label: String(value) }),
);

export const ICE_TEMPLATE: PrioritizationTemplate = {
  id: 'ice',
  name: 'ICE',
  shortName: 'ICE',
  source: 'SAE Methodology (part 1)',
  description:
    'Impact × Confidence × Ease, each from 1 to 10. It is SAE ICE × CAF without the competitor factor.',
  formula: 'Score = I × C × E (1–1000)',
  fields: [
    {
      key: 'impact',
      label: 'Impact',
      kind: 'select',
      options: buildNumberScaleOptions(1, 10),
    },
    {
      key: 'confidence',
      label: 'Confidence',
      kind: 'select',
      options: buildNumberScaleOptions(1, 10),
    },
    {
      key: 'ease',
      label: 'Ease',
      kind: 'select',
      options: buildNumberScaleOptions(1, 10),
    },
  ],
  visual: 'bar',
  compute: (inputs) => computeIce(inputs),
};

export const RICE_TEMPLATE: PrioritizationTemplate = {
  id: 'rice',
  name: 'RICE',
  shortName: 'RICE',
  source: 'Intercom (popular framework)',
  description:
    'Reach × Impact × Confidence ÷ Effort: favours the work that reaches the most merchants per unit of effort.',
  formula: 'Score = Reach × Impact × Confidence% ÷ Effort',
  fields: [
    {
      key: 'reach',
      label: 'Reach',
      kind: 'number',
      min: 0,
      step: 10,
      hint: 'Merchants affected per quarter.',
      width: 80,
    },
    {
      key: 'impact',
      label: 'Impact',
      kind: 'select',
      options: [
        { value: 3, label: '3 · Massive' },
        { value: 2, label: '2 · High' },
        { value: 1, label: '1 · Medium' },
        { value: 0.5, label: '0.5 · Low' },
        { value: 0.25, label: '0.25 · Minimal' },
      ],
    },
    {
      key: 'confidence',
      label: 'Confidence',
      kind: 'select',
      options: [
        { value: 100, label: '100%' },
        { value: 80, label: '80%' },
        { value: 50, label: '50%' },
      ],
    },
    {
      key: 'effort',
      label: 'Effort',
      kind: 'number',
      min: 0.5,
      step: 0.5,
      hint: 'Person-months.',
      width: 70,
    },
  ],
  visual: 'bar',
  compute: (inputs) => {
    const reach = readFiniteNumber(inputs?.reach);
    const impact = readFiniteNumber(inputs?.impact);
    const confidence = readFiniteNumber(inputs?.confidence);
    const effort = readFiniteNumber(inputs?.effort);

    if (
      reach === null ||
      impact === null ||
      confidence === null ||
      effort === null ||
      effort <= 0
    ) {
      return null;
    }

    return (reach * impact * (confidence / 100)) / effort;
  },
  format: formatToOneDecimal,
};

export const WSJF_TEMPLATE: PrioritizationTemplate = {
  id: 'wsjf',
  name: 'WSJF',
  shortName: 'WSJF',
  source: 'Backlog Prioritization Techniques (slides 9–14)',
  description:
    'Weighted Shortest Job First: Cost of Delay divided by Job Size. Score one column at a time, relatively (the least important item = 1). Job Size is complexity, not duration; risk is added to Job Size.',
  formula:
    'CoD = Business Value + Time Criticality + RROE · WSJF = CoD ÷ (Job Size + Risk)',
  fields: [
    {
      key: 'businessValue',
      label: 'Business Value',
      kind: 'select',
      options: FIBONACCI_OPTIONS,
      hint: 'Revenue growth, business strategy, cost savings, customer satisfaction.',
    },
    {
      key: 'timeCriticality',
      label: 'Time Criticality',
      kind: 'select',
      options: FIBONACCI_OPTIONS,
      hint: 'Financial targets, events, integrations, system retirement…',
    },
    {
      key: 'riskReduction',
      label: 'RROE',
      kind: 'select',
      options: FIBONACCI_OPTIONS,
      hint: 'Risk Reduction / Opportunity Enablement: market penetration, quality, scalability, partnerships.',
    },
    {
      key: 'jobSize',
      label: 'Job Size',
      kind: 'select',
      options: FIBONACCI_OPTIONS,
      hint: 'Relative complexity, estimated by the team together.',
    },
    {
      key: 'risk',
      label: '+Risk',
      kind: 'select',
      options: [0, 1, 2, 3, 5].map((value) => ({
        value,
        label: `+${value}`,
      })),
      hint: 'Risk points added to Job Size.',
    },
  ],
  visual: 'bar',
  compute: (inputs) => {
    const businessValue = readFiniteNumber(inputs?.businessValue);
    const timeCriticality = readFiniteNumber(inputs?.timeCriticality);
    const riskReduction = readFiniteNumber(inputs?.riskReduction);
    const jobSize = readFiniteNumber(inputs?.jobSize);

    if (
      businessValue === null ||
      timeCriticality === null ||
      riskReduction === null ||
      jobSize === null
    ) {
      return null;
    }

    const size = jobSize + (readFiniteNumber(inputs?.risk) ?? 0);

    return size > 0
      ? (businessValue + timeCriticality + riskReduction) / size
      : null;
  },
  format: (score) => score.toFixed(2),
};
