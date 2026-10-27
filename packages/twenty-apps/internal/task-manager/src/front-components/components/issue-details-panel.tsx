import { isNonEmptyString } from '@sniptt/guards';
import { Fragment, type ReactNode, useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import {
  IconCalendarEvent,
  IconCalendarRepeat,
  IconChevronDown,
  IconChevronRight,
  IconStack2,
  IconX,
} from 'twenty-ui/icon';

import { ISSUE_PRIORITY_OPTIONS } from '../../constants/issue-priority-options';
import { ISSUE_RESOLUTION_OPTIONS } from '../../constants/issue-resolution-options';
import { ISSUE_TYPE_OPTIONS } from '../../constants/issue-type-options';
import {
  ISSUE_DETAIL_FIELDS,
  type IssueDetailFieldKey,
} from '../../constants/issue-view-fields';
import { type IssueRow } from '../../types/task-manager-rows';
import { readEpicColor } from '../../utils/epic-color.util';
import { formatMinutes } from '../../utils/format-minutes.util';
import { type IssueDetail, type MemberRow } from '../hooks/use-issue-detail';
import { useIssueCrispConversations } from '../hooks/use-issue-crisp-conversations';
import { readDueDateHint } from '../utils/read-due-date-hint.util';
import { readMemberName } from '../utils/read-member-name.util';
import { TaskAvatar } from './task-avatar';
import { IssueTypeGlyph, UnassignedAvatar } from './task-board-card';
import { TaskColorDot } from './task-chip';
import { TaskCrispConversationsField } from './task-crisp-conversations-field';
import { DetailReadButton, LabelPicker } from './task-detail-controls';
import { TaskDueDatePicker } from './task-due-date-picker';
import { TaskFieldsMenu } from './task-fields-menu';
import { SIDEBAR_FIELD_LABEL_WIDTH, TaskFieldRow } from './task-field-row';
import { TaskIconButton } from './task-icon-button';
import { TaskMerchantField } from './task-merchant-field';
import { TaskRecordChip } from './task-record-chip';
import {
  type TaskRelationOption,
  TaskRelationSelect,
} from './task-relation-select';
import { TaskPriorityGlyph } from './task-priority-glyph';
import { readStatusGlyph, TaskStatusIcon } from './task-status-icon';
import { TaskTag } from './task-tag';
import { TaskProjectBadge } from './task-toolbar';
import { TaskTextInput } from './task-text-input';
import { readTagColor, TASK_TOKENS } from './task-tokens';

type IssueDetailsPanelProps = {
  // The issue as the panel should draw it: the caller merges its pending
  // optimistic values in, so a pick shows before the write lands.
  issue: IssueRow;
  detail: IssueDetail;
  onUpdate: (
    body: Record<string, unknown>,
    options?: { refreshBoard?: boolean },
  ) => void;
  onError: (message: string) => void;
  // Saves the project's choice of rows, for everyone on it. Only offered to a
  // role with Manage Views (detail.canManageViews).
  onHiddenFieldsChange: (hiddenDetailFields: IssueDetailFieldKey[]) => void;
  // Shifts every dropdown left of its anchor, so a card opened in a narrow
  // right-hand column stays inside it. The host only clamps to the viewport.
  overlayOffsetX?: number;
  // Opens a related record (project, merchant, epic…) where the host shows
  // records. Left out, relation chips are plain values.
  onOpenRecord?: (objectNameSingular: string, recordId: string) => void;
  onOpenIssue?: (issueId: string) => void;
  onLogWork?: () => void;
};

const NO_VALUE = '';

type DetailField = {
  key: string;
  label: string;
  isShown: boolean;
  // Folded under the section's "N empty fields" line until the reader asks.
  // Status, type and priority never are: every issue has an answer for them.
  isEmpty: boolean;
  node: ReactNode;
};
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const readDueLabel = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string' || value === '') {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const datePart = parsed.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year:
      parsed.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  });
  const hasTime = parsed.getHours() !== 0 || parsed.getMinutes() !== 0;
  const timePart = hasTime
    ? parsed.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(parsed);
  target.setHours(0, 0, 0, 0);
  const deltaDays = Math.round(
    (target.getTime() - today.getTime()) / DAY_IN_MS,
  );

  const relative =
    deltaDays === 0
      ? t('Today')
      : deltaDays === 1
        ? t('Tomorrow')
        : deltaDays === -1
          ? t('Yesterday')
          : null;

  const dated = relative ?? datePart;

  return timePart === null ? dated : `${dated} · ${timePart}`;
};

