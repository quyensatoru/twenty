import { useEffect, useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import {
  IconFocusCentered,
  IconPlayerPause,
  IconPlayerPlay,
  IconRefresh,
} from 'twenty-ui/icon';

import { type IssueRow } from '../../types/task-manager-rows';
import { useTodaySurface } from '../hooks/use-today-surface';
import { TASK_CIRCLE_STYLE } from './task-tokens';

type TaskTodayFocusProps = {
  issue: IssueRow | null;
  isMotionEnabled: boolean;
  onComplete: () => void;
};

export const TaskTodayFocus = ({
  issue,
  isMotionEnabled,
  onComplete,
}: TaskTodayFocusProps) => {
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [hasFinished, setHasFinished] = useState(false);
  const surface = useTodaySurface(isMotionEnabled, 2);
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
      {...surface.handlers}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 20,
        padding: 22,
        color: '#f1f2f4',
        background: 'linear-gradient(145deg, #132f49, #10243b 65%, #123f47)',
        border: '1px solid rgba(156,163,175,.25)',
        boxShadow: surface.isActive
          ? '0 18px 45px rgba(24,24,27,.25)'
          : '0 8px 25px rgba(24,24,27,.15)',
        transform: surface.transform,
        transition: surface.transition,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: surface.glow,
        }}
      />
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <IconFocusCentered size={18} style={{ color: '#bae6fd' }} />
        <h2 style={{ margin: 0, fontSize: 15, flex: 1 }}>
          {t('Focus session')}
        </h2>
        <span
          style={{
            ...TASK_CIRCLE_STYLE,
            width: 6,
            height: 6,
            background: isRunning ? '#6ee7b7' : '#9ca3af',
            boxShadow: 'none',
          }}
        />
      </div>
      <div
        style={{
          position: 'relative',
          width: 184,
          height: 184,
          margin: '22px auto 18px',
          perspective: '600px',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            ...TASK_CIRCLE_STYLE,
            position: 'absolute',
            inset: -8,
            border: '1px solid rgba(156,163,175,.13)',
            transform: 'rotateX(20deg) rotateY(-14deg)',
          }}
        />
        <div
          aria-hidden="true"
          style={{
            ...TASK_CIRCLE_STYLE,
            position: 'absolute',
            inset: 0,
            background: `conic-gradient(from -90deg, #6ee7b7 ${progress * 360}deg, rgba(156,163,175,.15) ${progress * 360}deg)`,
            boxShadow:
              '0 0 32px rgba(156,163,175,.12), inset 0 0 18px rgba(156,163,175,.12)',
            transform:
              isMotionEnabled && surface.isActive
                ? 'rotateY(10deg) rotateX(-5deg)'
                : 'rotateY(0deg)',
            transition: surface.transition,
          }}
        />
        <div
          style={{
            ...TASK_CIRCLE_STYLE,
            position: 'absolute',
            inset: 5,
            background:
              'radial-gradient(circle at 35% 25%, #24465f, #142d43 75%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            boxShadow: 'inset 0 2px 15px rgba(255,255,255,.06)',
          }}
        >
          <span
            role="timer"
            aria-label={t('Time remaining')}
            style={{
              fontSize: 38,
              fontWeight: 600,
              letterSpacing: '-2px',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {remainingLabel}
          </span>
          <span
            style={{
              color: '#bae6fd',
              fontSize: 10,
              marginTop: 8,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
            }}
          >
            {isRunning
              ? t('In the zone')
              : hasFinished
                ? t('Nicely done')
                : t('Find your flow')}
          </span>
        </div>
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: -8,
            transform: `rotate(${progress * 360 - 30}deg)`,
            transition: isMotionEnabled ? 'transform 1000ms linear' : 'none',
          }}
        >
          <span
            style={{
              ...TASK_CIRCLE_STYLE,
              position: 'absolute',
              left: '50%',
              top: 0,
              width: 12,
              height: 12,
              background:
                'radial-gradient(circle at 30% 25%, #d1d5db, #9ca3af)',
              boxShadow: '0 2px 6px rgba(0,0,0,.15)',
            }}
          />
        </div>
      </div>
      <p
        style={{
          position: 'relative',
          textAlign: 'center',
          fontSize: 12,
          lineHeight: 1.6,
          minHeight: 38,
          margin: '0 0 14px',
          color: '#d1d5db',
          overflowWrap: 'anywhere',
        }}
      >
        {issue ? (
          <>
            <span
              style={{
                display: 'block',
                color: '#9ca3af',
                fontSize: 10,
                marginBottom: 3,
              }}
            >
              {issue.issueKey}
            </span>
            {issue.title || t('Untitled issue')}
          </>
        ) : (
          t('One small session. One meaningful step.')
        )}
      </p>
      <div
        role="group"
        aria-label={t('Session duration')}
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 6,
          marginBottom: 14,
        }}
      >
        {[5, 15, 25].map((minutes) => (
          <button
            key={minutes}
            type="button"
            disabled={isRunning}
            aria-pressed={durationMinutes === minutes}
            onClick={() => reset(minutes)}
            style={{
              fontFamily: 'inherit',
              cursor: isRunning ? 'default' : 'pointer',
              padding: '6px 12px',
              fontSize: 11,
              borderRadius: 7,
              border: '1px solid rgba(156,163,175,.2)',
              color: durationMinutes === minutes ? '#f1f2f4' : '#bae6fd',
              background:
                durationMinutes === minutes
                  ? 'rgba(156,163,175,.3)'
                  : 'transparent',
              opacity: isRunning ? 0.5 : 1,
            }}
          >
            {t('{minutes} min', { minutes })}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
        <button
          type="button"
          onClick={toggleTimer}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            height: 38,
            border: '1px solid rgba(156,163,175,.4)',
            borderRadius: 10,
            background: 'linear-gradient(120deg,#0369a1,#0284c7)',
            color: '#fff',
            fontFamily: 'inherit',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(24,24,27,.3)',
          }}
        >
          {isRunning ? (
            <IconPlayerPause size={15} />
          ) : (
            <IconPlayerPlay size={15} />
          )}
          {isRunning
            ? t('Pause session')
            : secondsRemaining < durationMinutes * 60 && secondsRemaining > 0
              ? t('Resume session')
              : t('Start session')}
        </button>
        <button
          type="button"
          aria-label={t('Reset session')}
          onClick={() => reset()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 38,
            borderRadius: 10,
            border: '1px solid rgba(156,163,175,.2)',
            background: 'rgba(156,163,175,.08)',
            color: '#d1d5db',
            cursor: 'pointer',
          }}
        >
          <IconRefresh size={15} />
        </button>
      </div>
      <p
        style={{
          textAlign: 'center',
          fontSize: 10,
          color: '#94b5c8',
          margin: '12px 0 0',
        }}
      >
        {t('Your timer runs while this page is open.')}
      </p>
    </section>
  );
};
