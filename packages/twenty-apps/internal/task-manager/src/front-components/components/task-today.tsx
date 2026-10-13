import { type CSSProperties, useCallback, useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import {
  IconArrowUpRight,
  IconBell,
  IconCalendar,
  IconCheck,
  IconClock,
  IconFocusCentered,
  IconRefresh,
  IconSun,
  IconPlayerPlay,
  IconLayoutGrid,
  IconList,
} from 'twenty-ui/icon';

import { TASK_TODAY_SECTIONS } from '../../constants/task-today';
import { type IssueRow } from '../../types/task-manager-rows';
import { type TaskTodaySection } from '../../types/task-today';
import { toDateInputValue } from '../utils/sprint-dates.util';
import { useIsMobile } from '../hooks/use-is-mobile';
import { useTaskToday } from '../hooks/use-task-today';
import { useTodayMotion } from '../hooks/use-today-motion';
import { buildIssueCommentUrl } from '../utils/build-record-url.util';
import { readRecordPageBaseUrl } from '../utils/read-record-page-base-url.util';
import { stripTaskMentionMarkup } from '../utils/task-mention-markdown.util';
import { TaskButton } from './task-button';
import { TaskSkeletonBar } from './task-skeleton';
import {
  getTaskTodayWorkGridStyle,
  TaskTodayWorkSkeleton,
} from './task-today-work-layout';
import { usePersonalBoardPreferences } from '../hooks/use-personal-board-preferences';
import { TaskTodayIssueRow } from './task-today-issue-row';
import { TaskTodayHero } from './task-today-hero';
import { TaskTodayFocus } from './task-today-focus';
import { TaskTodayEmblem } from './task-today-emblem';
import { TaskTodayAction } from './task-today-action';
import { TaskTodayAtmosphere } from './task-today-atmosphere';
import { TaskTodayCelebration } from './task-today-celebration';
import { useTodaySurface } from '../hooks/use-today-surface';
import {
  readTagColor,
  TASK_THIN_SCROLLBAR_STYLE,
  TASK_TOKENS,
} from './task-tokens';

const PANEL_STYLE: CSSProperties = {
  background: TASK_TOKENS.background,
  border: `1px solid ${TASK_TOKENS.border}`,
  borderRadius: 12,
  overflow: 'hidden',
  minWidth: 0,
};

const readSectionLabel = (section: TaskTodaySection): string =>
  ({
    overdue: t('Overdue'),
    today: t('Due today'),
    upcoming: t('Next 7 days'),
    inProgress: t('In progress'),
    noDueDate: t('No due date'),
    recentlyDone: t('Recently done'),
  })[section];

const readSectionDescription = (section: TaskTodaySection): string =>
  ({
    overdue: t('A little attention here goes a long way.'),
    today: t('Make room for what matters today.'),
    upcoming: t('A look ahead, without the rush.'),
    inProgress: t('Pick up where you left off.'),
    noDueDate: t('Your open work that has no deadline yet.'),
    recentlyDone: t('Done issues updated in the last 7 days.'),
  })[section];

const readEmptyMessage = (section: TaskTodaySection): string =>
  ({
    overdue: t('All caught up. No overdue work.'),
    today: t('A little breathing room. Nothing is due today.'),
    upcoming: t('No deadlines in the next 7 days.'),
    inProgress: t('Nothing in progress yet. Choose your next issue.'),
    noDueDate: t('No open issues without a due date.'),
    recentlyDone: t('Your recent wins will appear here.'),
  })[section];

type TaskTodayStatProps = {
  label: string;
  count: number | undefined;
  color: string;
  icon: typeof IconCalendar;
  isSelected: boolean;
  isDisabled: boolean;
  isMotionEnabled: boolean;
  onClick: () => void;
};

const TaskTodayStat = ({
  label,
  count,
  color,
  icon: Icon,
  isSelected,
  isDisabled,
  isMotionEnabled,
  onClick,
}: TaskTodayStatProps) => {
  const surface = useTodaySurface(isMotionEnabled, 8);
  const isHovered = surface.isActive;
  const tone = readTagColor(color);
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      disabled={isDisabled}
      onClick={onClick}
      {...surface.handlers}
      style={{
        ...PANEL_STYLE,
        textAlign: 'left',
        cursor: isDisabled ? 'default' : 'pointer',
        padding: 20,
        position: 'relative',
        borderRadius: 18,
        minHeight: 142,
        fontFamily: 'inherit',
        color: TASK_TOKENS.textPrimary,
        background: TASK_TOKENS.background,
        borderColor: isSelected
          ? TASK_TOKENS.borderInverted
          : TASK_TOKENS.border,
        boxShadow: isHovered
          ? '0 16px 24px -14px rgba(24,24,27,.25)'
          : '0 3px 10px rgba(24,24,27,.025)',
        transform: surface.transform,
        transition: surface.transition,
      }}
    >
      <span
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            color: TASK_TOKENS.textSecondary,
            fontSize: 12,
            fontWeight: 500,
            borderLeft: `2px solid ${tone.text}`,
            paddingLeft: 8,
          }}
        >
          {label}
        </span>
        <TaskTodayEmblem
          icon={Icon}
          color={tone.text}
          isMotionEnabled={isMotionEnabled}
          size={28}
        />
      </span>
      <span
        style={{
          display: 'block',
          fontSize: 36,
          lineHeight: 1.2,
          fontWeight: 600,
          letterSpacing: '-1px',
          marginTop: 12,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {count === undefined ? (
          <TaskSkeletonBar width={40} height={30} />
        ) : (
          count
        )}
      </span>
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: 20,
          bottom: 19,
          color: TASK_TOKENS.textSecondary,
          opacity: isHovered ? 1 : 0.3,
          transform: isHovered ? 'translate(2px,-2px)' : 'translate(0,0)',
          transition: surface.transition,
        }}
      >
        <IconArrowUpRight size={19} />
      </span>
    </button>
  );
};

