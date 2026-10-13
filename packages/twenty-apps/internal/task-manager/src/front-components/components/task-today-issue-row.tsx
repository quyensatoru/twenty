import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconCheck, IconEye, IconFocusCentered } from 'twenty-ui/icon';

import { ISSUE_PRIORITY_OPTIONS } from '../../constants/issue-priority-options';
import { type TaskTodayData } from '../../types/task-today';
import { type IssueRow } from '../../types/task-manager-rows';
import { readRichTextPlainValue } from '../../utils/read-rich-text-plain-value.util';
import { useTodaySurface } from '../hooks/use-today-surface';
import { buildRecordUrl } from '../utils/build-record-url.util';
import { toDateInputValue } from '../utils/sprint-dates.util';
import { TaskBoardSelect } from './task-board-select';
import { TaskRichTextPreview } from './task-rich-text-preview';
import { getTaskTodayPaperColor } from './task-today-work-layout';
import { readTagColor, TASK_TOKENS } from './task-tokens';

type TaskTodayIssueRowProps = {
  issue: IssueRow;
  data: TaskTodayData;
  baseUrl: string | undefined;
  isMobile: boolean;
  isDisabled: boolean;
  isSaving: boolean;
  isMotionEnabled: boolean;
  isFocused: boolean;
  isDeparting: boolean;
  isDeskView: boolean;
  position: number;
  onFocusIssue: () => void;
  onChangeStatus: (issueId: string, statusId: string) => void;
};

const ACTION_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '7px 9px',
  borderRadius: 7,
  border: `1px solid ${TASK_TOKENS.border}`,
  background: 'transparent',
  color: TASK_TOKENS.textSecondary,
  fontFamily: 'inherit',
  fontSize: 11,
  cursor: 'pointer',
  textDecoration: 'none',
};

