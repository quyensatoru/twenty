import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconCheck, IconClock, IconPlayerStop, IconX } from 'twenty-ui/icon';
import { type TaskAiRunEvent } from '../../utils/task-ai-run-events.util';
import { TASK_TOKENS } from './task-tokens';

type TaskAiRunTimelineProps = { events: TaskAiRunEvent[] };

export const TaskAiRunTimeline = ({ events }: TaskAiRunTimelineProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const steps = new Map<number, TaskAiRunEvent & { startedAt: number }>();
  for (const event of events) {
    steps.set(event.stepId, {
      ...event,
      startedAt: steps.get(event.stepId)?.startedAt ?? event.timestamp,
    });
  }
  const labels: Record<string, string> = {
    'Preparing context': t('Preparing context'),
    'Analyzing task': t('Analyzing task'),
    'Opening repository': t('Opening repository'),
    'Listing files': t('Listing files'),
    'Reading file': t('Reading file'),
    'Searching repository': t('Searching repository'),
    'Comparing changes': t('Comparing changes'),
    'Saving reply': t('Saving reply'),
    'Reply ready': t('Reply ready'),
    'Reply failed': t('Reply failed'),
    'Reply timed out': t('Reply timed out'),
    Cancelled: t('Cancelled'),
  };
  const statuses = {
    running: t('In progress'),
    completed: t('Completed'),
    failed: t('Failed'),
    cancelled: t('Cancelled'),
  };
  const latest = events[events.length - 1];
  if (latest === undefined) return null;
  return (
    <div
      style={{
        border: `1px solid ${TASK_TOKENS.borderLight}`,
        borderRadius: TASK_TOKENS.radius,
        padding: 12,
      }}
    >
      <button
        type="button"
        aria-label={isExpanded ? t('Hide AI activity') : t('Show AI activity')}
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((previous) => !previous)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          width: '100%',
          padding: 0,
          background: 'transparent',
          border: 'none',
          fontFamily: TASK_TOKENS.fontFamily,
          fontSize: 12,
          color: TASK_TOKENS.textSecondary,
          cursor: 'pointer',
        }}
      >
        <span>
          {t('AI activity')} · {steps.size}
        </span>
        <span role="status" aria-live="polite">
          {labels[latest.operation] ?? latest.operation}
        </span>
      </button>
      {isExpanded && (
        <ol
          aria-label={t('AI activity')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            margin: '12px 0 0',
            padding: 0,
            listStyle: 'none',
          }}
        >
          {[...steps.values()].map((step) => {
            const Icon =
              step.status === 'completed'
                ? IconCheck
                : step.status === 'failed'
                  ? IconX
                  : step.status === 'cancelled'
                    ? IconPlayerStop
                    : IconClock;
            return (
              <li
                key={step.stepId}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  fontSize: 12,
                  color:
                    step.status === 'failed'
                      ? TASK_TOKENS.textDanger
                      : TASK_TOKENS.textSecondary,
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    color:
                      step.status === 'running'
                        ? TASK_TOKENS.accent
                        : 'inherit',
                    marginTop: 1,
                  }}
                >
                  <Icon size={14} />
                </span>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <span>{labels[step.operation] ?? step.operation}</span>
                  {step.detail && (
                    <span
                      style={{
                        color: TASK_TOKENS.textTertiary,
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {step.detail}
                    </span>
                  )}
                </div>
                <span
                  style={{
                    color: TASK_TOKENS.textTertiary,
                    whiteSpace: 'nowrap',
                    fontSize: 11,
                  }}
                >
                  {statuses[step.status]}
                  {step.status !== 'running' &&
                    ` · ${((step.timestamp - step.startedAt) / 1000).toFixed(1)}s`}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
};
