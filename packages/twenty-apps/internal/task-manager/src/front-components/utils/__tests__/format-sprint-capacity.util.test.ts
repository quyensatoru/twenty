import { describe, expect, it } from 'vitest';

import { formatSprintCapacity } from '../format-sprint-capacity.util';

describe('formatSprintCapacity', () => {
  it('returns null when the sprint has no capacity', () => {
    expect(formatSprintCapacity({ storyPointTotal: 8, capacity: null })).toBe(
      null,
    );
    expect(
      formatSprintCapacity({ storyPointTotal: 8, capacity: undefined }),
    ).toBe(null);
    expect(formatSprintCapacity({ storyPointTotal: 8, capacity: 0 })).toBe(
      null,
    );
  });

  it('shows planned points over capacity', () => {
    expect(formatSprintCapacity({ storyPointTotal: 8, capacity: 20 })).toEqual({
      storyPointTotal: 8,
      capacity: 20,
      isOverCapacity: false,
    });
  });

  it('is not over capacity when exactly full', () => {
    expect(
      formatSprintCapacity({ storyPointTotal: 20, capacity: 20 })
        ?.isOverCapacity,
    ).toBe(false);
  });

  it('flags a sprint planned past its capacity', () => {
    expect(formatSprintCapacity({ storyPointTotal: 26, capacity: 20 })).toEqual(
      {
        storyPointTotal: 26,
        capacity: 20,
        isOverCapacity: true,
      },
    );
  });
});
