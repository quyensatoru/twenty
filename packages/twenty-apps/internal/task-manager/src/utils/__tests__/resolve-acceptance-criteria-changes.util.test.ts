import { describe, expect, it } from 'vitest';

import { resolveAcceptanceCriteriaChanges } from '../resolve-acceptance-criteria-changes.util';

const criterion = (id: string, text: string, isDone = false) => ({
  id,
  text,
  isDone,
});

describe('resolveAcceptanceCriteriaChanges', () => {
  it('reports added, ticked, unticked and removed criteria', () => {
    expect(
      resolveAcceptanceCriteriaChanges({
        before: {
          acceptanceCriteria: [
            criterion('a', 'Shows the badge'),
            criterion('b', 'Logs the event', true),
            criterion('c', 'Sends the email'),
          ],
        },
        after: {
          acceptanceCriteria: [
            criterion('a', 'Shows the badge', true),
            criterion('b', 'Logs the event'),
            criterion('d', 'Retries twice'),
          ],
        },
      }),
    ).toEqual([
      { action: 'ac-checked', text: 'Shows the badge' },
      { action: 'ac-unchecked', text: 'Logs the event' },
      { action: 'ac-added', text: 'Retries twice' },
      { action: 'ac-removed', text: 'Sends the email' },
    ]);
  });

  it('ignores a reworded criterion', () => {
    expect(
      resolveAcceptanceCriteriaChanges({
        before: { acceptanceCriteria: [criterion('a', 'Old words')] },
        after: { acceptanceCriteria: [criterion('a', 'New words')] },
      }),
    ).toEqual([]);
  });

  it('returns nothing when the update does not carry the criteria', () => {
    expect(
      resolveAcceptanceCriteriaChanges({
        before: { acceptanceCriteria: [criterion('a', 'Shows the badge')] },
        after: {},
      }),
    ).toEqual([]);
  });

  it('treats a missing list as empty', () => {
    expect(
      resolveAcceptanceCriteriaChanges({
        before: { acceptanceCriteria: null },
        after: { acceptanceCriteria: [criterion('a', 'Shows the badge')] },
      }),
    ).toEqual([{ action: 'ac-added', text: 'Shows the badge' }]);
  });
});
