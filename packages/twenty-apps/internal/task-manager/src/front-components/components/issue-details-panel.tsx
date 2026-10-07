import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import {
  IconCalendarEvent,
  IconCheck,
  IconClock,
  IconFlag,
  IconHierarchy2,
  IconKey,
  IconListDetails,
  IconNumber,
  IconPencil,
  IconProgressCheck,
  IconRocket,
  IconShoppingBag,
  IconStack2,
  IconTag,
  IconTags,
  IconUserCircle,
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
import { formatMinutes } from '../../utils/format-minutes.util';
import { type IssueDetail, type MemberRow } from '../hooks/use-issue-detail';
import { readMemberName } from '../utils/read-member-name.util';
import { TaskButton } from './task-button';
import { DetailReadButton, LabelPicker } from './task-detail-controls';
import { TaskDueDatePicker } from './task-due-date-picker';
import { TaskFieldsMenu } from './task-fields-menu';
import { TaskFieldRow } from './task-field-row';
import { TaskIconButton } from './task-icon-button';
import { TaskMerchantField } from './task-merchant-field';
import { TaskRecordChip } from './task-record-chip';
import {
  type TaskRelationOption,
  TaskRelationSelect,
} from './task-relation-select';
import { SectionHeading } from './task-section-heading';
import { TaskTag } from './task-tag';
import { TaskTextInput } from './task-text-input';
import { TASK_TOKENS } from './task-tokens';

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
    ? parsed.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    : null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(parsed);
  target.setHours(0, 0, 0, 0);
  const deltaDays = Math.round((target.getTime() - today.getTime()) / DAY_IN_MS);

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

  const isReadOnly = !detail.canWrite;
  const hiddenFields = detail.issueViewSettings.hiddenDetailFields;
  const isShown = (key: IssueDetailFieldKey) => !hiddenFields.includes(key);

  const membersById = new Map<string, MemberRow>(
    [...detail.members, ...detail.assignableMembers].map((member) => [
      member.id,
      member,
    ]),
  );

  const buildOpenProps = (field: string) => ({
    isOpen: openField === field,
    onOpenChange: (isOpen: boolean) => setOpenField(isOpen ? field : null),
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
        label: `${readMemberName(membersById, member.id, member.id)} ${member.userEmail ?? ''}`.trim(),
        chip: (
          <TaskRecordChip
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
          <TaskRecordChip
            name={readMemberName(membersById, currentMemberId, t('Unknown'))}
            avatarUrl={membersById.get(currentMemberId)?.avatarUrl}
          />
        ),
      },
    ];
  };

  const buildTagOptions = ({
    emptyLabel,
    rows,
    color,
  }: {
    emptyLabel: string;
    rows: readonly { id: string; name?: string | null; color?: string | null }[];
    color?: string;
  }): TaskRelationOption[] => [
    { value: NO_VALUE, label: emptyLabel, chip: null },
    ...rows.map((row) => ({
      value: row.id,
      label: row.name ?? row.id,
      chip: <TaskTag color={row.color ?? color}>{row.name ?? row.id}</TaskTag>,
    })),
  ];

  const buildSelectOptions = (
    options: readonly { value: string; label: string; color: string }[],
  ): TaskRelationOption[] =>
    options.map((option) => ({
      value: option.value,
      label: option.label,
      chip: <TaskTag color={option.color}>{option.label}</TaskTag>,
    }));

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

    onUpdate({ data: { dueDate: parsed.toISOString() } }, { refreshBoard: true });
  };

  const dueLabel = readDueLabel(issue.dueDate);
  const isOverdue = isDueOverdue(issue.dueDate);
  const parentIssue = detail.parentIssue;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'space-between',
          minHeight: 28,
        }}
      >
        <SectionHeading label={t('Details')} />
        {detail.canManageViews && (
          <TaskFieldsMenu
            label={t('Show and hide fields')}
            fields={ISSUE_DETAIL_FIELDS}
            hiddenFields={hiddenFields}
            onHiddenFieldsChange={onHiddenFieldsChange}
          />
        )}
      </div>

      {/* Jira draws Details as one bordered card, not bare rows on the page:
          the card is what groups the rows into a panel. */}
      <div
        style={{
          background: TASK_TOKENS.background,
          border: `1px solid ${TASK_TOKENS.borderLight}`,
          borderRadius: TASK_TOKENS.radius,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          minWidth: 0,
          overflow: 'hidden',
          padding: '8px 10px',
          width: '100%',
        }}
      >
        {isShown('status') && (
          <TaskFieldRow label={t('Status')} Icon={IconProgressCheck}>
            <TaskRelationSelect
              ariaLabel={t('Status')}
              placeholder={t('Status')}
              {...buildOpenProps('status')}
              emptyOptionLabel={t('No status')}
              value={issue.statusId ?? null}
              options={buildTagOptions({
                emptyLabel: t('No status'),
                rows: detail.issueStatuses,
              })}
              onChange={(statusId) => setRelation('statusId', statusId)}
            />
          </TaskFieldRow>
        )}
        {isShown('type') && (
          <TaskFieldRow label={t('Type')} Icon={IconTag}>
            <TaskRelationSelect
              ariaLabel={t('Type')}
              placeholder={t('Type')}
              {...buildOpenProps('type')}
              emptyOptionLabel={t('No type')}
              value={issue.issueType ?? null}
              options={buildSelectOptions(ISSUE_TYPE_OPTIONS)}
              onChange={(issueType) =>
                onUpdate({ data: { issueType } }, { refreshBoard: true })
              }
            />
          </TaskFieldRow>
        )}
        {isShown('priority') && (
          <TaskFieldRow label={t('Priority')} Icon={IconFlag}>
            <TaskRelationSelect
              ariaLabel={t('Priority')}
              placeholder={t('Priority')}
              {...buildOpenProps('priority')}
              emptyOptionLabel={t('No priority')}
              value={issue.priority ?? null}
              options={buildSelectOptions(ISSUE_PRIORITY_OPTIONS)}
              onChange={(priority) =>
                onUpdate({ data: { priority } }, { refreshBoard: true })
              }
            />
          </TaskFieldRow>
        )}
        {isShown('assignee') && (
          <TaskFieldRow label={t('Assignee')} Icon={IconUserCircle}>
            <TaskRelationSelect
              ariaLabel={t('Assignee')}
              placeholder={t('Assignee')}
              {...buildOpenProps('assignee')}
              emptyOptionLabel={t('Unassigned')}
              value={issue.assigneeId ?? null}
              {...buildOpenRecordProps('workspaceMember', issue.assigneeId)}
              options={buildMemberOptions(issue.assigneeId ?? null)}
              onChange={(assigneeId) => setRelation('assigneeId', assigneeId)}
            />
          </TaskFieldRow>
        )}
        {isShown('reporter') && (
          <TaskFieldRow label={t('Reporter')} Icon={IconUserCircle}>
            <TaskRelationSelect
              ariaLabel={t('Reporter')}
              placeholder={t('Reporter')}
              {...buildOpenProps('reporter')}
              emptyOptionLabel={t('Unassigned')}
              value={issue.reporterId ?? null}
              {...buildOpenRecordProps('workspaceMember', issue.reporterId)}
              options={buildMemberOptions(issue.reporterId ?? null)}
              onChange={(reporterId) => setRelation('reporterId', reporterId)}
            />
          </TaskFieldRow>
        )}
        {/* Read-only: moving an issue to another project changes its statuses,
            sprints and epics at once, which is not a pick in a list. */}
        {isShown('project') && (
          <TaskFieldRow label={t('Project')} Icon={IconListDetails}>
            <TaskRelationSelect
              ariaLabel={t('Project')}
              placeholder={t('Project')}
              {...buildOpenProps('project')}
              isReadOnly
              emptyOptionLabel={t('No project')}
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
                          <TaskRecordChip
                            name={detail.project.name ?? detail.project.id}
                            shape="square"
                          />
                        ),
                      },
                    ]
              }
              onChange={() => undefined}
            />
          </TaskFieldRow>
        )}
        {isShown('sprint') && (
          <TaskFieldRow label={t('Sprint')} Icon={IconRocket}>
            <TaskRelationSelect
              ariaLabel={t('Sprint')}
              placeholder={t('Sprint')}
              {...buildOpenProps('sprint')}
              emptyOptionLabel={t('No sprint')}
              value={issue.sprintId ?? null}
              {...buildOpenRecordProps('sprint', issue.sprintId)}
              options={buildTagOptions({
                emptyLabel: t('No sprint'),
                rows: detail.sprints,
                color: 'purple',
              })}
              onChange={(sprintId) => setRelation('sprintId', sprintId)}
            />
          </TaskFieldRow>
        )}
        {isShown('epic') && (
          <TaskFieldRow label={t('Epic')} Icon={IconStack2}>
            <TaskRelationSelect
              ariaLabel={t('Epic')}
              placeholder={t('Epic')}
              {...buildOpenProps('epic')}
              emptyOptionLabel={t('No epic')}
              value={issue.epicId ?? null}
              {...buildOpenRecordProps('epic', issue.epicId)}
              options={buildTagOptions({
                emptyLabel: t('No epic'),
                rows: detail.epics,
                color: 'turquoise',
              })}
              onChange={(epicId) => setRelation('epicId', epicId)}
            />
          </TaskFieldRow>
        )}
        {isShown('parent') && (
          <TaskFieldRow label={t('Parent')} Icon={IconHierarchy2}>
            <div style={{ alignItems: 'center', display: 'flex', gap: 2, minWidth: 0 }}>
              {parentIssue === null ? (
                <span
                  style={{
                    color: TASK_TOKENS.textLight,
                    fontFamily: TASK_TOKENS.fontFamily,
                    fontSize: 13,
                    padding: '0 4px',
                  }}
                >
                  {t('No parent')}
                </span>
              ) : (
                <>
                  <DetailReadButton
                    label={t('Open parent issue')}
                    isReadOnly={onOpenIssue === undefined}
                    onOpen={() => onOpenIssue?.(parentIssue.id)}
                  >
                    <TaskRecordChip
                      name={`${parentIssue.issueKey ?? ''} ${parentIssue.title ?? ''}`.trim()}
                      shape="square"
                    />
                  </DetailReadButton>
                  {!isReadOnly && (
                    <TaskIconButton
                      label={t('Remove parent link')}
                      onClick={() => onUpdate({ data: { parentId: null } })}
                    >
                      <IconX size={14} />
                    </TaskIconButton>
                  )}
                </>
              )}
            </div>
          </TaskFieldRow>
        )}
        {isShown('merchants') && (
          <TaskFieldRow label={t('Merchants')} Icon={IconShoppingBag}>
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
        )}
        {isShown('labels') && (
          <TaskFieldRow label={t('Labels')} Icon={IconTags}>
            <LabelPicker
              selected={(issue.labels ?? []) as string[]}
              isOpen={openField === 'labels'}
              onOpenChange={(isOpen) => setOpenField(isOpen ? 'labels' : null)}
              onChange={(labels) =>
                onUpdate({ data: { labels } }, { refreshBoard: true })
              }
              overlayOffsetX={overlayOffsetX}
              isReadOnly={isReadOnly}
            />
          </TaskFieldRow>
        )}
        {isShown('points') && (
          <TaskFieldRow label={t('Points')} Icon={IconNumber}>
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
                onEnter={() => savePoints(pointsDraft)}
                onBlur={() => savePoints(pointsDraft)}
              />
            ) : (
              <DetailReadButton
                label={t('Edit story points')}
                isReadOnly={isReadOnly}
                onOpen={() => {
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
                    <span style={{ color: TASK_TOKENS.textTertiary, fontSize: 12 }}>
                      {` ${t('pts')}`}
                    </span>
                  </span>
                ) : (
                  <span style={{ color: TASK_TOKENS.textLight }}>{t('None')}</span>
                )}
              </DetailReadButton>
            )}
          </TaskFieldRow>
        )}
        {isShown('dueDate') && (
          <TaskFieldRow label={t('Due date')} Icon={IconCalendarEvent}>
            <div style={{ minWidth: 0, position: 'relative', width: '100%' }}>
              <DetailReadButton
                label={t('Edit due date')}
                isReadOnly={isReadOnly}
                onOpen={() => setIsDuePickerOpen(true)}
              >
                {dueLabel === null ? (
                  <span style={{ color: TASK_TOKENS.textLight }}>
                    {t('No due date')}
                  </span>
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
                        isOverdue ? TASK_TOKENS.textDanger : TASK_TOKENS.textTertiary
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
                    value={typeof issue.dueDate === 'string' ? issue.dueDate : null}
                    onDone={saveDueDate}
                    onClear={() => {
                      setIsDuePickerOpen(false);
                      onUpdate({ data: { dueDate: null } }, { refreshBoard: true });
                    }}
                    onClose={() => setIsDuePickerOpen(false)}
                  />
                </twenty-overlay>
              )}
            </div>
          </TaskFieldRow>
        )}
        {isShown('resolution') && (
          <TaskFieldRow label={t('Resolution')} Icon={IconCheck}>
            <TaskRelationSelect
              ariaLabel={t('Resolution')}
              placeholder={t('Resolution')}
              {...buildOpenProps('resolution')}
              emptyOptionLabel={t('Unresolved')}
              value={issue.resolution ?? null}
              options={[
                { value: NO_VALUE, label: t('Unresolved'), chip: null },
                ...buildSelectOptions(ISSUE_RESOLUTION_OPTIONS),
              ]}
              onChange={(resolution) => onUpdate({ data: { resolution } })}
            />
          </TaskFieldRow>
        )}
        {isShown('key') && (
          <TaskFieldRow label={t('Key')} Icon={IconKey}>
            <span
              style={{
                color: issue.issueKey ? TASK_TOKENS.textPrimary : TASK_TOKENS.textLight,
                fontFamily: TASK_TOKENS.fontFamily,
                fontSize: 13,
                padding: '0 4px',
              }}
            >
              {issue.issueKey ?? t('None')}
            </span>
          </TaskFieldRow>
        )}
      </div>

      {isShown('timeTracking') && (
        <div
          style={{
            background: TASK_TOKENS.background,
            border: `1px solid ${TASK_TOKENS.borderLight}`,
            borderRadius: TASK_TOKENS.radius,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            marginTop: 8,
            padding: '10px 12px',
            width: '100%',
          }}
        >
          <SectionHeading label={t('Time tracking')} />
          <div
            style={{
              alignItems: 'center',
              color: TASK_TOKENS.textSecondary,
              display: 'flex',
              fontFamily: TASK_TOKENS.fontFamily,
              fontSize: 12,
              gap: 6,
            }}
          >
            <IconClock size={14} color={TASK_TOKENS.textTertiary} />
            <span style={{ flex: 1 }}>
              {totalMinutes > 0 ? (
                <>
                  {formatMinutes(totalMinutes)}
                  <span style={{ color: TASK_TOKENS.textTertiary }}>
                    {t(' logged')}
                  </span>
                </>
              ) : (
                t('No time logged')
              )}
              {estimate !== null && (
                <span style={{ color: TASK_TOKENS.textTertiary }}>
                  {` ${t('of')} ${formatMinutes(estimate)} ${t('estimated')}`}
                </span>
              )}
            </span>
            {!isEditingEstimate && !isReadOnly && (
              <TaskIconButton
                label={t('Edit estimate')}
                onClick={() => {
                  setEstimateDraft(estimate === null ? '' : String(estimate));
                  setIsEditingEstimate(true);
                }}
              >
                <IconPencil size={14} />
              </TaskIconButton>
            )}
          </div>
          {isEditingEstimate ? (
            <TaskTextInput
              ariaLabel={t('Original estimate in minutes')}
              type="number"
              shouldAutoFocus
              value={estimateDraft ?? ''}
              suffix={t('min')}
              onChange={setEstimateDraft}
              onEnter={() => saveEstimate(estimateDraft)}
              onBlur={() => saveEstimate(estimateDraft)}
            />
          ) : (
            <div
              style={{
                background: TASK_TOKENS.backgroundTertiary,
                borderRadius: 4,
                height: 8,
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
          {remainingMinutes !== null && (
            <span
              style={{
                color: TASK_TOKENS.textTertiary,
                fontFamily: TASK_TOKENS.fontFamily,
                fontSize: 12,
              }}
            >
              {`${formatMinutes(remainingMinutes)} ${t('remaining')}`}
            </span>
          )}
          {!isReadOnly && onLogWork !== undefined && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <TaskButton size="small" onClick={onLogWork}>
                {t('Log work')}
              </TaskButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