export const TaskToday = () => {
  const {
    data,
    section,
    isLoading,
    error,
    busyIssueId,
    busyNotificationId,
    load,
    changeStatus,
    markRead,
  } = useTaskToday();
  const isMobile = useIsMobile();
  const {
    preferences,
    savePreferences,
    isSavingPreferences,
    preferencesError,
  } = usePersonalBoardPreferences(data?.memberId, data?.boardPreferences);
  const {
    isMotionEnabled,
    toggleMotion: toggleLocalMotion,
    entranceStyle,
  } = useTodayMotion(data?.memberId, preferences.effectsEnabled);
  const toggleMotion = () => {
    if (isSavingPreferences) return;
    toggleLocalMotion();
    if (data?.memberId)
      void savePreferences({ effectsEnabled: !isMotionEnabled });
  };
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [focusedIssue, setFocusedIssue] = useState<IssueRow | null>(null);
  const [celebration, setCelebration] = useState<{
    id: number;
    message: string;
  } | null>(null);

  const isDeskView = preferences.workView === 'desk';
  const [departingIssueId, setDepartingIssueId] = useState<string | null>(null);
  const inboxSurface = useTodaySurface(isMotionEnabled, 2);
  const dismissCelebration = useCallback(() => setCelebration(null), []);
  const celebrateSession = useCallback(
    () =>
      setCelebration({
        id: Date.now(),
        message: t('Focus session complete. Time for a little break.'),
      }),
    [],
  );
  const selectFocusIssue = (issue: IssueRow) => {
    setFocusedIssue(issue);
    if (isMobile) setIsFocusMode(true);
  };
  const shuffleTask = () => {
    if (!data?.issues.length) return;
    const candidates = data.issues.filter(
      (issue) =>
        data.issueStatuses.find((status) => status.id === issue.statusId)
          ?.category !== 'DONE',
    );
    const alternatives = candidates.filter(
      (issue) => issue.id !== focusedIssue?.id,
    );
    const choices = alternatives.length ? alternatives : candidates;
    if (choices.length)
      selectFocusIssue(choices[Math.floor(Math.random() * choices.length)]);
  };
  const updateStatus = async (issueId: string, statusId: string) => {
    const wasDone =
      data?.issueStatuses.find(
        (status) =>
          status.id ===
          data.issues.find((issue) => issue.id === issueId)?.statusId,
      )?.category === 'DONE';
    const isDone =
      data?.issueStatuses.find((status) => status.id === statusId)?.category ===
      'DONE';
    const success = await changeStatus(issueId, statusId, async () => {
      if (!isDone || wasDone || !isMotionEnabled) return;
      setDepartingIssueId(issueId);
      await new Promise<void>((resolve) => setTimeout(resolve, 480));
    });
    setDepartingIssueId(null);
    if (success && isDone && !wasDone) {
      setCelebration({
        id: Date.now(),
        message: t('One task down. A little victory worth celebrating.'),
      });
      if (focusedIssue?.id === issueId) setFocusedIssue(null);
    }
  };
  const baseUrl = readRecordPageBaseUrl();
  const isBusy =
    isLoading || busyIssueId !== null || busyNotificationId !== null;
  const hasCurrentData = data !== null && data.section === section;
  const day = data?.day ?? toDateInputValue(new Date());
  const dateLabel = new Date(`${day}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main
      style={{
        position: 'relative',
        isolation: 'isolate',
        background: TASK_TOKENS.backgroundSecondary,
        color: TASK_TOKENS.textPrimary,
        fontFamily: TASK_TOKENS.fontFamily,
        fontSize: 13,
        height: '100%',
        boxSizing: 'border-box',
        overflowY: 'auto',
        ...TASK_THIN_SCROLLBAR_STYLE,
      }}
    >
      <TaskTodayAtmosphere />
      {celebration && (
        <TaskTodayCelebration
          key={celebration.id}
          message={celebration.message}
          isMotionEnabled={isMotionEnabled}
          onDismiss={dismissCelebration}
        />
      )}
      <div
        style={{
          position: 'relative',
          maxWidth: 1180,
          margin: '0 auto',
          padding: isMobile ? '24px 16px' : '36px 32px 48px',
        }}
      >
        <div
          style={{
            ...entranceStyle(),
            display: isFocusMode ? 'none' : 'block',
          }}
        >
          <TaskTodayHero
            dateLabel={dateLabel}
            isMobile={isMobile}
            isBusy={isBusy}
            isMotionEnabled={isMotionEnabled}
            onToggleMotion={toggleMotion}
            onRefresh={() => void load(section)}
            onFocusWork={() =>
              void load(
                data && data.counts.overdue > 0
                  ? 'overdue'
                  : data && data.counts.today > 0
                    ? 'today'
                    : data && data.counts.inProgress > 0
                      ? 'inProgress'
                      : 'noDueDate',
              )
            }
          />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 14,
            margin: '4px 0 22px',
            ...entranceStyle(50),
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
              {isFocusMode
                ? t('Less noise. More flow.')
                : t('Make it your kind of day.')}
            </p>
            <p
              style={{
                margin: '4px 0 0',
                color: TASK_TOKENS.textSecondary,
                fontSize: 11,
              }}
            >
              {isFocusMode
                ? t('Your work and your focus session. That’s all.')
                : t('Pick something small. Build a little momentum.')}
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <TaskTodayAction
              isMotionEnabled={isMotionEnabled}
              isSelected={isFocusMode}
              onClick={() => setIsFocusMode((previous) => !previous)}
            >
              <IconFocusCentered size={16} />
              {isFocusMode ? t('Exit focus mode') : t('Focus mode')}
            </TaskTodayAction>
            <TaskTodayAction
              isMotionEnabled={isMotionEnabled}
              isDisabled={
                isBusy ||
                !data?.issues.some(
                  (issue) =>
                    data.issueStatuses.find(
                      (status) => status.id === issue.statusId,
                    )?.category !== 'DONE',
                )
              }
              onClick={shuffleTask}
            >
              <IconRefresh size={16} />
              {t('Shuffle a task')}
            </TaskTodayAction>
            <TaskTodayAction
              isMotionEnabled={isMotionEnabled}
              onClick={() =>
                setCelebration({
                  id: Date.now(),
                  message: t('A little good energy. Keep going.'),
                })
              }
            >
              <IconSun size={16} />
              {t('Good vibes')}
            </TaskTodayAction>
            {isFocusMode && (
              <TaskTodayAction
                isMotionEnabled={isMotionEnabled}
                isSelected={isMotionEnabled}
                onClick={toggleMotion}
              >
                {t('Toggle visual effects')}
              </TaskTodayAction>
            )}
          </div>
        </div>

        <div
          role="region"
          aria-label={t('Task radar')}
          style={{
            display: isFocusMode ? 'none' : 'grid',
            gridTemplateColumns: isMobile
              ? 'repeat(2, minmax(0, 1fr))'
              : 'repeat(4, minmax(0, 1fr))',
            gap: 12,
            marginBottom: 24,
            ...entranceStyle(80),
          }}
        >
          <TaskTodayStat
            label={t('Overdue')}
            count={data?.counts.overdue}
            color="red"
            icon={IconClock}
            isSelected={section === 'overdue'}
            isDisabled={isBusy}
            onClick={() => {
              void load('overdue');
            }}
            isMotionEnabled={isMotionEnabled}
          />
          <TaskTodayStat
            label={t('Due today')}
            count={data?.counts.today}
            color="blue"
            icon={IconCalendar}
            isSelected={section === 'today'}
            isDisabled={isBusy}
            onClick={() => {
              void load('today');
            }}
            isMotionEnabled={isMotionEnabled}
          />
          <TaskTodayStat
            label={t('In progress')}
            count={data?.counts.inProgress}
            color="purple"
            icon={IconPlayerPlay}
            isSelected={section === 'inProgress'}
            isDisabled={isBusy}
            onClick={() => {
              void load('inProgress');
            }}
            isMotionEnabled={isMotionEnabled}
          />
          <TaskTodayStat
            label={t('Next 7 days')}
            count={data?.counts.upcoming}
            color="turquoise"
            icon={IconCalendar}
            isSelected={section === 'upcoming'}
            isDisabled={isBusy}
            onClick={() => {
              void load('upcoming');
            }}
            isMotionEnabled={isMotionEnabled}
          />
        </div>

        {preferencesError && (
          <div
            role="alert"
            style={{
              ...PANEL_STYLE,
              padding: 12,
              marginBottom: 16,
              color: TASK_TOKENS.textDanger,
            }}
          >
            {t('Your preference could not be saved.')} {preferencesError}
          </div>
        )}
        {error && (
          <div
            role="alert"
            style={{
              ...PANEL_STYLE,
              color: TASK_TOKENS.textDanger,
              padding: 14,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <span>{error}</span>
            <TaskButton onClick={() => void load(section)} isDisabled={isBusy}>
              {t('Retry')}
            </TaskButton>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile
              ? 'minmax(0, 1fr)'
              : 'minmax(0, 1fr) 310px',
            alignItems: 'start',
            gap: 20,
          }}
        >
          <section
            aria-label={t('My work')}
            style={{
              ...PANEL_STYLE,
              borderRadius: 20,
              background: TASK_TOKENS.background,
              boxShadow: '0 8px 24px rgba(24,24,27,.035)',
              ...entranceStyle(140),
            }}
          >
            <div
              style={{
                padding: '24px 24px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: 23,
                    fontWeight: 600,
                    letterSpacing: '-.6px',
                    margin: 0,
                  }}
                >
                  {t('My work')}
                </h2>
                <p
                  style={{
                    color: TASK_TOKENS.textTertiary,
                    margin: '6px 0 0',
                    lineHeight: 1.5,
                  }}
                >
                  {t('Assigned to you, across your projects.')}
                </p>
              </div>
              <div
                role="group"
                aria-label={t('Work view')}
                style={{
                  display: 'flex',
                  gap: 3,
                  borderRadius: 8,
                  padding: 3,
                  background: TASK_TOKENS.backgroundSecondary,
                  border: `1px solid ${TASK_TOKENS.border}`,
                }}
              >
                {[
                  {
                    view: 'desk' as const,
                    label: t('Card view'),
                    icon: IconLayoutGrid,
                  },
                  {
                    view: 'list' as const,
                    label: t('List view'),
                    icon: IconList,
                  },
                ].map(({ view, label, icon: Icon }) => (
                  <button
                    key={label}
                    type="button"
                    aria-label={label}
                    aria-pressed={preferences.workView === view}
                    disabled={isSavingPreferences}
                    onClick={() => void savePreferences({ workView: view })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '6px 9px',
                      border: 'none',
                      borderRadius: 6,
                      fontFamily: 'inherit',
                      fontSize: 11,
                      cursor: 'pointer',
                      color:
                        preferences.workView === view
                          ? TASK_TOKENS.textPrimary
                          : TASK_TOKENS.textSecondary,
                      background:
                        preferences.workView === view
                          ? TASK_TOKENS.background
                          : 'transparent',
                      boxShadow:
                        preferences.workView === view
                          ? '0 1px 3px rgba(0,0,0,.08)'
                          : 'none',
                    }}
                  >
                    <Icon size={13} />
                    {view === 'desk' ? t('Cards') : t('List')}
                  </button>
                ))}
              </div>
            </div>
            <div
              role="group"
              aria-label={t('Work filters')}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                padding: '0 20px 16px',
              }}
            >
              {TASK_TODAY_SECTIONS.map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-controls="today-work-panel"
                  aria-pressed={section === key}
                  disabled={isBusy}
                  onClick={() => void load(key)}
                  style={{
                    fontFamily: 'inherit',
                    fontSize: 12,
                    padding: '7px 10px',
                    borderRadius: 6,
                    border:
                      section === key
                        ? `1px solid ${TASK_TOKENS.borderStrong}`
                        : '1px solid transparent',
                    boxShadow: 'none',
                    transform:
                      section === key && isMotionEnabled
                        ? 'translateY(-2px)'
                        : 'translateY(0)',
                    transition: isMotionEnabled
                      ? 'transform 200ms ease, box-shadow 200ms ease'
                      : 'none',
                    cursor: isBusy ? 'default' : 'pointer',
                    color:
                      section === key
                        ? TASK_TOKENS.textPrimary
                        : TASK_TOKENS.textSecondary,
                    background:
                      section === key
                        ? `color-mix(in srgb, ${TASK_TOKENS.background} 78%, #bae6fd)`
                        : TASK_TOKENS.backgroundSecondary,
                  }}
                >
                  {readSectionLabel(key)}
                  {data && (
                    <span
                      style={{
                        marginLeft: 6,
                        fontVariantNumeric: 'tabular-nums',
                        opacity: 0.7,
                      }}
                    >
                      {' '}
                      {data.counts[key]}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div
              role="region"
              id="today-work-panel"
              aria-label={readSectionLabel(section)}
              aria-busy={isLoading}
            >
              <p
                style={{
                  margin: 0,
                  padding: '12px 20px',
                  background: TASK_TOKENS.backgroundSecondary,
                  borderTop: `1px solid ${TASK_TOKENS.borderLight}`,
                  color: TASK_TOKENS.textSecondary,
                  fontSize: 12,
                }}
              >
                {readSectionDescription(section)}
              </p>
              {!hasCurrentData ? (
                isLoading ? (
                  <TaskTodayWorkSkeleton
                    isDeskView={isDeskView}
                    isMobile={isMobile}
                  />
                ) : (
                  <p
                    style={{
                      padding: 20,
                      color: TASK_TOKENS.textSecondary,
                    }}
                  >
                    {t('Your work could not be loaded. Try again.')}
                  </p>
                )
              ) : data.issues.length === 0 ? (
                <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                  <div style={{ marginBottom: 18 }}>
                    <TaskTodayEmblem
                      color="#818cf8"
                      isMotionEnabled={isMotionEnabled}
                      size={40}
                    />
                  </div>
                  <p style={{ margin: 0, fontWeight: 500, lineHeight: 1.6 }}>
                    {data.hasMember
                      ? readEmptyMessage(section)
                      : t('Sign in as a workspace member to see your day.')}
                  </p>
                  <p
                    style={{
                      margin: '8px 0 0',
                      color: TASK_TOKENS.textTertiary,
                      fontSize: 12,
                    }}
                  >
                    {t('Only work you have access to appears here.')}
                  </p>
                </div>
              ) : (
                <ul
                  style={getTaskTodayWorkGridStyle({
                    isDeskView,
                    isMobile,
                  })}
                >
                  {data.issues.map((issue, position) => (
                    <TaskTodayIssueRow
                      key={issue.id}
                      issue={issue}
                      data={data}
                      baseUrl={baseUrl}
                      isMobile={isMobile}
                      isDisabled={isBusy}
                      isSaving={busyIssueId === issue.id}
                      isMotionEnabled={isMotionEnabled}
                      isDeskView={isDeskView}
                      position={position}
                      isDeparting={departingIssueId === issue.id}
                      isFocused={focusedIssue?.id === issue.id}
                      onFocusIssue={() => selectFocusIssue(issue)}
                      onChangeStatus={(issueId, statusId) =>
                        void updateStatus(issueId, statusId)
                      }
                    />
                  ))}
                </ul>
              )}
              {hasCurrentData && data.hasNextPage && (
                <div
                  style={{
                    padding: 16,
                    textAlign: 'center',
                    borderTop: `1px solid ${TASK_TOKENS.borderLight}`,
                  }}
                >
                  <TaskButton
                    onClick={() => void load(section, data.endCursor)}
                    isDisabled={isBusy}
                  >
                    {isLoading ? t('Loading…') : t('Load more')}
                  </TaskButton>
                </div>
              )}
            </div>{' '}
          </section>

          <div
            style={{
              display: 'grid',
              order: isMobile && isFocusMode ? -1 : undefined,
              gap: 20,
              minWidth: 0,
              ...entranceStyle(200),
            }}
          >
            <TaskTodayFocus
              issue={focusedIssue}
              isMotionEnabled={isMotionEnabled}
              onComplete={celebrateSession}
            />
            <aside
              aria-label={t('Your inbox')}
              {...inboxSurface.handlers}
              style={{
                ...PANEL_STYLE,
                display: isFocusMode ? 'none' : 'block',
                borderRadius: 20,
                background: `${inboxSurface.glow}, ${TASK_TOKENS.background}`,
                transform: inboxSurface.transform,
                transition: inboxSurface.transition,
                boxShadow: inboxSurface.isActive
                  ? '0 12px 25px rgba(24,24,27,.08)'
                  : '0 4px 20px rgba(24,24,27,.03)',
              }}
            >
              <div
                style={{
                  padding: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  borderBottom: `1px solid ${TASK_TOKENS.borderLight}`,
                }}
              >
                <TaskTodayEmblem
                  icon={IconBell}
                  color="#818cf8"
                  isMotionEnabled={isMotionEnabled}
                  size={20}
                />
                <h2
                  style={{ fontSize: 16, fontWeight: 600, margin: 0, flex: 1 }}
                >
                  {t('Your inbox')}
                </h2>
                {data && (
                  <span
                    aria-label={t('Unread messages')}
                    style={{
                      fontSize: 12,
                      color: TASK_TOKENS.accent,
                      background: TASK_TOKENS.accentSoft,
                      padding: '3px 7px',
                      borderRadius: 5,
                    }}
                  >
                    {data.unreadCount}
                  </span>
                )}
              </div>
              {!data ? (
                isLoading ? (
                  <div style={{ padding: 20 }}>
                    <TaskSkeletonBar width="85%" />
                    <TaskSkeletonBar width="60%" style={{ marginTop: 10 }} />
                  </div>
                ) : (
                  <p style={{ padding: 20, color: TASK_TOKENS.textSecondary }}>
                    {t('Your inbox could not be loaded. Try again.')}
                  </p>
                )
              ) : data.notifications.length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                  <IconCheck
                    size={22}
                    style={{ color: readTagColor('green').text }}
                  />
                  <p style={{ margin: '10px 0 0', fontWeight: 500 }}>
                    {t('You’re all caught up.')}
                  </p>
                  <p
                    style={{
                      color: TASK_TOKENS.textTertiary,
                      fontSize: 12,
                      lineHeight: 1.6,
                      margin: '6px 0 0',
                    }}
                  >
                    {t('New mentions and replies will appear here.')}
                  </p>
                </div>
              ) : (
                <ul style={{ margin: 0, padding: 0 }}>
                  {data.notifications.map((notification) => (
                    <li
                      key={notification.id}
                      style={{
                        listStyle: 'none',
                        padding: '16px 20px',
                        borderBottom: `1px solid ${TASK_TOKENS.borderLight}`,
                      }}
                    >
                      <a
                        href={buildIssueCommentUrl({
                          baseUrl,
                          issueId: notification.issueId,
                          commentId: notification.commentId,
                        })}
                        style={{
                          display: 'block',
                          color: TASK_TOKENS.textPrimary,
                          textDecoration: 'none',
                          lineHeight: 1.65,
                          overflowWrap: 'anywhere',
                        }}
                      >
                        {stripTaskMentionMarkup(notification.body) ||
                          t('Open discussion message')}{' '}
                        <IconArrowUpRight
                          size={12}
                          style={{ color: TASK_TOKENS.textTertiary }}
                        />
                      </a>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 8,
                          marginTop: 10,
                        }}
                      >
                        <time
                          dateTime={notification.createdAt}
                          style={{
                            color: TASK_TOKENS.textTertiary,
                            fontSize: 11,
                          }}
                        >
                          {new Date(notification.createdAt).toLocaleDateString(
                            undefined,
                            { month: 'short', day: 'numeric' },
                          )}
                        </time>
                        <TaskButton
                          title={t('Mark as read')}
                          size="small"
                          variant="ghost"
                          isDisabled={isBusy}
                          onClick={() => void markRead(notification.id)}
                        >
                          <IconCheck size={13} />
                          {busyNotificationId === notification.id
                            ? t('Saving…')
                            : t('Mark as read')}
                        </TaskButton>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {data && data.unreadCount > data.notifications.length && (
                <p
                  style={{
                    color: TASK_TOKENS.textTertiary,
                    fontSize: 12,
                    margin: 0,
                    padding: 16,
                    lineHeight: 1.6,
                  }}
                >
                  {t(
                    'Showing your latest unread messages. Mark them as read to see more.',
                  )}
                </p>
              )}
            </aside>
          </div>
        </div>
        <p
          style={{
            textAlign: 'center',
            color: TASK_TOKENS.textTertiary,
            fontSize: 11,
            margin: '24px 0 0',
          }}
        >
          {t('One thing at a time. You’ve got this.')}
        </p>
      </div>
    </main>
  );
};
