import { describe, expect, it } from 'vitest';

import { orderBacklogSprints } from '../order-backlog-sprints.util';

describe('orderBacklogSprints', () => {
  it('puts the active sprint first and future ones in planning order', () => {
    expect(
      orderBacklogSprints([
        { id: 'later', state: 'FUTURE', position: 2 },
        { id: 'next', state: 'FUTURE', position: 1 },
        { id: 'running', state: 'ACTIVE', position: 3 },
        { id: 'unplaced', state: null, position: null },
      ]).map((sprint) => sprint.id),
    ).toEqual(['running', 'next', 'later', 'unplaced']);
  });

  it('leaves closed sprints out', () => {
    expect(
      orderBacklogSprints([
        { id: 'old', state: 'CLOSED', position: 0 },
        { id: 'next', state: 'FUTURE', position: 1 },
      ]).map((sprint) => sprint.id),
    ).toEqual(['next']);
  });
});
