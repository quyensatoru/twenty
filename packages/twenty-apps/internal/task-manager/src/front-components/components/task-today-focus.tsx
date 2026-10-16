import { useEffect, useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import {
  IconFocusCentered,
  IconPlayerPause,
  IconPlayerPlay,
  IconRefresh,
} from 'twenty-ui/icon';

import { type IssueRow } from '../../types/task-manager-rows';
import { TaskButton } from './task-button';
import { TaskIconButton } from './task-icon-button';
import { readTagColor, TASK_CIRCLE_STYLE, TASK_TOKENS } from './task-tokens';

type TaskTodayFocusProps = {
  issue: IssueRow | null;
  // Started with nothing picked, the session attaches to this issue instead.
  fallbackIssue: IssueRow | null;
  onPickIssue: (issue: IssueRow) => void;
  isMotionEnabled: boolean;
  onComplete: () => void;
};

export const TaskTodayFocus = ({
  issue,
  fallbackIssue,
  onPickIssue,
  isMotionEnabled,
  onComplete,
}: TaskTodayFocusProps) => {
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [hasFinished, setHasFinished] = useState(false);
  const isRunning = deadline !== null;

  useEffect(() => {
    if (deadline === null) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsRemaining(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        setDeadline(null);
        setHasFinished(true);
        onComplete();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline, onComplete]);

  const reset = (minutes: number = durationMinutes) => {
    setDeadline(null);
    setDurationMinutes(minutes);
    setSecondsRemaining(minutes * 60);
    setHasFinished(false);
  };
  const toggleTimer = () => {
    if (deadline !== null) {
      setSecondsRemaining(
        Math.max(0, Math.ceil((deadline - Date.now()) / 1000)),
      );
      setDeadline(null);
    } else {
      if (issue === null && fallbackIssue !== null) onPickIssue(fallbackIssue);
      const remaining = secondsRemaining || durationMinutes * 60;
      setSecondsRemaining(remaining);
      setHasFinished(false);
      setDeadline(Date.now() + remaining * 1000);
    }
  };
  const remainingLabel = `${Math.floor(secondsRemaining / 60)
    .toString()
    .padStart(2, '0')}:${(secondsRemaining % 60).toString().padStart(2, '0')}`;
  const progress = 1 - secondsRemaining / (durationMinutes * 60);

  return (
    <section
      aria-label={t('Focus session')}
      style={{
        background: TASK_TOKENS.background,
        border: `1px solid ${TASK_TOKENS.border}`,
        borderRadius: TASK_TOKENS.radius,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: 14,
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', gap: 6 }}>
        <IconFocusCentered size={14} color={TASK_TOKENS.textTertiary} />
        <h2 style={{ flex: 1, fontSize: 13, fontWeight: 600, margin: 0 }}>
          {t('Focus')}
        </h2>
        <span
          title={isRunning ? t('In the zone') : undefined}
          style={{
            ...TASK_CIRCLE_STYLE,
            background: isRunning
              ? readTagColor('green').text
              : TASK_TOKENS.textLight,
            height: 6,
            width: 6,
          }}
        />
      </div>
      <div style={{ alignItems: 'center', display: 'flex', gap: 12 }}>
        <span
          role="timer"
          aria-label={t('Time remaining')}
          style={{
            fontSize: 28,
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 600,
            letterSpacing: -0.5,
            lineHeight: 1,
          }}
        >
          {remainingLabel}
        </span>
        <span style={{ flex: 1 }} />
        <TaskButton variant="primary" size="compact" onClick={toggleTimer}>
          {isRunning ? (
            <IconPlayerPause size={13} />
          ) : (
            <IconPlayerPlay size={13} />
          )}
          {isRunning
            ? t('Pause')
            : secondsRemaining < durationMinutes * 60 && secondsRemaining > 0
              ? t('Resume')
              : t('Start')}
        </TaskButton>
        <TaskIconButton label={t('Reset session')} onClick={() => reset()}>
          <IconRefresh size={14} />
        </TaskIconButton>
      </div>
      <span
        style={{
          background: TASK_TOKENS.backgroundTertiary,
          borderRadius: 2,
          display: 'flex',
          height: 4,
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            background: readTagColor('green').text,
            display: 'block',
            height: '100%',
            transition: isMotionEnabled ? 'width 1000ms linear' : 'none',
            width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
          }}
        />
      </span>
      <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
        <span
          style={{
            color: TASK_TOKENS.textSecondary,
            flex: 1,
            fontSize: 12,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {issue
            ? t('On {issueLabel}', {
                issueLabel:
                  `${issue.issueKey ?? ''} ${issue.title || t('Untitled issue')}`.trim(),
              })
            : hasFinished
              ? t('Nicely done. Take a short break.')
              : t('Pick an issue and press Focus on its row.')}
        </span>
        <div
          role="group"
          aria-label={t('Session duration')}
          style={{ display: 'inline-flex', flexShrink: 0, gap: 2 }}
        >
          {[5, 15, 25].map((minutes) => (
            <button
              key={minutes}
              type="button"
              disabled={isRunning}
              aria-pressed={durationMinutes === minutes}
              onClick={() => reset(minutes)}
              style={{
                background:
                  durationMinutes === minutes
                    ? TASK_TOKENS.backgroundSelected
                    : 'transparent',
                border: 'none',
                borderRadius: TASK_TOKENS.radiusSmall,
                color:
                  durationMinutes === minutes
                    ? TASK_TOKENS.textPrimary
                    : TASK_TOKENS.textTertiary,
                cursor: isRunning ? 'default' : 'pointer',
                fontFamily: 'inherit',
                fontSize: 11,
                fontVariantNumeric: 'tabular-nums',
                opacity: isRunning ? 0.5 : 1,
                padding: '3px 6px',
              }}
            >
              {t('{minutes}m', { minutes })}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
