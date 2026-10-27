import { describe, expect, it } from 'vitest';

import { DEFAULT_PRODUCT_BACKLOG_SETTINGS } from '../../constants/product-backlog';
import {
  type LinkedIssueSummary,
  type ProductItem,
} from '../../types/product-backlog';
import {
  listUnresolvedBlockers,
  readItemReadiness,
} from '../product-backlog/item-readiness.util';

const linkedIssuesById = new Map<string, LinkedIssueSummary>([
  ['open', { id: 'open', statusId: 'in-progress', stage: 'ISSUE' }],
  ['done', { id: 'done', statusId: 'done-status', stage: 'ISSUE' }],
  ['archived', { id: 'archived', statusId: 'todo', stage: 'ARCHIVED' }],
]);
const doneStatusIds = new Set(['done-status']);

const readyItem: ProductItem = {
  id: 'item',
  storyPoints: 5,
  userStory: { asA: 'merchant', iWant: 'to export', soThat: 'I can report' },
  acceptanceCriteria: [{ id: 'ac', text: 'Exports CSV', isDone: false }],
  blockedByIssueIds: ['done', 'archived', 'unknown'],
  readinessChecks: { 'design-ready': true, 'why-explained': true },
};

describe('listUnresolvedBlockers', () => {
  it('ignores done, archived and unknown blockers', () => {
    expect(
      listUnresolvedBlockers({
        item: {
          id: 'item',
          blockedByIssueIds: ['open', 'done', 'archived', 'x'],
        },
        linkedIssuesById,
        doneStatusIds,
      }).map((blocker) => blocker.id),
    ).toEqual(['open']);
  });
});

describe('readItemReadiness', () => {
  it('is ready when every automatic and manual check passes', () => {
    const readiness = readItemReadiness({
      item: readyItem,
      settings: DEFAULT_PRODUCT_BACKLOG_SETTINGS,
      linkedIssuesById,
      doneStatusIds,
    });

    expect(readiness).toMatchObject({
      passedCount: 7,
      totalCount: 7,
      percent: 100,
      isReady: true,
    });
  });

  it('derives the automatic checks from the item', () => {
    const readiness = readItemReadiness({
      item: {
        id: 'item',
        storyPoints: 13,
        userStory: { asA: '', iWant: '  ', soThat: '' },
        blockedByIssueIds: ['open'],
      },
      settings: DEFAULT_PRODUCT_BACKLOG_SETTINGS,
      linkedIssuesById,
      doneStatusIds,
    });
    const isMetById = Object.fromEntries(
      readiness.checks.map((check) => [check.id, check.isMet]),
    );

    expect(isMetById).toEqual({
      'user-story': false,
      'acceptance-criteria': false,
      estimated: true,
      'small-enough': false,
      unblocked: false,
      'design-ready': false,
      'why-explained': false,
    });
    expect(
      readiness.checks
        .filter((check) => check.isAutomatic)
        .map((check) => check.id),
    ).toEqual([
      'user-story',
      'acceptance-criteria',
      'estimated',
      'small-enough',
      'unblocked',
    ]);
    expect(readiness.percent).toBe(14);
    expect(readiness.isReady).toBe(false);
  });
});
