import {
  type ProductBacklogSettings,
  type ProductItem,
} from '../../types/product-backlog';
import {
  FORCE_RANK_TEMPLATE,
  KANO_TEMPLATE,
  MOSCOW_TEMPLATE,
  RISK_VALUE_TEMPLATE,
  VALUE_EFFORT_TEMPLATE,
} from './categorical-templates.util';
import {
  ICE_TEMPLATE,
  RICE_TEMPLATE,
  WSJF_TEMPLATE,
} from './formula-templates.util';
import {
  type PrioritizationTemplate,
  type ScoreClassification,
} from './prioritization-template.util';
import { SAE_ICE_CAF_TEMPLATE } from './sae-ice-caf-template.util';

export const PRIORITIZATION_TEMPLATES: PrioritizationTemplate[] = [
  SAE_ICE_CAF_TEMPLATE,
  ICE_TEMPLATE,
  RICE_TEMPLATE,
  WSJF_TEMPLATE,
  MOSCOW_TEMPLATE,
  RISK_VALUE_TEMPLATE,
  VALUE_EFFORT_TEMPLATE,
  KANO_TEMPLATE,
  FORCE_RANK_TEMPLATE,
];

export const findPrioritizationTemplate = (
  id: string | null | undefined,
): PrioritizationTemplate =>
  PRIORITIZATION_TEMPLATES.find((template) => template.id === id) ??
  SAE_ICE_CAF_TEMPLATE;

export type ScoredProductItem = {
  item: ProductItem;
  score: number | null;
  classification: ScoreClassification | null;
};

export const scoreItem = (
  item: ProductItem,
  template: PrioritizationTemplate,
  settings: ProductBacklogSettings,
): ScoredProductItem => {
  const inputs = item.priorityScores?.[template.id];
  const score = template.compute(inputs, { settings });

  return {
    item,
    score,
    classification: template.classify?.(score, inputs, { settings }) ?? null,
  };
};

// Highest score first; unscored items go last, keeping their backlog order.
export const rankItemsByTemplate = (
  items: readonly ProductItem[],
  template: PrioritizationTemplate,
  settings: ProductBacklogSettings,
): ScoredProductItem[] =>
  items
    .map((item) => scoreItem(item, template, settings))
    .sort((first, second) => {
      const positionDifference =
        (first.item.position ?? 0) - (second.item.position ?? 0);

      if (first.score === null && second.score === null) {
        return positionDifference;
      }

      if (first.score === null) {
        return 1;
      }

      if (second.score === null) {
        return -1;
      }

      return second.score - first.score || positionDifference;
    });

export const formatTemplateScore = (
  template: PrioritizationTemplate,
  score: number | null,
): string => {
  if (score === null) {
    return '—';
  }

  return template.format
    ? template.format(score)
    : String(Math.round(score * 100) / 100);
};
