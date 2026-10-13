import { t } from 'twenty-sdk/front-component';
import {
  IconArrowRight,
  IconRefresh,
  IconSparkles,
  IconSun,
} from 'twenty-ui/icon';

import { TaskButton } from './task-button';
import { TaskTodayScene } from './task-today-scene';
import { TASK_TOKENS } from './task-tokens';

type TaskTodayHeroProps = {
  dateLabel: string;
  isMobile: boolean;
  isBusy: boolean;
  isMotionEnabled: boolean;
  onToggleMotion: () => void;
  onRefresh: () => void;
  onFocusWork: () => void;
};

export const TaskTodayHero = ({
  dateLabel,
  isMobile,
  isBusy,
  isMotionEnabled,
  onToggleMotion,
  onRefresh,
  onFocusWork,
}: TaskTodayHeroProps) => (
  <header
    style={{
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 20,
      border: `1px solid ${TASK_TOKENS.border}`,
      marginBottom: 20,
      padding: isMobile ? 20 : '22px 28px',
      background: `linear-gradient(120deg, color-mix(in srgb, ${TASK_TOKENS.background} 78%, #bae6fd), color-mix(in srgb, ${TASK_TOKENS.background} 85%, #a7f3d0))`,
    }}
  >
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          color: TASK_TOKENS.textSecondary,
          fontSize: 12,
        }}
      >
        <IconSun size={15} style={{ color: TASK_TOKENS.textSecondary }} />
        {dateLabel}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          type="button"
          aria-label={t('Toggle visual effects')}
          aria-pressed={isMotionEnabled}
          title={t('Toggle visual effects')}
          onClick={onToggleMotion}
          style={{
            fontFamily: 'inherit',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            height: 32,
            background: isMotionEnabled
              ? 'rgba(14,165,233,.08)'
              : 'transparent',
            border: `1px solid ${isMotionEnabled ? 'rgba(14,165,233,.25)' : TASK_TOKENS.border}`,
            borderRadius: 8,
            color: isMotionEnabled
              ? TASK_TOKENS.textPrimary
              : TASK_TOKENS.textTertiary,
            fontSize: 11,
            padding: '0 8px',
            cursor: 'pointer',
          }}
        >
          <IconSparkles size={14} />
          {!isMobile && (isMotionEnabled ? t('Effects on') : t('Effects off'))}
        </button>
        <TaskButton
          title={t('Refresh today')}
          onClick={onRefresh}
          isDisabled={isBusy}
        >
          <IconRefresh size={14} />
          {!isMobile && t('Refresh')}
        </TaskButton>
      </div>
    </div>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
        paddingTop: isMobile ? 24 : 4,
      }}
    >
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          padding: isMobile ? '0 0 8px' : '20px 0 24px',
          minWidth: 0,
          flex: '1 1 280px',
        }}
      >
        <p
          style={{
            margin: '0 0 12px',
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            color: TASK_TOKENS.textSecondary,
          }}
        >
          {t('Your day, in focus')}
        </p>
        <h1
          style={{
            maxWidth: 430,
            fontSize: isMobile ? 32 : 42,
            lineHeight: 1.12,
            letterSpacing: '-1.8px',
            fontWeight: 600,
            margin: 0,
          }}
        >
          {t('A fresh start, every day.')}
        </h1>
        <p
          style={{
            margin: '14px 0 20px',
            maxWidth: 320,
            color: TASK_TOKENS.textSecondary,
            fontSize: 13,
            lineHeight: 1.7,
          }}
        >
          {t(
            'A little clarity. A little momentum. Your work and conversations, all in one place.',
          )}
        </p>
        <TaskButton variant="primary" onClick={onFocusWork} isDisabled={isBusy}>
          {t('Find my next task')}
          <IconArrowRight size={15} />
        </TaskButton>
      </div>
      {!isMobile && <TaskTodayScene isMotionEnabled={isMotionEnabled} />}
    </div>
  </header>
);
