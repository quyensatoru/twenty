import { useCallback, useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import {
  IconBell,
  IconCheck,
  IconFocusCentered,
  IconRefresh,
} from 'twenty-ui/icon';

import { TASK_TODAY_SECTIONS } from '../../constants/task-today';
import { type IssueRow } from '../../types/task-manager-rows';
import {
  type TaskTodayData,
  type TaskTodaySection,
} from '../../types/task-today';
import { toDateInputValue } from '../utils/sprint-dates.util';
import { useIsMobile } from '../hooks/use-is-mobile';
import { usePersonalBoardPreferences } from '../hooks/use-personal-board-preferences';
import { useTaskToday } from '../hooks/use-task-today';
import { useTodayMotion } from '../hooks/use-today-motion';
import {
  buildIssueCommentUrl,
  buildRecordUrl,
} from '../utils/build-record-url.util';
import { pickTaskTodaySuggestion } from '../utils/pick-task-today-suggestion.util';
import { readRecordPageBaseUrl } from '../utils/read-record-page-base-url.util';
import { stripTaskMentionMarkup } from '../utils/task-mention-markdown.util';
import { TaskActionMenu } from './task-action-menu';
import { TaskButton } from './task-button';
import { TaskIconButton } from './task-icon-button';
import { TaskSkeletonBar } from './task-skeleton';
import { TaskTodayCelebration } from './task-today-celebration';
import { TaskTodayFocus } from './task-today-focus';
import { TaskTodayIssueRow } from './task-today-issue-row';
import { TaskTodayListRow } from './task-today-list-row';
import {
  getTaskTodayWorkGridStyle,
  TaskTodayWorkSkeleton,
} from './task-today-work-layout';
import {
  readTagColor,
  TASK_CIRCLE_STYLE,
  TASK_THIN_SCROLLBAR_STYLE,
  TASK_TOKENS,
} from './task-tokens';
import { TaskToolbarToggle } from './task-toolbar';

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

type TaskTodayUrgentSection = Extract<TaskTodaySection, 'overdue' | 'today'>;

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
  const { isMotionEnabled, toggleMotion: toggleLocalMotion } = useTodayMotion(
    data?.memberId,
    preferences.effectsEnabled,
  );
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

  // The last Overdue and Due today lists stay known after switching tabs, so
  // the headline can still say what to start with from Next 7 days.
  const [urgentSources, setUrgentSources] = useState<
    Partial<Record<TaskTodayUrgentSection, TaskTodayData>>
  >({});
  if (
    data !== null &&
    (data.section === 'overdue' || data.section === 'today') &&
    urgentSources[data.section] !== data
  ) {
    setUrgentSources((previous) => ({ ...previous, [data.section]: data }));
  }

  const isDeskView = preferences.workView === 'desk';
  const [departingIssueId, setDepartingIssueId] = useState<string | null>(null);
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
      setUrgentSources((previous) =>
        Object.fromEntries(
          Object.entries(previous).map(([key, source]) => [
            key,
            {
              ...source,
              issues: source.issues.filter((issue) => issue.id !== issueId),
            },
          ]),
        ),
      );
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

  const urgentCount = (data?.counts.overdue ?? 0) + (data?.counts.today ?? 0);
  const headline =
    data === null
      ? t('Your day')
      : urgentCount === 0
        ? t('Nothing is overdue or due today')
        : urgentCount === 1
          ? t('1 issue needs you today')
          : t('{count} issues need you today', { count: urgentCount });
  const suggestionSources =
    data === null
      ? []
      : [data, urgentSources.overdue, urgentSources.today].filter(
          (source): source is TaskTodayData =>
            source !== undefined && source.day === data.day,
        );
  const suggestion =
    data === null || urgentCount === 0
      ? null
      : pickTaskTodaySuggestion({
          // The current list comes first, so its fresher copy of an issue wins.
          issues: suggestionSources
            .flatMap((source) => source.issues)
            .filter(
              (issue, index, issues) =>
                issues.findIndex((candidate) => candidate.id === issue.id) ===
                index,
            ),
          issueStatuses: suggestionSources.flatMap(
            (source) => source.issueStatuses,
          ),
          day: data.day,
        });
  const suggestionKey =
    suggestion === null
      ? ''
      : suggestion.issue.issueKey || suggestion.issue.title || t('Issue');
  const suggestionSentence =
    suggestion === null
      ? ''
      : suggestion.reason === 'overdue'
        ? t('Start with {issueKey}, it is the most overdue.', {
            issueKey: suggestionKey,
          })
        : t('Start with {issueKey}, it is due today.', {
            issueKey: suggestionKey,
          });
  // Split around the key so the translated sentence stays whole while the key
  // itself opens the issue.
  const suggestionKeyIndex = suggestionSentence.indexOf(suggestionKey);
  const firstOpenIssue = hasCurrentData
    ? data.issues.find(
        (issue) =>
          data.issueStatuses.find((status) => status.id === issue.statusId)
            ?.category !== 'DONE',
      )
    : undefined;
  const hasOpenIssue =
    data?.issues.some(
      (issue) =>
        data.issueStatuses.find((status) => status.id === issue.statusId)
          ?.category !== 'DONE',
    ) === true;

  const statTabs = (
    <div
      role="tablist"
      aria-label={t('Work filters')}
      style={{
        borderBottom: `1px solid ${TASK_TOKENS.border}`,
        display: 'flex',
        flexShrink: 0,
        gap: 2,
        overflowX: 'auto',
        padding: isMobile ? '0 8px' : '0 16px',
        ...TASK_THIN_SCROLLBAR_STYLE,
      }}
    >
      {TASK_TODAY_SECTIONS.map((key) => {
        const isSelected = section === key;
        const count = data?.counts[key];
        const isAlert = key === 'overdue' && (count ?? 0) > 0;

        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-controls="today-work-panel"
            disabled={isBusy}
            onClick={() => void load(key)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${isSelected ? TASK_TOKENS.textPrimary : 'transparent'}`,
              cursor: isBusy ? 'default' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
              fontFamily: 'inherit',
              gap: 2,
              minWidth: isMobile ? 76 : 96,
              padding: '8px 10px 9px 10px',
              textAlign: 'left',
            }}
          >
            <span
              style={{
                color: isAlert
                  ? TASK_TOKENS.textDanger
                  : isSelected
                    ? TASK_TOKENS.textPrimary
                    : TASK_TOKENS.textSecondary,
                fontSize: 18,
                fontVariantNumeric: 'tabular-nums',
                fontWeight: 600,
                lineHeight: '24px',
              }}
            >
              {count === undefined ? (
                <TaskSkeletonBar width={22} height={18} />
              ) : (
                count
              )}
            </span>
            <span
              style={{
                color: isSelected
                  ? TASK_TOKENS.textPrimary
                  : TASK_TOKENS.textTertiary,
                fontSize: 12,
                whiteSpace: 'nowrap',
              }}
            >
              {readSectionLabel(key)}
            </span>
          </button>
        );
      })}
    </div>
  );

  const workList = !hasCurrentData ? (
    isLoading ? (
      <TaskTodayWorkSkeleton isDeskView={isDeskView} isMobile={isMobile} />
    ) : (
      <p style={{ color: TASK_TOKENS.textSecondary, margin: 0, padding: 20 }}>
        {t('Your work could not be loaded. Try again.')}
      </p>
    )
  ) : data.issues.length === 0 ? (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: '48px 24px',
        textAlign: 'center',
      }}
    >
      <IconCheck size={20} color={readTagColor('green').text} />
      <p style={{ fontWeight: 500, margin: 0 }}>
        {data.hasMember
          ? readEmptyMessage(section)
          : t('Sign in as a workspace member to see your day.')}
      </p>
      <p style={{ color: TASK_TOKENS.textTertiary, fontSize: 12, margin: 0 }}>
        {readSectionDescription(section)}
      </p>
    </div>
  ) : isDeskView ? (
    <ul style={getTaskTodayWorkGridStyle({ isDeskView, isMobile })}>
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
  ) : (
    <ul style={{ margin: 0, padding: 0 }}>
      {data.issues.map((issue) => (
        <TaskTodayListRow
          key={issue.id}
          issue={issue}
          data={data}
          baseUrl={baseUrl}
          isMobile={isMobile}
          isDisabled={isBusy}
          isSaving={busyIssueId === issue.id}
          isDeparting={departingIssueId === issue.id}
          isFocused={focusedIssue?.id === issue.id}
          onFocusIssue={() => selectFocusIssue(issue)}
          onChangeStatus={(issueId, statusId) =>
            void updateStatus(issueId, statusId)
          }
        />
      ))}
    </ul>
  );

  const inbox = (
    <section
      aria-label={t('Your inbox')}
      style={{
        background: TASK_TOKENS.background,
        border: `1px solid ${TASK_TOKENS.border}`,
        borderRadius: TASK_TOKENS.radius,
        display: isFocusMode ? 'none' : 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: 6,
          padding: '12px 14px 8px',
        }}
      >
        <IconBell size={14} color={TASK_TOKENS.textTertiary} />
        <h2 style={{ flex: 1, fontSize: 13, fontWeight: 600, margin: 0 }}>
          {t('Mentions and replies')}
        </h2>
        {data !== null && data.unreadCount > 0 && (
          <span
            aria-label={t('Unread messages')}
            style={{
              background: TASK_TOKENS.accentSoft,
              borderRadius: TASK_TOKENS.radiusExtraSmall,
              color: TASK_TOKENS.accent,
              fontSize: 11,
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 600,
              padding: '1px 6px',
            }}
          >
            {data.unreadCount}
          </span>
        )}
      </div>
      {data === null ? (
        isLoading ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              padding: '4px 14px 14px',
            }}
          >
            <TaskSkeletonBar width="85%" />
            <TaskSkeletonBar width="60%" />
          </div>
        ) : (
          <p
            style={{
              color: TASK_TOKENS.textSecondary,
              margin: 0,
              padding: '4px 14px 14px',
            }}
          >
            {t('Your inbox could not be loaded. Try again.')}
          </p>
        )
      ) : data.notifications.length === 0 ? (
        <p
          style={{
            color: TASK_TOKENS.textTertiary,
            fontSize: 12,
            margin: 0,
            padding: '2px 14px 14px',
          }}
        >
          {t('You’re all caught up.')}
        </p>
      ) : (
        <ul style={{ margin: 0, padding: 0 }}>
          {data.notifications.map((notification) => (
            <li
              key={notification.id}
              style={{
                alignItems: 'flex-start',
                borderTop: `1px solid ${TASK_TOKENS.borderLight}`,
                display: 'flex',
                gap: 8,
                listStyle: 'none',
                padding: '10px 14px',
              }}
            >
              <span
                style={{
                  ...TASK_CIRCLE_STYLE,
                  background: TASK_TOKENS.accent,
                  flexShrink: 0,
                  height: 6,
                  marginTop: 6,
                  width: 6,
                }}
              />
              <div
                style={{
                  display: 'flex',
                  flex: 1,
                  flexDirection: 'column',
                  gap: 4,
                  minWidth: 0,
                }}
              >
                <a
                  href={buildIssueCommentUrl({
                    baseUrl,
                    issueId: notification.issueId,
                    commentId: notification.commentId,
                  })}
                  style={{
                    color: TASK_TOKENS.textPrimary,
                    display: '-webkit-box',
                    fontSize: 12.5,
                    lineHeight: 1.5,
                    overflow: 'hidden',
                    overflowWrap: 'anywhere',
                    textDecoration: 'none',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 2,
                  }}
                >
                  {stripTaskMentionMarkup(notification.body) ||
                    t('Open discussion message')}
                </a>
                <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
                  <time
                    dateTime={notification.createdAt}
                    style={{
                      color: TASK_TOKENS.textTertiary,
                      flex: 1,
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
              </div>
            </li>
          ))}
        </ul>
      )}
      {data !== null && data.unreadCount > data.notifications.length && (
        <p
          style={{
            borderTop: `1px solid ${TASK_TOKENS.borderLight}`,
            color: TASK_TOKENS.textTertiary,
            fontSize: 11.5,
            lineHeight: 1.5,
            margin: 0,
            padding: '10px 14px',
          }}
        >
          {t(
            'Showing your latest unread messages. Mark them as read to see more.',
          )}
        </p>
      )}
    </section>
  );

  return (
    <main
      style={{
        background: TASK_TOKENS.background,
        boxSizing: 'border-box',
        color: TASK_TOKENS.textPrimary,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: TASK_TOKENS.fontFamily,
        fontSize: 13,
        height: '100%',
        minHeight: 0,
      }}
    >
      {celebration && (
        <TaskTodayCelebration
          key={celebration.id}
          message={celebration.message}
          isMotionEnabled={isMotionEnabled}
          onDismiss={dismissCelebration}
        />
      )}
      <header
        style={{
          alignItems: 'center',
          borderBottom: `1px solid ${TASK_TOKENS.border}`,
          boxSizing: 'border-box',
          display: 'flex',
          flexShrink: 0,
          gap: 8,
          minHeight: 48,
          padding: isMobile ? '0 8px 0 12px' : '0 12px 0 20px',
        }}
      >
        <h1 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
          {t('My work')}
        </h1>
        {!isMobile && (
          <span style={{ color: TASK_TOKENS.textTertiary }}>{dateLabel}</span>
        )}
        <span style={{ flex: 1 }} />
        <TaskIconButton
          label={t('Refresh')}
          isDisabled={isBusy}
          onClick={() => void load(section)}
        >
          <IconRefresh size={15} />
        </TaskIconButton>
        <TaskToolbarToggle
          label={isFocusMode ? t('Exit focus mode') : t('Focus mode')}
          isActive={isFocusMode}
          onClick={() => setIsFocusMode((previous) => !previous)}
        >
          <IconFocusCentered size={16} />
        </TaskToolbarToggle>
        <TaskActionMenu
          label={t('Display options')}
          items={[
            {
              key: 'list',
              label: t('Show as list'),
              isSelected: !isDeskView,
              onSelect: () => void savePreferences({ workView: 'list' }),
            },
            {
              key: 'cards',
              label: t('Show as cards'),
              isSelected: isDeskView,
              onSelect: () => void savePreferences({ workView: 'desk' }),
            },
            {
              key: 'effects',
              label: isMotionEnabled
                ? t('Turn effects off')
                : t('Turn effects on'),
              onSelect: toggleMotion,
            },
            ...(hasOpenIssue && !isBusy
              ? [
                  {
                    key: 'shuffle',
                    label: t('Shuffle a task into focus'),
                    onSelect: shuffleTask,
                  },
                ]
              : []),
            {
              key: 'vibes',
              label: t('Good vibes'),
              onSelect: () =>
                setCelebration({
                  id: Date.now(),
                  message: t('A little good energy. Keep going.'),
                }),
            },
          ]}
        />
      </header>

      <div
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: isMobile ? 'column' : 'row',
          minHeight: 0,
          overflowY: isMobile ? 'auto' : 'hidden',
          ...TASK_THIN_SCROLLBAR_STYLE,
        }}
      >
        <section
          aria-label={t('My work')}
          style={{
            display: isFocusMode && isMobile ? 'none' : 'flex',
            flex: 1,
            flexDirection: 'column',
            minHeight: isMobile ? undefined : 0,
            minWidth: 0,
            overflowY: isMobile ? 'visible' : 'auto',
            ...TASK_THIN_SCROLLBAR_STYLE,
          }}
        >
          {!isFocusMode && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                padding: isMobile ? '16px 16px 10px' : '20px 26px 12px',
              }}
            >
              {isMobile && (
                <span style={{ color: TASK_TOKENS.textTertiary, fontSize: 12 }}>
                  {dateLabel}
                </span>
              )}
              <h2
                style={{
                  fontSize: isMobile ? 17 : 20,
                  fontWeight: 600,
                  letterSpacing: -0.2,
                  margin: 0,
                }}
              >
                {headline}
              </h2>
              {suggestion !== null && (
                <p
                  style={{
                    color: TASK_TOKENS.textTertiary,
                    fontSize: 12.5,
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  {suggestionKeyIndex === -1 ? (
                    suggestionSentence
                  ) : (
                    <>
                      {suggestionSentence.slice(0, suggestionKeyIndex)}
                      <a
                        href={buildRecordUrl({
                          baseUrl,
                          objectNameSingular: 'issue',
                          recordId: suggestion.issue.id,
                        })}
                        style={{
                          color: TASK_TOKENS.textSecondary,
                          fontWeight: 500,
                          textDecoration: 'none',
                        }}
                      >
                        {suggestionKey}
                      </a>
                      {suggestionSentence.slice(
                        suggestionKeyIndex + suggestionKey.length,
                      )}
                    </>
                  )}
                </p>
              )}
            </div>
          )}
          {statTabs}
          {preferencesError && (
            <div
              role="alert"
              style={{
                color: TASK_TOKENS.textDanger,
                fontSize: 12,
                padding: '8px 20px',
              }}
            >
              {t('Your preference could not be saved.')} {preferencesError}
            </div>
          )}
          {error && (
            <div
              role="alert"
              style={{
                alignItems: 'center',
                color: TASK_TOKENS.textDanger,
                display: 'flex',
                gap: 12,
                justifyContent: 'space-between',
                padding: '10px 20px',
              }}
            >
              <span>{error}</span>
              <TaskButton
                size="small"
                onClick={() => void load(section)}
                isDisabled={isBusy}
              >
                {t('Retry')}
              </TaskButton>
            </div>
          )}
          <div
            role="region"
            id="today-work-panel"
            aria-label={readSectionLabel(section)}
            aria-busy={isLoading}
          >
            {workList}
            {hasCurrentData && data.hasNextPage && (
              <div style={{ padding: '12px 20px' }}>
                <TaskButton
                  size="small"
                  variant="ghost"
                  onClick={() => void load(section, data.endCursor)}
                  isDisabled={isBusy}
                >
                  {isLoading ? t('Loading…') : t('Load more')}
                </TaskButton>
              </div>
            )}
          </div>
        </section>

        <aside
          style={{
            background: TASK_TOKENS.backgroundSecondary,
            borderLeft: isMobile ? 'none' : `1px solid ${TASK_TOKENS.border}`,
            borderTop: isMobile ? `1px solid ${TASK_TOKENS.border}` : 'none',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            gap: 12,
            order: isMobile && isFocusMode ? -1 : undefined,
            overflowY: isMobile ? 'visible' : 'auto',
            padding: 16,
            width: isMobile ? '100%' : 320,
            ...TASK_THIN_SCROLLBAR_STYLE,
          }}
        >
          <TaskTodayFocus
            issue={focusedIssue}
            fallbackIssue={suggestion?.issue ?? firstOpenIssue ?? null}
            onPickIssue={setFocusedIssue}
            isMotionEnabled={isMotionEnabled}
            onComplete={celebrateSession}
          />
          {inbox}
        </aside>
      </div>
    </main>
  );
};