const isDueOverdue = (value: string | null | undefined): boolean => {
  if (typeof value !== 'string' || value === '') {
    return false;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return parsed.getTime() < today.getTime();
};

// An issue's Details, the same panel in the board's modal and on the issue
// record page: every field of the issue, each editable in place, and a gear
// that lets a role with Manage Views choose which rows the project shows.
//
// Remount it per issue (key={issue.id}): its drafts and open dropdowns
// belong to the issue they were opened on.
export const IssueDetailsPanel = ({
  issue,
  detail,
  onUpdate,
  onError,
  onHiddenFieldsChange,
  overlayOffsetX = -10,
  onOpenRecord,
  onOpenIssue,
  onLogWork,
}: IssueDetailsPanelProps) => {
  // One flag for the whole panel: two fields each holding their own open
  // state means two dropdowns drawn over each other, with neither reachable.
  const [openField, setOpenField] = useState<string | null>(null);
  const [pointsDraft, setPointsDraft] = useState<string | null>(null);
  const [isEditingPoints, setIsEditingPoints] = useState(false);
  const [estimateDraft, setEstimateDraft] = useState<string | null>(null);
  const [isEditingEstimate, setIsEditingEstimate] = useState(false);
  const [isDuePickerOpen, setIsDuePickerOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  // Fields the reader has opened stay drawn even once empty, so clearing a
  // value does not fold its row away under the cursor.
  const [touchedFields, setTouchedFields] = useState<string[]>([]);
  const {
    conversations: crispConversations,
    isLoading: isLoadingConversations,
  } = useIssueCrispConversations(
    issue.id,
    detail.merchants.map((merchant) => merchant.id),
  );

  const isReadOnly = !detail.canWrite;
  // A subtask is planned wherever its parent is, as in Jira: its sprint and
  // epic show the parent's and change only through the parent.
  const isPlanningReadOnly = isReadOnly || typeof issue.parentId === 'string';
  const hiddenFields = detail.issueViewSettings.hiddenDetailFields;
  const isShown = (key: IssueDetailFieldKey) => !hiddenFields.includes(key);

  const membersById = new Map<string, MemberRow>(
    [...detail.members, ...detail.assignableMembers].map((member) => [
      member.id,
      member,
    ]),
  );

  const touchField = (field: string) =>
    setTouchedFields((current) =>
      current.includes(field) ? current : [...current, field],
    );

  const changeOpenField = (field: string, isOpen: boolean) => {
    if (isOpen) {
      touchField(field);
    }

    setOpenField(isOpen ? field : null);
  };

  const buildOpenProps = (field: string) => ({
    isOpen: openField === field,
    onOpenChange: (isOpen: boolean) => changeOpenField(field, isOpen),
    overlayOffsetX,
    isReadOnly,
  });

  const buildOpenRecordProps = (
    objectNameSingular: string,
    recordId: string | null | undefined,
  ) =>
    onOpenRecord === undefined || typeof recordId !== 'string'
      ? {}
      : { onOpenRecord: () => onOpenRecord(objectNameSingular, recordId) };

  const setRelation = (field: string, recordId: string | null) =>
    onUpdate({ data: { [field]: recordId } }, { refreshBoard: true });

  // A member who lost their grant stays on the issues they were already put
  // on. Leaving them out would draw the row empty, which reads as "nobody"
  // rather than "the person here can no longer be picked".
  const buildMemberOptions = (
    currentMemberId: string | null,
  ): TaskRelationOption[] => {
    const options: TaskRelationOption[] = [
      { value: NO_VALUE, label: t('Unassigned'), chip: null },
      ...detail.assignableMembers.map((member) => ({
        value: member.id,
        label:
          `${readMemberName(membersById, member.id, member.id)} ${member.userEmail ?? ''}`.trim(),
        chip: (
          <TaskMemberValue
            name={readMemberName(
              membersById,
              member.id,
              member.userEmail ?? t('Unknown'),
            )}
            avatarUrl={member.avatarUrl}
          />
        ),
      })),
    ];

    if (
      currentMemberId === null ||
      options.some((option) => option.value === currentMemberId)
    ) {
      return options;
    }

    return [
      ...options,
      {
        value: currentMemberId,
        label: readMemberName(membersById, currentMemberId, currentMemberId),
        chip: (
          <TaskRecordChip
            name={readMemberName(membersById, currentMemberId, t('Unknown'))}
            detail={t('no longer has access')}
            avatarUrl={membersById.get(currentMemberId)?.avatarUrl}
          />
        ),
        valueChip: (
          <TaskMemberValue
            name={readMemberName(membersById, currentMemberId, t('Unknown'))}
            avatarUrl={membersById.get(currentMemberId)?.avatarUrl}
          />
        ),
      },
    ];
  };

  const buildSelectOptions = (
    options: readonly { value: string; label: string; color: string }[],
  ): TaskRelationOption[] =>
    options.map((option) => ({
      value: option.value,
      label: t(option.label),
      chip: <TaskTag color={option.color}>{t(option.label)}</TaskTag>,
    }));

  const buildGlyphOptions = (
    options: readonly { value: string; label: string }[],
    renderGlyph: (value: string) => ReactNode,
  ): TaskRelationOption[] =>
    options.map((option) => ({
      value: option.value,
      label: t(option.label),
      chip: (
        <TaskGlyphValue glyph={renderGlyph(option.value)}>
          {t(option.label)}
        </TaskGlyphValue>
      ),
    }));

  const statusOptions: TaskRelationOption[] = [
    { value: NO_VALUE, label: t('No status'), chip: null },
    ...detail.issueStatuses.map((status) => ({
      value: status.id,
      label: status.name ?? status.id,
      chip: (
        <TaskGlyphValue
          glyph={
            <TaskStatusIcon
              glyph={readStatusGlyph(status, detail.issueStatuses)}
              color={status.color}
            />
          }
        >
          {status.name ?? status.id}
        </TaskGlyphValue>
      ),
    })),
  ];

  // Story points and the estimate save on commit (Enter or blur), not per
  // keystroke: the number field reports every intermediate value.
  const savePoints = (raw: string | null) => {
    if (raw === null) {
      return;
    }

    setPointsDraft(null);
    setIsEditingPoints(false);

    const trimmed = raw.trim();
    const current =
      typeof issue.storyPoints === 'number' ? issue.storyPoints : null;
    const next = trimmed === '' ? null : Number(trimmed);

    if (next === current) {
      return;
    }

    if (next !== null && (!Number.isFinite(next) || next < 0)) {
      onError(t('Story points must be a positive number.'));

      return;
    }

    onUpdate({ data: { storyPoints: next } }, { refreshBoard: true });
  };

  const estimate =
    typeof issue.originalEstimateMinutes === 'number' &&
    issue.originalEstimateMinutes > 0
      ? issue.originalEstimateMinutes
      : null;
  const totalMinutes = issue.timeSpentMinutes ?? 0;
  const remainingMinutes =
    typeof issue.remainingEstimateMinutes === 'number'
      ? issue.remainingEstimateMinutes
      : null;
  const timePercent =
    estimate === null || totalMinutes <= 0
      ? 0
      : Math.min(100, (totalMinutes / estimate) * 100);

  const saveEstimate = (raw: string | null) => {
    if (raw === null) {
      return;
    }

    setEstimateDraft(null);
    setIsEditingEstimate(false);

    const trimmed = raw.trim();
    const next = trimmed === '' ? null : Math.round(Number(trimmed));

    if (next === estimate) {
      return;
    }

    if (next !== null && (!Number.isFinite(next) || next < 0)) {
      onError(t('Estimate must be a positive number of minutes.'));

      return;
    }

    onUpdate({ data: { originalEstimateMinutes: next } });
  };

  // The picker commits one complete value (Done), so it saves and closes at
  // once. Clear wipes the date.
  const saveDueDate = (iso: string | null) => {
    setIsDuePickerOpen(false);

    if (iso === null) {
      return;
    }

    const parsed = new Date(iso);

    if (Number.isNaN(parsed.getTime())) {
      onError(t('That date could not be read.'));

      return;
    }

    onUpdate(
      { data: { dueDate: parsed.toISOString() } },
      { refreshBoard: true },
    );
  };

  const dueLabel = readDueLabel(issue.dueDate);
  const isOverdue = isDueOverdue(issue.dueDate);
  const dueHint = readDueDateHint(issue.dueDate);
  const parentIssue = detail.parentIssue;

  const renderFields = (sectionKey: string, fields: DetailField[]) => {
    const shownFields = fields.filter((field) => field.isShown);
    const isExpanded = expandedSections.includes(sectionKey);
    const foldableFields = shownFields.filter(
      (field) => field.isEmpty && !touchedFields.includes(field.key),
    );
    const foldedFields = isExpanded ? [] : foldableFields;

    return (
      <>
        {shownFields
          .filter((field) => !foldedFields.includes(field))
          .map((field) => (
            <Fragment key={field.key}>{field.node}</Fragment>
          ))}
        {foldableFields.length > 0 && (
          <TaskEmptyFieldsToggle
            labels={foldableFields.map((field) => field.label)}
            isExpanded={isExpanded}
            onToggle={() =>
              setExpandedSections((current) =>
                current.includes(sectionKey)
                  ? current.filter((key) => key !== sectionKey)
                  : [...current, sectionKey],
              )
            }
          />
        )}
      </>
    );
  };

  const propertyFields: DetailField[] = [
    {
      key: 'status',
      label: t('Status'),
      isShown: isShown('status'),
      isEmpty: false,
      node: (
        <TaskFieldRow label={t('Status')}>
          <TaskRelationSelect
            ariaLabel={t('Status')}
            placeholder={t('Status')}
            {...buildOpenProps('status')}
            emptyOptionLabel={t('No status')}
            isSidebar
            emptyDisplay={
              <TaskEmptyValue glyph={<TaskStatusIcon glyph="backlog" />}>
                {t('No status')}
              </TaskEmptyValue>
            }
            value={issue.statusId ?? null}
            options={statusOptions}
            onChange={(statusId) => setRelation('statusId', statusId)}
          />
        </TaskFieldRow>
      ),
    },
    {
      key: 'type',
      label: t('Type'),
      isShown: isShown('type'),
      isEmpty: false,
      node: (
        <TaskFieldRow label={t('Type')}>
          <TaskRelationSelect
            ariaLabel={t('Type')}
            placeholder={t('Type')}
            {...buildOpenProps('type')}
            emptyOptionLabel={t('No type')}
            isSidebar
            emptyDisplay={<TaskEmptyValue>{t('No type')}</TaskEmptyValue>}
            value={issue.issueType ?? null}
            options={buildGlyphOptions(ISSUE_TYPE_OPTIONS, (value) => (
              <IssueTypeGlyph issueType={value} />
            ))}
            onChange={(issueType) =>
              onUpdate({ data: { issueType } }, { refreshBoard: true })
            }
          />
        </TaskFieldRow>
      ),
    },
    {
      key: 'priority',
      label: t('Priority'),
      isShown: isShown('priority'),
      isEmpty: false,
      node: (
        <TaskFieldRow label={t('Priority')}>
          <TaskRelationSelect
            ariaLabel={t('Priority')}
            placeholder={t('Priority')}
            {...buildOpenProps('priority')}
            emptyOptionLabel={t('No priority')}
            isSidebar
            emptyDisplay={
              <TaskEmptyValue
                glyph={<TaskPriorityGlyph priority={null} shouldShowEmpty />}
              >
                {t('No priority')}
              </TaskEmptyValue>
            }
            value={issue.priority ?? null}
            options={buildGlyphOptions(
              [...ISSUE_PRIORITY_OPTIONS].reverse(),
              (value) => (
                <TaskPriorityGlyph priority={value} />
              ),
            )}
            onChange={(priority) =>
              onUpdate({ data: { priority } }, { refreshBoard: true })
            }
          />
        </TaskFieldRow>
      ),
    },
    {
      key: 'assignee',
      label: t('Assignee'),
      isShown: isShown('assignee'),
      isEmpty: !isNonEmptyString(issue.assigneeId),
      node: (
        <TaskFieldRow label={t('Assignee')}>
          <TaskRelationSelect
            ariaLabel={t('Assignee')}
            placeholder={t('Assignee')}
            {...buildOpenProps('assignee')}
            emptyOptionLabel={t('Unassigned')}
            isSidebar
            emptyDisplay={
              <TaskEmptyValue glyph={<UnassignedAvatar size={18} />}>
                {t('Unassigned')}
              </TaskEmptyValue>
            }
            value={issue.assigneeId ?? null}
            {...buildOpenRecordProps('workspaceMember', issue.assigneeId)}
            options={buildMemberOptions(issue.assigneeId ?? null)}
            onChange={(assigneeId) => setRelation('assigneeId', assigneeId)}
          />
        </TaskFieldRow>
      ),
    },
    {
      key: 'reporter',
      label: t('Reporter'),
      isShown: isShown('reporter'),
      isEmpty: !isNonEmptyString(issue.reporterId),
      node: (
        <TaskFieldRow label={t('Reporter')}>
          <TaskRelationSelect
            ariaLabel={t('Reporter')}
            placeholder={t('Reporter')}
            {...buildOpenProps('reporter')}
            emptyOptionLabel={t('Unassigned')}
            isSidebar
            emptyDisplay={
              <TaskEmptyValue glyph={<UnassignedAvatar size={18} />}>
                {t('Unassigned')}
              </TaskEmptyValue>
            }
            value={issue.reporterId ?? null}
            {...buildOpenRecordProps('workspaceMember', issue.reporterId)}
            options={buildMemberOptions(issue.reporterId ?? null)}
            onChange={(reporterId) => setRelation('reporterId', reporterId)}
          />
        </TaskFieldRow>
      ),
    },
    {
      key: 'points',
      label: t('Points'),
      isShown: isShown('points'),
      isEmpty: typeof issue.storyPoints !== 'number',
      node: (
        <TaskFieldRow label={t('Points')}>
          {isEditingPoints ? (
            <TaskTextInput
              ariaLabel={t('Story points')}
              type="number"
              shouldAutoFocus
              value={
                pointsDraft ??
                (typeof issue.storyPoints === 'number'
                  ? String(issue.storyPoints)
                  : '')
              }
              onChange={setPointsDraft}
              onEnter={savePoints}
              onBlur={savePoints}
            />
          ) : (
            <DetailReadButton
              label={t('Edit story points')}
              isReadOnly={isReadOnly}
              onOpen={() => {
                touchField('points');
                setPointsDraft(
                  typeof issue.storyPoints === 'number'
                    ? String(issue.storyPoints)
                    : '',
                );
                setIsEditingPoints(true);
              }}
            >
              {typeof issue.storyPoints === 'number' ? (
                <span style={{ color: TASK_TOKENS.textPrimary }}>
                  {issue.storyPoints}
                  <span
                    style={{ color: TASK_TOKENS.textTertiary, fontSize: 12 }}
                  >
                    {` ${t('pts')}`}
                  </span>
                </span>
              ) : (
                <TaskEmptyValue>{t('No estimate')}</TaskEmptyValue>
              )}
            </DetailReadButton>
          )}
        </TaskFieldRow>
      ),
    },
    {
      key: 'dueDate',
      label: t('Due date'),
      isShown: isShown('dueDate'),
      isEmpty: dueLabel === null,
      node: (
        <TaskFieldRow label={t('Due date')}>
          <div style={{ minWidth: 0, position: 'relative', width: '100%' }}>
            <DetailReadButton
              label={t('Edit due date')}
              isReadOnly={isReadOnly}
              onOpen={() => {
                touchField('dueDate');
                setIsDuePickerOpen(true);
              }}
            >
              {dueLabel === null ? (
                <TaskEmptyValue glyph={<IconCalendarEvent size={14} />}>
                  {t('No due date')}
                </TaskEmptyValue>
              ) : (
                <span
                  style={{
                    alignItems: 'center',
                    color: isOverdue
                      ? TASK_TOKENS.textDanger
                      : TASK_TOKENS.textPrimary,
                    display: 'inline-flex',
                    fontWeight: isOverdue ? 600 : 400,
                    gap: 4,
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <IconCalendarEvent
                    size={12}
                    color={
                      isOverdue
                        ? TASK_TOKENS.textDanger
                        : TASK_TOKENS.textTertiary
                    }
                  />
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {dueLabel}
                  </span>
                  {dueHint !== null && (
                    <span
                      style={{
                        color:
                          dueHint.direction === 'overdue'
                            ? TASK_TOKENS.textDanger
                            : TASK_TOKENS.textTertiary,
                        flexShrink: 0,
                        fontWeight: 400,
                      }}
                    >
                      {dueHint.direction === 'overdue'
                        ? `· ${t('{days} days late', { days: dueHint.days })}`
                        : `· ${new Intl.RelativeTimeFormat(undefined, {
                            numeric: 'auto',
                          }).format(dueHint.days, 'day')}`}
                    </span>
                  )}
                </span>
              )}
            </DetailReadButton>
            {isDuePickerOpen && (
              <twenty-overlay
                offsetX={overlayOffsetX - 62}
                offsetY={28}
                onClose={() => setIsDuePickerOpen(false)}
              >
                <TaskDueDatePicker
                  value={
                    typeof issue.dueDate === 'string' ? issue.dueDate : null
                  }
                  onDone={saveDueDate}
                  onClear={() => {
                    setIsDuePickerOpen(false);
                    onUpdate(
                      { data: { dueDate: null } },
                      { refreshBoard: true },
                    );
                  }}
                  onClose={() => setIsDuePickerOpen(false)}
                />
              </twenty-overlay>
            )}
          </div>
        </TaskFieldRow>
      ),
    },
    {
      key: 'resolution',
      label: t('Resolution'),
      isShown: isShown('resolution'),
      isEmpty: !isNonEmptyString(issue.resolution),
      node: (
        <TaskFieldRow label={t('Resolution')}>
          <TaskRelationSelect
            ariaLabel={t('Resolution')}
            placeholder={t('Resolution')}
            {...buildOpenProps('resolution')}
            emptyOptionLabel={t('Unresolved')}
            isSidebar
            emptyDisplay={<TaskEmptyValue>{t('Unresolved')}</TaskEmptyValue>}
            value={issue.resolution ?? null}
            options={[
              { value: NO_VALUE, label: t('Unresolved'), chip: null },
              ...buildSelectOptions(ISSUE_RESOLUTION_OPTIONS),
            ]}
            onChange={(resolution) => onUpdate({ data: { resolution } })}
          />
        </TaskFieldRow>
      ),
    },
  ];

  const planningFields: DetailField[] = [
    // Read-only: moving an issue to another project changes its statuses,
    // sprints and epics at once, which is not a pick in a list.
    {
      key: 'project',
      label: t('Project'),
      isShown: isShown('project'),
      isEmpty: detail.project === null,
      node: (
        <TaskFieldRow label={t('Project')}>
          <TaskRelationSelect
            ariaLabel={t('Project')}
            placeholder={t('Project')}
            {...buildOpenProps('project')}
            isReadOnly
            emptyOptionLabel={t('No project')}
            isSidebar
            emptyDisplay={<TaskEmptyValue>{t('No project')}</TaskEmptyValue>}
            value={detail.project?.id ?? null}
            {...buildOpenRecordProps('project', detail.project?.id)}
            options={
              detail.project === null
                ? []
                : [
                    {
                      value: detail.project.id,
                      label: detail.project.name ?? detail.project.id,
                      chip: (
                        <TaskGlyphValue
                          glyph={
                            <TaskProjectBadge
                              projectKey={detail.project.key}
                              size={18}
                            />
                          }
                        >
                          {detail.project.name ?? detail.project.id}
                        </TaskGlyphValue>
                      ),
                    },
                  ]
            }
            onChange={() => undefined}
          />
        </TaskFieldRow>
      ),
    },
    {
      key: 'sprint',
      label: t('Sprint'),
      isShown: isShown('sprint'),
      isEmpty: !isNonEmptyString(issue.sprintId),
      node: (
        <TaskFieldRow label={t('Sprint')}>
          <TaskRelationSelect
            ariaLabel={t('Sprint')}
            placeholder={t('Sprint')}
            {...buildOpenProps('sprint')}
            isReadOnly={isPlanningReadOnly}
            emptyOptionLabel={t('No sprint')}
            isSidebar
            emptyDisplay={
              <TaskEmptyValue glyph={<IconCalendarRepeat size={14} />}>
                {t('No sprint')}
              </TaskEmptyValue>
            }
            value={issue.sprintId ?? null}
            {...buildOpenRecordProps('sprint', issue.sprintId)}
            options={[
              { value: NO_VALUE, label: t('No sprint'), chip: null },
              // A closed sprint is history, as in Jira: it can only stay
              // the issue's sprint, not be picked again.
              ...detail.sprints
                .filter(
                  (sprint) =>
                    sprint.state !== 'CLOSED' || sprint.id === issue.sprintId,
                )
                .map((sprint) => ({
                  value: sprint.id,
                  label: sprint.name ?? sprint.id,
                  chip: (
                    <TaskGlyphValue
                      glyph={
                        <IconCalendarRepeat
                          size={14}
                          color={TASK_TOKENS.textTertiary}
                        />
                      }
                    >
                      {sprint.name ?? sprint.id}
                    </TaskGlyphValue>
                  ),
                })),
            ]}
            onChange={(sprintId) => setRelation('sprintId', sprintId)}
          />
        </TaskFieldRow>
      ),
    },
    {
      key: 'epic',
      label: t('Epic'),
      isShown: isShown('epic'),
      isEmpty: !isNonEmptyString(issue.epicId),
      node: (
        <TaskFieldRow label={t('Epic')}>
          <TaskRelationSelect
            ariaLabel={t('Epic')}
            placeholder={t('Epic')}
            {...buildOpenProps('epic')}
            isReadOnly={isPlanningReadOnly}
            emptyOptionLabel={t('No epic')}
            isSidebar
            emptyDisplay={
              <TaskEmptyValue glyph={<IconStack2 size={14} />}>
                {t('No epic')}
              </TaskEmptyValue>
            }
            value={issue.epicId ?? null}
            {...buildOpenRecordProps('epic', issue.epicId)}
            options={[
              { value: NO_VALUE, label: t('No epic'), chip: null },
              ...detail.epics.map((epic) => ({
                value: epic.id,
                label: epic.name ?? epic.id,
                chip: (
                  <TaskGlyphValue
                    glyph={
                      <TaskColorDot
                        color={readTagColor(readEpicColor(epic)).text}
                      />
                    }
                  >
                    {epic.name ?? epic.id}
                  </TaskGlyphValue>
                ),
              })),
            ]}
            onChange={(epicId) => setRelation('epicId', epicId)}
          />
        </TaskFieldRow>
      ),
    },
    {
      key: 'parent',
      label: t('Parent'),
      isShown: isShown('parent'),
      isEmpty: parentIssue === null,
      node: (
        <TaskFieldRow label={t('Parent')}>
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              gap: 2,
              minWidth: 0,
            }}
          >
            {parentIssue === null ? (
              <span style={{ padding: '0 6px' }}>
                <TaskEmptyValue>{t('No parent')}</TaskEmptyValue>
              </span>
            ) : (
              <>
                <DetailReadButton
                  label={t('Open parent issue')}
                  isReadOnly={onOpenIssue === undefined}
                  onOpen={() => onOpenIssue?.(parentIssue.id)}
                >
                  <TaskGlyphValue
                    glyph={
                      <span
                        style={{
                          color: TASK_TOKENS.textTertiary,
                          fontSize: 12,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {parentIssue.issueKey ?? ''}
                      </span>
                    }
                  >
                    {parentIssue.title ?? ''}
                  </TaskGlyphValue>
                </DetailReadButton>
                {!isReadOnly && (
                  <TaskIconButton
                    label={t('Remove parent link')}
                    onClick={() => {
                      touchField('parent');
                      onUpdate({ data: { parentId: null } });
                    }}
                  >
                    <IconX size={14} />
                  </TaskIconButton>
                )}
              </>
            )}
          </div>
        </TaskFieldRow>
      ),
    },
    {
      key: 'labels',
      label: t('Labels'),
      isShown: isShown('labels'),
      isEmpty: (issue.labels ?? []).length === 0,
      node: (
        <TaskFieldRow label={t('Labels')}>
          <LabelPicker
            selected={(issue.labels ?? []) as string[]}
            isOpen={openField === 'labels'}
            onOpenChange={(isOpen) => changeOpenField('labels', isOpen)}
            onChange={(labels) =>
              onUpdate({ data: { labels } }, { refreshBoard: true })
            }
            overlayOffsetX={overlayOffsetX}
            isReadOnly={isReadOnly}
          />
        </TaskFieldRow>
      ),
    },
    {
      key: 'key',
      label: t('Key'),
      isShown: isShown('key'),
      isEmpty: !isNonEmptyString(issue.issueKey),
      node: (
        <TaskFieldRow label={t('Key')}>
          <span
            style={{
              color: issue.issueKey
                ? TASK_TOKENS.textPrimary
                : TASK_TOKENS.textLight,
              fontFamily: TASK_TOKENS.fontFamily,
              fontSize: 13,
              padding: '0 6px',
            }}
          >
            {issue.issueKey ?? t('None')}
          </span>
        </TaskFieldRow>
      ),
    },
  ];

  const customerFields: DetailField[] = [
    {
      key: 'merchants',
      label: t('Merchants'),
      isShown: isShown('merchants'),
      isEmpty: detail.merchants.length === 0,
      node: (
        <TaskFieldRow label={t('Merchants')}>
          <TaskMerchantField
            projectId={issue.projectId ?? null}
            linkedMerchants={detail.merchants}
            {...buildOpenProps('merchants')}
            onOpenMerchant={(merchantId) =>
              onOpenRecord?.('merchant', merchantId)
            }
            // The junction is reconciled to exactly this list by
            // linkIssueMerchants, so the whole set goes every time.
            onChange={(merchantIds) => onUpdate({ merchantIds })}
          />
        </TaskFieldRow>
      ),
    },
    {
      key: 'chats',
      label: t('Chats'),
      isShown: true,
      isEmpty: !isLoadingConversations && crispConversations.length === 0,
      node: (
        <TaskFieldRow label={t('Chats')}>
          <TaskCrispConversationsField
            conversations={crispConversations}
            isLoading={isLoadingConversations}
            onOpenConversation={
              onOpenRecord === undefined
                ? undefined
                : (conversationId) =>
                    onOpenRecord('crispConversation', conversationId)
            }
          />
        </TaskFieldRow>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <TaskSidebarSection
        label={t('Properties')}
        action={
          detail.canManageViews ? (
            <TaskFieldsMenu
              label={t('Show and hide fields')}
              fields={ISSUE_DETAIL_FIELDS}
              hiddenFields={hiddenFields}
              onHiddenFieldsChange={onHiddenFieldsChange}
            />
          ) : null
        }
      >
        {renderFields('properties', propertyFields)}
      </TaskSidebarSection>

      <TaskSidebarSection label={t('Planning')}>
        {renderFields('planning', planningFields)}
      </TaskSidebarSection>

      <TaskSidebarSection label={t('Customers')}>
        {renderFields('customers', customerFields)}
      </TaskSidebarSection>

      {isShown('timeTracking') && (
        <TaskSidebarSection
          label={t('Time tracking')}
          action={
            <span
              style={{
                color: TASK_TOKENS.textSecondary,
                fontFamily: TASK_TOKENS.fontFamily,
                fontSize: 12,
                fontVariantNumeric: 'tabular-nums',
                fontWeight: 500,
              }}
            >
              {estimate === null
                ? formatMinutes(totalMinutes)
                : `${formatMinutes(totalMinutes)} / ${formatMinutes(estimate)}`}
            </span>
          }
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              padding: '4px 8px 0 8px',
            }}
          >
            {isEditingEstimate ? (
              <TaskTextInput
                ariaLabel={t('Original estimate in minutes')}
                type="number"
                shouldAutoFocus
                value={estimateDraft ?? ''}
                suffix={t('min')}
                onChange={setEstimateDraft}
                onEnter={saveEstimate}
                onBlur={saveEstimate}
              />
            ) : (
              <div
                title={
                  estimate === null
                    ? t('No estimate')
                    : `${Math.round(timePercent)}%`
                }
                style={{
                  background: TASK_TOKENS.backgroundTertiary,
                  borderRadius: 3,
                  height: 6,
                  overflow: 'hidden',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    background:
                      estimate !== null && totalMinutes > estimate
                        ? TASK_TOKENS.red
                        : TASK_TOKENS.accent,
                    height: '100%',
                    width: `${timePercent}%`,
                  }}
                />
              </div>
            )}
            <div
              style={{
                alignItems: 'center',
                color: TASK_TOKENS.textTertiary,
                display: 'flex',
                fontFamily: TASK_TOKENS.fontFamily,
                fontSize: 12,
                gap: 4,
                minHeight: 24,
              }}
            >
              <span style={{ flex: 1 }}>
                {totalMinutes === 0 && estimate === null
                  ? t('No time logged')
                  : remainingMinutes !== null
                    ? `${formatMinutes(remainingMinutes)} ${t('remaining')}`
                    : estimate === null
                      ? t('No estimate')
                      : ''}
              </span>
              {!isReadOnly && !isEditingEstimate && (
                <TaskTextLinkButton
                  onClick={() => {
                    setEstimateDraft(estimate === null ? '' : String(estimate));
                    setIsEditingEstimate(true);
                  }}
                >
                  {estimate === null ? t('Set estimate') : t('Edit estimate')}
                </TaskTextLinkButton>
              )}
              {!isReadOnly && onLogWork !== undefined && (
                <TaskTextLinkButton isAccent onClick={onLogWork}>
                  {t('Log time')}
                </TaskTextLinkButton>
              )}
            </div>
          </div>
        </TaskSidebarSection>
      )}
    </div>
  );
};

const TaskTextLinkButton = ({
  children,
  onClick,
  isAccent = false,
}: {
  children: ReactNode;
  onClick: () => void;
  isAccent?: boolean;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isHovered ? TASK_TOKENS.backgroundHover : 'transparent',
        border: 'none',
        borderRadius: TASK_TOKENS.radiusSmall,
        color: isAccent ? TASK_TOKENS.accent : TASK_TOKENS.textSecondary,
        cursor: 'pointer',
        fontFamily: TASK_TOKENS.fontFamily,
        fontSize: 12,
        fontWeight: 500,
        padding: '3px 6px',
      }}
    >
      {children}
    </button>
  );
};

type TaskEmptyFieldsToggleProps = {
  labels: string[];
  isExpanded: boolean;
  onToggle: () => void;
};

// One quiet line in place of a section's unset fields, naming them so a
// reader knows what is there without the rows taking the space.
const TaskEmptyFieldsToggle = ({
  labels,
  isExpanded,
  onToggle,
}: TaskEmptyFieldsToggleProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const Chevron = isExpanded ? IconChevronDown : IconChevronRight;

  return (
    <button
      type="button"
      aria-expanded={isExpanded}
      onClick={onToggle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        alignItems: 'center',
        alignSelf: 'flex-start',
        background: isHovered ? TASK_TOKENS.backgroundHover : 'transparent',
        border: 'none',
        borderRadius: TASK_TOKENS.radiusSmall,
        color: TASK_TOKENS.textTertiary,
        cursor: 'pointer',
        display: 'inline-flex',
        fontFamily: TASK_TOKENS.fontFamily,
        fontSize: 12,
        gap: 4,
        marginLeft: SIDEBAR_FIELD_LABEL_WIDTH - 2,
        maxWidth: `calc(100% - ${SIDEBAR_FIELD_LABEL_WIDTH - 2}px)`,
        minWidth: 0,
        padding: '4px 6px',
        textAlign: 'left',
      }}
    >
      <Chevron size={11} style={{ flexShrink: 0 }} />
      <span style={{ flexShrink: 0 }}>
        {isExpanded
          ? t('Hide empty fields')
          : labels.length === 1
            ? t('1 empty field')
            : t('{count} empty fields', { count: labels.length })}
      </span>
      {!isExpanded && (
        <span
          style={{
            color: TASK_TOKENS.textLight,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          ({labels.join(', ')})
        </span>
      )}
    </button>
  );
};

type TaskGlyphValueProps = {
  glyph: ReactNode;
  children: ReactNode;
};

// A value drawn the way the board draws it: its glyph, then its name.
const TaskGlyphValue = ({ glyph, children }: TaskGlyphValueProps) => (
  <span
    style={{
      alignItems: 'center',
      color: TASK_TOKENS.textPrimary,
      display: 'inline-flex',
      fontFamily: TASK_TOKENS.fontFamily,
      fontSize: 13,
      gap: 6,
      minWidth: 0,
      overflow: 'hidden',
      whiteSpace: 'nowrap',
    }}
  >
    {glyph}
    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {children}
    </span>
  </span>
);

type TaskEmptyValueProps = {
  glyph?: ReactNode;
  children: ReactNode;
};

// What an unset property says: its absence in words, in the quiet tone, with
// the glyph the value would carry.
const TaskEmptyValue = ({ glyph, children }: TaskEmptyValueProps) => (
  <span
    style={{
      alignItems: 'center',
      color: TASK_TOKENS.textTertiary,
      display: 'inline-flex',
      fontFamily: TASK_TOKENS.fontFamily,
      fontSize: 13,
      gap: 6,
      whiteSpace: 'nowrap',
    }}
  >
    {glyph !== undefined && (
      <span style={{ display: 'inline-flex', opacity: 0.8 }}>{glyph}</span>
    )}
    {children}
  </span>
);

const TaskMemberValue = ({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl?: string | null;
}) => (
  <TaskGlyphValue
    glyph={
      <TaskAvatar
        name={name}
        avatarUrl={avatarUrl}
        size={18}
        shouldShowTitle={false}
      />
    }
  >
    {name}
  </TaskGlyphValue>
);

type TaskSidebarSectionProps = {
  label?: string;
  // Drawn beside the label, the way a list header counts its rows.
  count?: number;
  action?: ReactNode;
  children: ReactNode;
};

const SIDEBAR_SECTION_SPACING = 18;

export const TaskSidebarSection = ({
  label,
  count,
  action,
  children,
}: TaskSidebarSectionProps) => (
  <section
    style={{
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
      // Spacing on the section rather than a gap on each parent, so the
      // sections keep one rhythm whichever column they are stacked in.
      paddingBottom: SIDEBAR_SECTION_SPACING,
    }}
  >
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'space-between',
        minHeight: label === undefined ? 0 : 22,
        padding: '0 8px 4px 8px',
      }}
    >
      <span
        style={{
          color: TASK_TOKENS.textTertiary,
          fontFamily: TASK_TOKENS.fontFamily,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 0.4,
          textTransform: 'uppercase',
        }}
      >
        {label}
        {count !== undefined && (
          <span
            style={{
              background: TASK_TOKENS.backgroundTertiary,
              borderRadius: TASK_TOKENS.radiusExtraSmall,
              color: TASK_TOKENS.textSecondary,
              fontSize: 11,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: 0,
              marginLeft: 6,
              padding: '1px 5px',
            }}
          >
            {count}
          </span>
        )}
      </span>
      {action}
    </div>
    {children}
  </section>
);
