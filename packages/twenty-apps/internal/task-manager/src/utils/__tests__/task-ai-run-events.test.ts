import { describe, expect, it } from 'vitest';
import {
  appendTaskAiRunEvents,
  mergeTaskAiRunEvents,
} from '../task-ai-run-events.util';

describe('task AI event delivery', () => {
  it('keeps events from a newer snapshot when an older poll arrives later', () => {
    const initial = appendTaskAiRunEvents([], 'running', 'Preparing context');
    const analyzing = appendTaskAiRunEvents(
      initial,
      'running',
      'Analyzing task',
    );
    const finished = appendTaskAiRunEvents(
      analyzing,
      'completed',
      'Reply ready',
    );
    expect(mergeTaskAiRunEvents(finished, initial)).toEqual(finished);
    expect(mergeTaskAiRunEvents(finished, finished)).toEqual(finished);
  });
  it('keeps repeated model calls as separate steps', () => {
    const initial = appendTaskAiRunEvents([], 'running', 'Analyzing task');
    const reading = appendTaskAiRunEvents(initial, 'running', 'Reading file');
    const second = appendTaskAiRunEvents(reading, 'running', 'Analyzing task');
    expect(
      second
        .filter(
          (event) =>
            event.operation === 'Analyzing task' && event.status === 'running',
        )
        .map((event) => event.stepId),
    ).toEqual([1, 5]);
  });
});
