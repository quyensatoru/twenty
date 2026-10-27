import {
  type ProductBacklogSettings,
  type ScoreInputs,
} from '../../types/product-backlog';

export type ScoreClassificationColor =
  | 'gray'
  | 'sky'
  | 'blue'
  | 'purple'
  | 'turquoise'
  | 'green'
  | 'yellow'
  | 'orange'
  | 'red'
  | 'pink';

export type ScoreClassification = {
  label: string;
  color: ScoreClassificationColor;
  // Groups and sorts buckets: 1 is the most urgent.
  order: number;
};

export type ScoreFieldOption = {
  value: string | number;
  label: string;
};

export type ScoreFieldDefinition = {
  key: string;
  label: string;
  kind: 'number' | 'select';
  min?: number;
  max?: number;
  step?: number;
  options?: ScoreFieldOption[];
  hint?: string;
  width?: number;
};

export type PrioritizationTemplateContext = {
  settings: ProductBacklogSettings;
};

export type PrioritizationTemplate = {
  id: string;
  name: string;
  shortName: string;
  source: string;
  description: string;
  formula: string;
  fields: ScoreFieldDefinition[];
  // An editor beyond the plain fields: competitor adoption, stakeholder
  // votes or pairwise comparison.
  special?: 'competitors' | 'votes' | 'pairwise';
  visual: 'phase' | 'matrix' | 'votes' | 'kano' | 'rank' | 'bar';
  compute: (
    inputs: ScoreInputs | undefined,
    context: PrioritizationTemplateContext,
  ) => number | null;
  classify?: (
    score: number | null,
    inputs: ScoreInputs | undefined,
    context: PrioritizationTemplateContext,
  ) => ScoreClassification | null;
  format?: (score: number) => string;
};

export const readFiniteNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

export const buildNumberScaleOptions = (
  min: number,
  max: number,
): ScoreFieldOption[] =>
  Array.from({ length: max - min + 1 }, (_, index) => ({
    value: min + index,
    label: String(min + index),
  }));

export const formatToOneDecimal = (score: number): string =>
  (Math.round(score * 10) / 10).toLocaleString('en-US');
