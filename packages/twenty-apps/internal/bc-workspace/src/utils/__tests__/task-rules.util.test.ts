import { describe, expect, it } from 'vitest';

import {
  applyStatusTransition,
  normalizeTaskDraft,
  readCompletionLabel,
  validateTaskDraft,
} from '../task-rules.util';

const draft = {
  title: 'Quarterly planning',
  notes: '',
  category: 'OTHER' as const,
  customCategory: '',
  priority: 'MEDIUM' as const,
  status: 'TODO' as const,
  outcome: '',
  outcomeStatus: 'CONVERTED' as const,
};

describe('validateTaskDraft', () => {
  it('requires a custom label for the Other category', () => {
    expect(validateTaskDraft(draft).customCategory).toBe('Name the custom category.');
    expect(validateTaskDraft({ ...draft, customCategory: 'Account planning' })).toEqual({});
    expect(validateTaskDraft({ ...draft, customCategory: 'x'.repeat(81) }).customCategory).toBeDefined();
  });

  it('requires a title', () => {
    expect(validateTaskDraft({ ...draft, title: '  ', category: 'FOLLOW_UP' }).title).toBe(
      'Enter a task title.',
    );
  });
});

describe('normalizeTaskDraft', () => {
  it('keeps the custom label only for Other and the upsell outcome only for Upsell', () => {
    expect(normalizeTaskDraft({ ...draft, customCategory: ' Planning ' })).toMatchObject({
      customCategory: 'Planning',
      outcomeStatus: null,
      notes: null,
    });
    expect(
      normalizeTaskDraft({ ...draft, category: 'UPSELL', customCategory: 'ignored' }),
    ).toMatchObject({ customCategory: null, outcomeStatus: 'CONVERTED' });
  });
});

describe('applyStatusTransition', () => {
  const now = '2026-11-16T10:00:00.000Z';

  it('stamps completion and logs the change', () => {
    const result = applyStatusTransition({
      previousStatus: 'IN_PROGRESS',
      nextStatus: 'COMPLETED',
      previousCompletedAt: null,
      history: null,
      actorMemberId: 'me',
      now,
    });

    expect(result.completedAt).toBe(now);
    expect(result.isNewlyCompleted).toBe(true);
    expect(result.history).toEqual([
      { actorMemberId: 'me', action: 'STATUS_CHANGED', from: 'IN_PROGRESS', to: 'COMPLETED', at: now },
    ]);
  });

  it('clears completion when a task is reopened', () => {
    expect(
      applyStatusTransition({
        previousStatus: 'COMPLETED',
        nextStatus: 'TODO',
        previousCompletedAt: '2026-11-01T00:00:00.000Z',
        history: null,
        actorMemberId: 'me',
        now,
      }).completedAt,
    ).toBeNull();
  });

  it('leaves an unchanged status alone', () => {
    const result = applyStatusTransition({
      previousStatus: 'COMPLETED',
      nextStatus: 'COMPLETED',
      previousCompletedAt: '2026-11-01T00:00:00.000Z',
      history: null,
      actorMemberId: 'me',
      now,
    });

    expect(result).toEqual({
      completedAt: '2026-11-01T00:00:00.000Z',
      history: null,
      isNewlyCompleted: false,
    });
  });
});

describe('readCompletionLabel', () => {
  it('treats cancelled and in-progress tasks as not completed', () => {
    expect(readCompletionLabel('COMPLETED')).toBe('COMPLETED');
    expect(readCompletionLabel('CANCELLED')).toBe('NOT_COMPLETED');
    expect(readCompletionLabel('IN_PROGRESS')).toBe('NOT_COMPLETED');
  });
});
