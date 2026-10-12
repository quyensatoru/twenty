export type TaskAiRunEvent = {
  sequence: number;
  stepId: number;
  operation: string;
  detail?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  timestamp: number;
};

export const appendTaskAiRunEvents = (
  previous: TaskAiRunEvent[],
  status: TaskAiRunEvent['status'],
  operation: string,
  detail?: string,
): TaskAiRunEvent[] => {
  const events = [...previous];
  const latest = events[events.length - 1];
  const timestamp = Date.now();
  if (latest?.status === 'running') {
    events.push({
      ...latest,
      sequence: events.length + 1,
      timestamp,
      status: status === 'running' ? 'completed' : status,
    });
  }
  const sequence = events.length + 1;
  events.push({
    sequence,
    stepId: sequence,
    operation,
    detail,
    status,
    timestamp,
  });
  return events;
};

export const mergeTaskAiRunEvents = (
  previous: TaskAiRunEvent[],
  incoming: TaskAiRunEvent[],
): TaskAiRunEvent[] =>
  [
    ...new Map(
      [...previous, ...incoming].map((event) => [event.sequence, event]),
    ).values(),
  ].sort((left, right) => left.sequence - right.sequence);