export const TaskTodayIssueRow = ({
  issue,
  data,
  baseUrl,
  isMobile,
  isDisabled,
  isSaving,
  isMotionEnabled,
  isFocused,
  isDeparting,
  isDeskView,
  position,
  onFocusIssue,
  onChangeStatus,
}: TaskTodayIssueRowProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const hasFlipped = useRef(false);
  const peekButton = useRef<HTMLButtonElement>(null);
  const returnButton = useRef<HTMLButtonElement>(null);
  const surface = useTodaySurface(
    isMotionEnabled && !isMobile,
    isDeskView ? 7 : 2,
  );
  const project = data.projects.find(
    (candidate) => candidate.id === issue.projectId,
  );
  const status = data.issueStatuses.find(
    (candidate) => candidate.id === issue.statusId,
  );
  const projectStatuses = data.issueStatuses.filter(
    (candidate) => candidate.projectId === issue.projectId,
  );
  const doneStatus = projectStatuses.find(
    (candidate) => candidate.category === 'DONE',
  );
  const priority = ISSUE_PRIORITY_OPTIONS.find(
    (option) => option.value === issue.priority,
  );
  const isOverdue =
    status?.category !== 'DONE' &&
    typeof issue.dueDate === 'string' &&
    toDateInputValue(issue.dueDate) < data.day;
  const issueLabel = issue.issueKey || issue.title || t('Issue');
  const href = buildRecordUrl({
    baseUrl,
    objectNameSingular: 'issue',
    recordId: issue.id,
  });
  const description = readRichTextPlainValue(issue.description);

  useEffect(() => {
    if (!hasFlipped.current) return;
    const timeout = setTimeout(
      () => (isFlipped ? returnButton : peekButton).current?.focus(),
      isMotionEnabled ? 620 : 0,
    );
    return () => clearTimeout(timeout);
  }, [isFlipped, isMotionEnabled]);

  const flip = () => {
    hasFlipped.current = true;
    setIsFlipped((previous) => !previous);
  };
  const faceStyle: CSSProperties = {
    boxSizing: 'border-box',
    padding: isDeskView ? 20 : 16,
    borderRadius: isDeskView ? 14 : 10,
    border: `1px solid ${isFocused ? TASK_TOKENS.borderInverted : TASK_TOKENS.borderStrong}`,
    background: TASK_TOKENS.background,
    backfaceVisibility: 'hidden',
  };
  const statusControl =
    project?.canWrite && projectStatuses.length > 0 ? (
      <TaskBoardSelect
        value={issue.statusId ?? ''}
        options={projectStatuses.map((candidate) => ({
          value: candidate.id,
          label: candidate.name || t('Status'),
          color: candidate.color,
        }))}
        onChange={(statusId) => onChangeStatus(issue.id, statusId)}
        ariaLabel={`${t('Change status')}: ${issueLabel}`}
        placeholder={t('No status')}
        isDisabled={isDisabled || isFlipped}
        width="100%"
      />
    ) : (
      <span style={{ color: TASK_TOKENS.textSecondary, fontSize: 11 }}>
        {status?.name || t('No status')}
      </span>
    );

  return (
    <li
      {...surface.handlers}
      style={{
        position: 'relative',
        listStyle: 'none',
        minWidth: 0,
        perspective: '1100px',
        zIndex: surface.isActive || isFocused ? 2 : 1,
        transform:
          isDeparting && isMotionEnabled
            ? 'translateY(-24px) scale(.9)'
            : 'translateY(0) scale(1)',
        opacity: isDeparting && isMotionEnabled ? 0 : 1,
        transition: isMotionEnabled
          ? 'transform 480ms cubic-bezier(.4,0,.2,1), opacity 400ms ease 100ms'
          : 'none',
      }}
    >
      {isDeskView &&
        [1, 2].map((layer) => (
          <div
            key={layer}
            aria-hidden="true"
            style={{
              position: 'absolute',
              zIndex: 2 - layer,
              inset: 0,
              borderRadius: 14,
              border: `1px solid ${TASK_TOKENS.borderStrong}`,
              background: getTaskTodayPaperColor(layer),
              transform: `translate3d(${layer * 2}px,${layer * 5}px,-${layer * 4}px) rotate(${(position % 2 ? -1 : 1) * layer * (surface.isActive ? 1.3 : 0.65)}deg)`,
              transition: isMotionEnabled
                ? 'transform 420ms cubic-bezier(.22,1,.36,1)'
                : 'none',
              boxShadow: layer === 2 ? '0 5px 10px rgba(30,30,30,.06)' : 'none',
            }}
          />
        ))}
      <div
        style={{
          position: 'relative',
          zIndex: 3,
          transformStyle: 'preserve-3d',
          transform:
            isDeparting && isMotionEnabled
              ? 'rotateX(68deg) translateZ(-40px)'
              : surface.transform,
          transition: isMotionEnabled
            ? 'transform 480ms cubic-bezier(.22,1,.36,1)'
            : 'none',
        }}
      >
        <div
          style={{
            position: 'relative',
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: isMotionEnabled
              ? 'transform 600ms cubic-bezier(.22,1,.36,1)'
              : 'none',
            minHeight: isDeskView ? 276 : 208,
          }}
        >
          <div
            aria-hidden={isFlipped}
            style={{
              ...faceStyle,
              pointerEvents: isFlipped ? 'none' : 'auto',
              position: 'relative',
              minHeight: isDeskView ? 276 : 208,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: surface.isActive
                ? '0 22px 30px -16px rgba(24,24,27,.28), 0 3px 8px rgba(24,24,27,.08)'
                : '0 3px 7px rgba(24,24,27,.04)',
              transition: surface.transition,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                marginBottom: 18,
                transform: 'translateZ(12px)',
              }}
            >
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: 10,
                  letterSpacing: '.5px',
                  color: TASK_TOKENS.textSecondary,
                }}
              >
                {issue.issueKey || t('Issue')}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: isFocused
                    ? TASK_TOKENS.textPrimary
                    : TASK_TOKENS.textTertiary,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                }}
              >
                {isDeparting
                  ? t('Done')
                  : isFocused
                    ? t('In focus')
                    : `${(position + 1).toString().padStart(2, '0')}`}
              </span>
            </div>
            <a
              href={href}
              tabIndex={isFlipped ? -1 : 0}
              style={{
                display: 'block',
                fontSize: isDeskView ? 18 : 15,
                fontWeight: 600,
                lineHeight: 1.45,
                letterSpacing: '-.4px',
                color: TASK_TOKENS.textPrimary,
                textDecoration: 'none',
                overflowWrap: 'anywhere',
                transform:
                  isMotionEnabled && surface.isActive
                    ? 'translateZ(22px)'
                    : 'translateZ(0)',
                transition: surface.transition,
              }}
            >
              {issue.title || t('Untitled issue')}
            </a>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                marginTop: 12,
                marginBottom: 18,
                color: TASK_TOKENS.textSecondary,
                fontSize: 11,
                lineHeight: 1.6,
              }}
            >
              <span>{project?.name || t('Project')}</span>
              {priority && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      background: readTagColor(priority.color).text,
                    }}
                  />
                  {t(priority.label)}
                </span>
              )}
              {issue.dueDate && (
                <span
                  style={{
                    color: isOverdue
                      ? TASK_TOKENS.textDanger
                      : TASK_TOKENS.textSecondary,
                  }}
                >
                  {isOverdue ? t('Overdue') : t('Due')} ·{' '}
                  {new Date(issue.dueDate).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>
            <div
              style={{
                marginTop: 'auto',
                position: 'relative',
                transform: 'translateZ(8px)',
              }}
            >
              <div
                style={{
                  maxWidth: isDeskView ? undefined : 180,
                  marginBottom: 14,
                }}
              >
                {statusControl}
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  flexWrap: 'wrap',
                  borderTop: `1px solid ${TASK_TOKENS.borderLight}`,
                  paddingTop: 12,
                }}
              >
                <button
                  ref={peekButton}
                  disabled={isFlipped}
                  type="button"
                  onClick={flip}
                  aria-label={`${t('Peek at')}: ${issueLabel}`}
                  style={ACTION_STYLE}
                >
                  <IconEye tabIndex={-1} size={13} />
                  {t('Peek')}
                </button>
                <button
                  type="button"
                  onClick={onFocusIssue}
                  disabled={isFlipped}
                  aria-pressed={isFocused}
                  aria-label={`${t('Focus on')}: ${issueLabel}`}
                  style={{
                    ...ACTION_STYLE,
                    background: isFocused
                      ? TASK_TOKENS.backgroundTertiary
                      : 'transparent',
                    color: isFocused
                      ? TASK_TOKENS.textPrimary
                      : TASK_TOKENS.textSecondary,
                  }}
                >
                  <IconFocusCentered tabIndex={-1} size={13} />
                  {isFocused ? t('In your focus') : t('Focus')}
                </button>
                {project?.canWrite &&
                  doneStatus &&
                  status?.category !== 'DONE' && (
                    <button
                      type="button"
                      disabled={isDisabled || isFlipped}
                      aria-label={`${t('Complete')}: ${issueLabel}`}
                      onClick={() => onChangeStatus(issue.id, doneStatus.id)}
                      style={{
                        ...ACTION_STYLE,
                        color: TASK_TOKENS.textPrimary,
                        marginLeft: 'auto',
                        cursor: isDisabled ? 'default' : 'pointer',
                        opacity: isDisabled ? 0.5 : 1,
                      }}
                    >
                      <IconCheck tabIndex={-1} size={13} />
                      {t('Done')}
                    </button>
                  )}
              </div>
            </div>
            {isSaving && (
              <span
                role="status"
                style={{
                  fontSize: 10,
                  color: TASK_TOKENS.textSecondary,
                  marginTop: 8,
                }}
              >
                {t('Saving…')}
              </span>
            )}
          </div>
          <div
            aria-hidden={!isFlipped}
            style={{
              ...faceStyle,
              pointerEvents: isFlipped ? 'auto' : 'none',
              position: 'absolute',
              inset: 0,
              transform: 'rotateY(180deg)',
              display: 'flex',
              flexDirection: 'column',
              background: `color-mix(in srgb, ${TASK_TOKENS.background} 96%, #b9b1a5)`,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
                gap: 8,
              }}
            >
              <span
                style={{
                  fontFamily: 'monospace',
                  color: TASK_TOKENS.textSecondary,
                  fontSize: 10,
                }}
              >
                {issue.issueKey}
              </span>
              <button
                ref={returnButton}
                disabled={!isFlipped}
                type="button"
                onClick={flip}
                aria-label={`${t('Turn back')}: ${issueLabel}`}
                style={ACTION_STYLE}
              >
                {t('Turn back')}
              </button>
            </div>
            <h3
              style={{
                fontSize: 15,
                lineHeight: 1.5,
                margin: '0 0 10px',
                color: TASK_TOKENS.textPrimary,
              }}
            >
              {t('Task brief')}
            </h3>
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                fontSize: 12,
                lineHeight: 1.7,
                color: TASK_TOKENS.textSecondary,
              }}
            >
              {description ? (
                isFlipped && <TaskRichTextPreview value={description} />
              ) : (
                <>
                  <p style={{ margin: '0 0 10px' }}>
                    {t('No description yet. Open the task to add the details.')}
                  </p>
                  <p style={{ margin: 0 }}>
                    {project?.name} · {status?.name || t('No status')}
                  </p>
                  {issue.storyPoints != null && (
                    <p>
                      {t('{points} story points', {
                        points: issue.storyPoints,
                      })}
                    </p>
                  )}
                  {issue.labels?.length ? (
                    <p>{issue.labels.join(' · ')}</p>
                  ) : null}
                </>
              )}
            </div>
            <a
              href={href}
              tabIndex={isFlipped ? 0 : -1}
              style={{
                ...ACTION_STYLE,
                alignSelf: 'flex-start',
                marginTop: 14,
                color: TASK_TOKENS.textPrimary,
              }}
            >
              {t('Open task')}
            </a>
          </div>
        </div>
      </div>
    </li>
  );
};
