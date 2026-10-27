import { useMemo } from 'react';
import { t } from 'twenty-sdk/front-component';

import {
  MAX_SPRINT_ITEM_POINTS,
  STALE_ITEM_MONTHS,
} from '../../../constants/product-backlog';
import { type ProductBacklogData } from '../../../types/product-backlog';
import {
  type BacklogHealthFilter,
  type BacklogHealthFilterId,
  buildBacklogHealthFilters,
  type RefinementHorizon,
  selectRefinementHorizon,
} from '../../../utils/product-backlog/backlog-health.util';
import { type ProductBacklogModel } from './use-product-backlog-model';

export const readHealthFilterLabel = (
  filterId: BacklogHealthFilterId,
  templateName: string,
): string => {
  switch (filterId) {
    case 'not-ready-top':
      return t('Top backlog not ready');
    case 'unscored':
      return t('Not scored with {template}', { template: templateName });
    case 'no-goal':
      return t('No strategic goal');
    case 'no-why':
      return t('Missing "why now"');
    case 'low-tier':
      return t('Low priority tier ({template})', { template: templateName });
    case 'stale':
      return t('Untouched for over {months} months', {
        months: STALE_ITEM_MONTHS,
      });
    case 'unestimated':
      return t('Not estimated');
    case 'oversized':
      return t('Larger than {points} pt', { points: MAX_SPRINT_ITEM_POINTS });
    case 'blocked':
      return t('Blocked by a dependency');
  }
};

// The refinement horizon and the "needs attention" groups: Insights counts
// them, the list filters by them, so both read one definition.
export const useBacklogHealth = (
  data: ProductBacklogData,
  model: ProductBacklogModel,
): {
  horizon: RefinementHorizon;
  filters: Record<BacklogHealthFilterId, BacklogHealthFilter>;
} =>
  useMemo(() => {
    const isReady = (item: Parameters<typeof model.readinessOf>[0]) =>
      model.readinessOf(item).isReady;
    const horizon = selectRefinementHorizon({
      backlogItems: model.backlogItems,
      velocity: model.averageVelocityPoints,
      isReady,
    });

    return {
      horizon,
      filters: buildBacklogHealthFilters({
        template: model.template,
        settings: data.settings,
        topItemIds: new Set(horizon.topItems.map((item) => item.id)),
        isReady,
        hasUnresolvedBlockers: (item) => model.blockersOf(item).length > 0,
        now: new Date(),
      }),
    };
  }, [data, model]);
