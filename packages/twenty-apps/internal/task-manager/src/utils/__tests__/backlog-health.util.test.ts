import { describe, expect, it } from 'vitest';

import { DEFAULT_PRODUCT_BACKLOG_SETTINGS } from '../../constants/product-backlog';
import { type ProductItem } from '../../types/product-backlog';
import {
  buildBacklogHealthFilters,
  selectRefinementHorizon,
} from '../product-backlog/backlog-health.util';
import { findPrioritizationTemplate } from '../product-backlog/prioritization-templates.util';

describe('selectRefinementHorizon', () => {
  const backlogItems: ProductItem[] = [
    { id: 'a', storyPoints: 8 },
    { id: 'b' },
    { id: 'c', storyPoints: 5 },
    { id: 'd', storyPoints: 2 },
  ];

  it('stops once the items fill three sprints of velocity', () => {
    const horizon = selectRefinementHorizon({
      backlogItems,
      velocity: 3,
      isReady: (item) => item.id !== 'b',
    });

    // 8 + 3 (unestimated) = 11 > 9, so c and d fall outside.
    expect(horizon.horizonPoints).toBe(9);
    expect(horizon.topItems.map((item) => item.id)).toEqual(['a', 'b']);
    expect(horizon.notReadyItems.map((item) => item.id)).toEqual(['b']);
  });

  it('assumes 30 points per sprint without a velocity', () => {
    expect(
      selectRefinementHorizon({
        backlogItems,
        velocity: 0,
        isReady: () => true,
      }).horizonPoints,
    ).toBe(90);
  });
});

describe('buildBacklogHealthFilters', () => {
  it('flags items by the same definitions Insights counts', () => {
    const filters = buildBacklogHealthFilters({
      template: findPrioritizationTemplate('ice'),
      settings: DEFAULT_PRODUCT_BACKLOG_SETTINGS,
      topItemIds: new Set(['item']),
      isReady: () => false,
      hasUnresolvedBlockers: () => true,
      now: new Date('2026-10-26T00:00:00.000Z'),
    });
    const item: ProductItem = {
      id: 'item',
      storyPoints: 13,
      whyNow: ' ',
      updatedAt: '2026-01-01T00:00:00.000Z',
      priorityScores: { ice: { impact: 1, confidence: 1, ease: 1 } },
    };

    expect(filters.unscored.label).toBe('Not scored with ICE');
    expect(
      Object.values(filters)
        .filter((filter) => filter.test(item))
        .map((filter) => filter.id),
    ).toEqual([
      'not-ready-top',
      'no-goal',
      'no-why',
      'stale',
      'oversized',
      'blocked',
    ]);
  });
});
