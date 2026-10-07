import { useEffect, useMemo, useRef, useState } from 'react';
import { AppPath, copyToClipboard, enqueueSnackbar, navigate, t } from 'twenty-sdk/front-component';
import {
  IconCalendarEvent,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconExternalLink,
  IconFlag,
  IconLink,
  IconNumber,
  IconPencil,
  IconProgressCheck,
  IconRocket,
  IconSettings,
  IconStack2,
  IconTag,
  IconTags,
  IconUserCircle,
  IconX,
} from 'twenty-ui/icon';

import { ISSUE_LABEL_OPTIONS } from '../../constants/issue-label-options';
import { ISSUE_PRIORITY_OPTIONS } from '../../constants/issue-priority-options';
import { ISSUE_TYPE_OPTIONS } from '../../constants/issue-type-options';
import { type BoardIssue } from '../../types/task-board';import {
  CREATE_ISSUE_COMMENT_ROUTE_PATH,
  CREATE_ISSUE_ROUTE_PATH,
  CREATE_WORKLOG_ROUTE_PATH,
  DELETE_ISSUE_COMMENT_ROUTE_PATH,
  DELETE_WORKLOG_ROUTE_PATH,
  UPDATE_ISSUE_COMMENT_ROUTE_PATH,
  UPDATE_ISSUE_ROUTE_PATH,
  UPDATE_WORKLOG_ROUTE_PATH,
} from '../../constants/route-paths';
import { buildRichTextValue } from '../../utils/read-rich-text-plain-value.util';
import { formatMinutes } from '../../utils/format-minutes.util';
import { buildBoardIssueUrl } from '../utils/build-record-url.util';
import { type MemberRow, useIssueDetail } from '../hooks/use-issue-detail';
import { postAppRoute } from '../utils/post-app-route.util';
import { readErrorText } from '../utils/read-error-text.util';
import { readMemberName } from '../utils/read-member-name.util';
import { readRecordPageBaseUrl } from '../utils/read-record-page-base-url.util';
import { IssueCommentList } from './issue-comment-list';
import { IssueHistoryList } from './issue-history-list';
import { IssueWorklogList } from './issue-worklog-list';
import { TaskButton } from './task-button';
import { TaskCheckbox } from './task-checkbox';
import { DescriptionEmptyBox } from './task-description-empty-box';
import { TaskDueDatePicker } from './task-due-date-picker';
import { TaskFieldRow } from './task-field-row';
import { TaskIconButton } from './task-icon-button';
import { TaskIssueSearch } from './task-issue-search';
import { TaskMessage } from './task-message';
import { TaskBoardDetailSkeleton } from './task-board-skeleton';
import { TaskRecordChip } from './task-record-chip';
import {
  type TaskRelationOption,
  TaskRelationSelect,
} from './task-relation-select';
import { TaskRichTextEditor } from './task-rich-text-editor';
import { TaskStatusLine } from './task-status-line';
import { TaskSubtaskRow } from './task-subtask-row';
import { TaskTabs } from './task-tabs';
import { TaskTag } from './task-tag';
import { TaskTextInput } from './task-text-input';
import { TASK_THIN_SCROLLBAR_STYLE, TASK_TOKENS } from './task-tokens';

type TaskBoardDetailProps = {
  issueId: string;
  // Flat board order, so the drawer can step to the previous / next card the
  // way the Jira issue modal does.
  navIssueIds: readonly string[];
  onSelectIssue: (issueId: string) => void;
  onClose: () => void;
  // The board page path, for the copy-link button. Null when the host did not
  // report the page path — the button hides instead of copying a link to the
  // wrong page.
  boardPath: string | null;
  // Card-visible fields changed (title, status, owner, type, priority): the
  // board refetches its columns. Description, comments and worklogs skip it —
  // no card renders them.
  onCardChanged: () => void;
};

type OpenField =
  | 'status'
  | 'type'
  | 'priority'
  | 'assignee'
  | 'reporter'
  | 'sprint'
  | 'epic'
  | 'labels';

const NO_VALUE = '';

// Jira's issue view as a modal over the board: title and description on the
// left with subtasks and the activity feed under them, the Details panel on
// the right. Every read and write goes through the app's scoped routes — the
// same ones the record page uses — so app-scope stays enforced and worklog
// time-tracking keeps recomputing.
export const TaskBoardDetail = ({
  issueId,
  navIssueIds,
  onSelectIssue,
  onClose,
  boardPath,
  onCardChanged,
}: TaskBoardDetailProps) => {
  const { data, isLoading, loadError, reload } = useIssueDetail(issueId);
  const [openField, setOpenField] = useState<OpenField | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  // Field values just picked, shown before the server confirms them, the way
  // the record page's Details widget does: saving re-runs the issue-detail
  // route, and a chip sitting on its old value until that returns is the lag.
  const [pendingPatch, setPendingPatch] = useState<Record<string, unknown>>(
    {},
  );
  // Writes still in flight. The record is only re-read once the last one
  // lands: re-reading after each would paint a later pick back to its old
  // value while its own write is still on the wire.
  // oxlint-disable-next-line twenty/no-state-useref
  const pendingWriteCountRef = useRef(0);
  // oxlint-disable-next-line twenty/no-state-useref
  const currentIssueIdRef = useRef(issueId);
  currentIssueIdRef.current = issueId;
  const [activityTab, setActivityTab] = useState<
    'comments' | 'worklogs' | 'history'
  >('comments');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState<string | null>(null);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState<string | null>(null);
  const [subtaskDraft, setSubtaskDraft] = useState('');
  const [pointsDraft, setPointsDraft] = useState<string | null>(null);
  const [isEditingEstimate, setIsEditingEstimate] = useState(false);
  const [estimateDraft, setEstimateDraft] = useState<string | null>(null);
  const [isEditingPoints, setIsEditingPoints] = useState(false);
  const [isDuePickerOpen, setIsDuePickerOpen] = useState(false);
  // Which Details rows are hidden. A view preference for the session, so —
  // unlike the edit drafts above — it survives stepping between cards and is
  // only dropped when the modal closes and unmounts.
  const [hiddenDetailFields, setHiddenDetailFields] = useState<string[]>([]);
  const [isFieldsMenuOpen, setIsFieldsMenuOpen] = useState(false);
  // Mirrors the description draft synchronously (see saveDescription below).
  // A ref, not state: it is written on every keystroke and must never
  // repaint. Declared up here with the other hooks — anything below the
  // early loading returns would shift the hook order between renders.
  // oxlint-disable-next-line twenty/no-state-useref
  const pendingDescriptionRef = useRef<string | null>(null);

  // The drawer stays mounted while stepping between cards, so every transient
  // edit state resets with the issue — otherwise one card's draft leaks into
  // the next. The hidden-fields preference is the exception: it is a view
  // choice, not a draft, so it survives across cards until the modal closes.
  useEffect(() => {
    setPendingPatch({});
    setOpenField(null);
    setActionError(null);
    setIsEditingTitle(false);
    setTitleDraft(null);
    setIsEditingDescription(false);
    setDescriptionDraft(null);
    setSubtaskDraft('');
    setPointsDraft(null);
    setIsEditingEstimate(false);
    setEstimateDraft(null);
    setIsEditingPoints(false);
    setIsDuePickerOpen(false);
    setIsFieldsMenuOpen(false);
  }, [issueId]);

  const projectId =
    typeof data.issue?.projectId === 'string' ? data.issue.projectId : null;
  // Assignee options ride the detail payload itself, so the modal paints in
  // one round trip instead of waiting on a second route after this one.
  const assignableMembers = data.assignableMembers;

  const membersById = useMemo(
    () => new Map<string, MemberRow>(data.members.map((member) => [member.id, member])),
    [data.members],
  );

  // Rows the link search must never offer: the issue itself, its current
  // children and its parent — any of them would loop the parent chain.
  const unlinkableIds = useMemo(() => {
    const ids = new Set<string>([issueId]);

    if (
      data.parentIssue !== null &&
      typeof data.parentIssue.id === 'string'
    ) {
      ids.add(data.parentIssue.id);
    }

    for (const child of data.childIssues) {
      ids.add(child.id);
    }

    return [...ids];
  }, [issueId, data.parentIssue, data.childIssues]);

  const statusNameById = useMemo(() => {
    const names = new Map<string, string>();

    for (const status of data.issueStatuses) {
      if (typeof status.name === 'string') {
        names.set(status.id, status.name);
      }
    }

    return names;
  }, [data.issueStatuses]);

  const navIndex = navIssueIds.indexOf(issueId);
  const previousIssueId = navIndex > 0 ? navIssueIds[navIndex - 1] : undefined;
  const nextIssueId =
    navIndex >= 0 && navIndex < navIssueIds.length - 1
      ? navIssueIds[navIndex + 1]
      : undefined;

  const update = async (
    body: Record<string, unknown>,
    options?: { refreshBoard?: boolean },
  ) => {
    const patch =
      typeof body.data === 'object' && body.data !== null
        ? (body.data as Record<string, unknown>)
        : {};

    setPendingPatch((current) => ({ ...current, ...patch }));
    pendingWriteCountRef.current += 1;
    setIsSaving(true);

    try {
      await postAppRoute(UPDATE_ISSUE_ROUTE_PATH, { issueId, ...body });
      setActionError(null);

      if (options?.refreshBoard === true) {
        onCardChanged();
      }
    } catch (error) {
      const message = readErrorText(error);
      setActionError(message);
      void enqueueSnackbar({ message, variant: 'error' });
    } finally {
      pendingWriteCountRef.current -= 1;

      // Stepping to another card mid-write leaves this one's re-read behind:
      // it would paint the old issue into the new card's modal.
      if (
        pendingWriteCountRef.current === 0 &&
        currentIssueIdRef.current === issueId
      ) {
        // The re-read is the truth either way: it confirms what succeeded and
        // puts back whatever a failed write had shown early.
        await reload();
        setPendingPatch({});
        setIsSaving(false);
      }
    }
  };

  const setRelation = (field: string, recordId: string | null) =>
    void update({ data: { [field]: recordId } }, { refreshBoard: true });

  // Feed writes (comments, worklogs) share one busy flag and error line, the
  // way the record page's activity panel does. They never touch the board —
  // no card renders them.
  const runFeedAction = async (action: () => Promise<unknown>) => {
    setIsSaving(true);

    try {
      await action();
      setActionError(null);
      await reload();
    } catch (error) {
      setActionError(readErrorText(error));
    } finally {
      setIsSaving(false);
    }
  };

  // One flag for the whole panel: two fields each holding their own open
  // state means two dropdowns drawn over each other, with neither reachable.
  // The -10 offset right-aligns every 202px card flush with the modal's right
  // edge: the card is as wide as the value column plus the panel paddings, so
  // -10 lands its right edge 8px inside the dialog border. (The host only
  // clamps overlays to the viewport, and the modal sits well inside it, so
  // without this the card floats mid-panel.)
  const buildOpenProps = (field: OpenField) => ({
    isOpen: openField === field,
    onOpenChange: (isOpen: boolean) => setOpenField(isOpen ? field : null),
    overlayOffsetX: -10,
  });

  const buildMemberOptions = (
    currentMemberId: string | null,
  ): TaskRelationOption[] => {
    const options: TaskRelationOption[] = [
      { value: NO_VALUE, label: t('Unassigned'), chip: null },
      ...assignableMembers.map((member) => ({
        value: member.id,
        label: readMemberName(membersById, member.id, member.id),
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

    if (currentMemberId === null || options.some((option) => option.value === currentMemberId)) {
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
          />
        ),
      },
    ];
  };

  const buildTagOptions = ({
    emptyLabel,
    rows,
  }: {
    emptyLabel: string;
    rows: readonly {
      id: string;
      name?: string | null;
      color?: string | null;
    }[];
  }  ): TaskRelationOption[] => [
    { value: NO_VALUE, label: emptyLabel, chip: null },
    ...rows.map((row) => ({
      value: row.id,
      label: row.name ?? row.id,
      chip: <TaskTag color={row.color}>{row.name ?? row.id}</TaskTag>,
    })),
  ];

  // Every row the gear menu can show or hide, in panel order. Keys are
  // internal; labels are what the menu prints.
  const detailFieldOptions = [
    { key: 'status', label: t('Status') },
    { key: 'type', label: t('Type') },
    { key: 'priority', label: t('Priority') },
    { key: 'assignee', label: t('Assignee') },
    { key: 'reporter', label: t('Reporter') },
    { key: 'sprint', label: t('Sprint') },
    { key: 'epic', label: t('Epic') },
    { key: 'labels', label: t('Labels') },
    { key: 'points', label: t('Points') },
    { key: 'dueDate', label: t('Due date') },
    { key: 'timeTracking', label: t('Time tracking') },
  ];

  if (isLoading && data.issue === null) {
    return (
      <TaskBoardDetailFrame onClose={onClose} focusKey={issueId}>
        <TaskBoardDetailSkeleton />
      </TaskBoardDetailFrame>
    );
  }

  if (data.issue === null) {
    return (
      <TaskBoardDetailFrame onClose={onClose} focusKey={issueId}>
        <TaskMessage
          text={loadError ?? t('This issue is not available to you.')}
          tone={loadError === null ? 'neutral' : 'danger'}
        />
      </TaskBoardDetailFrame>
    );
  }

  const issue = { ...data.issue, ...pendingPatch } as typeof data.issue;
  const typeOption = ISSUE_TYPE_OPTIONS.find(
    (candidate) => candidate.value === issue.issueType,
  );
  const currentTitle = titleDraft ?? issue.title ?? '';
  const storedDescription = issue.description?.markdown ?? '';
  const currentDescription = descriptionDraft ?? storedDescription;

  const totalMinutes = issue.timeSpentMinutes ?? 0;
  const estimate =
    typeof issue.originalEstimateMinutes === 'number' &&
    issue.originalEstimateMinutes > 0
      ? issue.originalEstimateMinutes
      : null;
  const timePercent =
    estimate === null || totalMinutes <= 0
      ? 0
      : Math.min(100, (totalMinutes / estimate) * 100);

  // Story points and the time estimate save on commit (Enter or blur), not
  // per keystroke: the number field reports every intermediate value, and
  // each one would be a write of its own.
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
      setActionError(t('Story points must be a positive number.'));

      return;
    }

    void update({ data: { storyPoints: next } }, { refreshBoard: true });
  };

  // Minutes, like the worklog form takes. The board never renders the
  // estimate, so no board refresh — unlike points above.
  const saveEstimate = (raw: string | null) => {
    if (raw === null) {
      return;
    }

    setEstimateDraft(null);
    setIsEditingEstimate(false);

    const trimmed = raw.trim();
    const current =
      typeof issue.originalEstimateMinutes === 'number' &&
      issue.originalEstimateMinutes > 0
        ? issue.originalEstimateMinutes
        : null;
    const next = trimmed === '' ? null : Math.round(Number(trimmed));

    if (next === current) {
      return;
    }

    if (next !== null && (!Number.isFinite(next) || next < 0)) {
      setActionError(t('Estimate must be a positive number of minutes.'));

      return;
    }

    void update({ data: { originalEstimateMinutes: next } });
  };

  // The picker commits one complete value (Done), so a complete value saves
  // and closes at once. Clear wipes the date. Typing never sits in a draft:
  // the previous native field saved partial keystrokes and its browser picker
  // spilled past the modal edge.
  const saveDueDate = (iso: string | null) => {
    setIsDuePickerOpen(false);

    if (iso === null) {
      return;
    }

    const parsed = new Date(iso);

    if (Number.isNaN(parsed.getTime())) {
      setActionError(t('That date could not be read.'));

      return;
    }

    void update(
      { data: { dueDate: parsed.toISOString() } },
      { refreshBoard: true },
    );
  };

  const clearDueDate = () => {
    setIsDuePickerOpen(false);
    void update({ data: { dueDate: null } }, { refreshBoard: true });
  };

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
        parsed.getFullYear() === new Date().getFullYear()
          ? undefined
          : 'numeric',
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
      (target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
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

  const isDetailFieldHidden = (key: string) => hiddenDetailFields.includes(key);

  const toggleDetailField = (key: string) =>
    setHiddenDetailFields((hidden) =>
      hidden.includes(key)
        ? hidden.filter((candidate) => candidate !== key)
        : [...hidden, key],
    );

  // Read-first like the record page: click to edit, click anywhere outside
  // to save and return to view. Blur carries the ref mirror rather than the
  // state draft: the last keystroke's setState may not have flushed when the
  // blur handler runs, and saving a stale closure would unwrite it.
  // Not through update(): a failed save keeps the editor open with the draft
  // intact, so the text is still there to retry — update() would already have
  // reloaded and wiped it.
  const saveDescription = async (markdown: string) => {
    if (markdown === storedDescription) {
      setIsEditingDescription(false);
      setDescriptionDraft(null);

      return;
    }

    setIsSaving(true);

    try {
      await postAppRoute(UPDATE_ISSUE_ROUTE_PATH, {
        issueId,
        data: { description: buildRichTextValue(markdown) },
      });
      setActionError(null);
      setDescriptionDraft(null);
      setIsEditingDescription(false);
      await reload();
    } catch (error) {
      const message = readErrorText(error);
      setActionError(message);
      void enqueueSnackbar({ message, variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // The board deep link: opening it lands on the board with this issue's
  // modal open. The button hides when the host did not report the page path.
  const copyIssueLink = () => {
    if (boardPath === null) {
      return;
    }

    void copyToClipboard(
      buildBoardIssueUrl({
        baseUrl: readRecordPageBaseUrl(),
        boardPath,
        issueId,
      }),
    )
      .then(() =>
        enqueueSnackbar({ message: t('Link copied'), variant: 'success' }),
      )
      .catch((error: unknown) =>
        enqueueSnackbar({ message: readErrorText(error), variant: 'error' }),
      );
  };

  const createSubtask = () => {    const title = subtaskDraft.trim();

    if (title === '' || projectId === null) {
      return;
    }

    setIsSaving(true);
    postAppRoute(CREATE_ISSUE_ROUTE_PATH, {
      projectId,
      data: {
        title,
        issueType: 'SUBTASK',
        parentId: issueId,
        statusId: issue.statusId,
      },
    })
      .then(() => {
        setSubtaskDraft('');
        setActionError(null);
        return reload();
      })
      .then(() => onCardChanged())
      .catch((error: unknown) => {
        const message = readErrorText(error);
        setActionError(message);
        void enqueueSnackbar({ message, variant: 'error' });
      })
      .finally(() => setIsSaving(false));
  };

  // Attaching an existing issue instead of creating one: only its parent
  // pointer moves — project, type and status stay exactly as they were. The
  // server checks write access on the linked row, so a row outside the
  // caller's grants fails loudly rather than linking silently. Shares the
  // subtask input with creation: picking a result links, the Create row (or
  // Enter on no match) creates.
  const linkSubtask = (picked: BoardIssue) => {
    setSubtaskDraft('');
    setIsSaving(true);
    postAppRoute(UPDATE_ISSUE_ROUTE_PATH, {
      issueId: picked.id,
      data: { parentId: issueId },
    })
      .then(() => {
        setActionError(null);
        return reload();
      })
      .then(() => onCardChanged())
      .catch((error: unknown) => {
        const message = readErrorText(error);
        setActionError(message);
        void enqueueSnackbar({ message, variant: 'error' });
      })
      .finally(() => setIsSaving(false));
  };

  // Detaching a subtask clears its parent pointer — the row itself is never
  // deleted here. Same write path as linking, mirrored: the server checks
  // write access on the detached row.
  const unlinkSubtask = (childId: string) => {
    setIsSaving(true);
    postAppRoute(UPDATE_ISSUE_ROUTE_PATH, {
      issueId: childId,
      data: { parentId: null },
    })
      .then(() => {
        setActionError(null);
        return reload();
      })
      .then(() => onCardChanged())
      .catch((error: unknown) => {
        const message = readErrorText(error);
        setActionError(message);
        void enqueueSnackbar({ message, variant: 'error' });
      })
      .finally(() => setIsSaving(false));
  };

  // Detaching the parent clears this issue's own pointer. Only an unlink —
  // deleting the parent record itself is never offered from its child.
  const detachParent = () => {
    void update({ data: { parentId: null } });
  };

  return (
    <TaskBoardDetailFrame onClose={onClose} focusKey={issueId}>
      <div
        style={{
          alignItems: 'center',
          borderBottom: `1px solid ${TASK_TOKENS.borderLight}`,
          display: 'flex',
          gap: 8,
          padding: '16px 20px 12px 20px',
        }}
      >
        <TaskTag color={typeOption?.color ?? 'blue'}>
          {typeOption?.label ?? issue.issueType ?? t('Task')}
        </TaskTag>
        <span
          style={{
            color: TASK_TOKENS.textTertiary,
            fontFamily: TASK_TOKENS.fontFamily,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {issue.issueKey ?? ''}
        </span>
        <span style={{ flex: 1 }} />
        <TaskIconButton
          label={t('Previous issue')}
          onClick={() => previousIssueId !== undefined && onSelectIssue(previousIssueId)}
          isDisabled={previousIssueId === undefined}
        >
          <IconChevronLeft size={16} />
        </TaskIconButton>
        <TaskIconButton
          label={t('Next issue')}
          onClick={() => nextIssueId !== undefined && onSelectIssue(nextIssueId)}
          isDisabled={nextIssueId === undefined}
        >
          <IconChevronRight size={16} />
        </TaskIconButton>
        {/* Jira's "open as full page": leaves the board for the record's own
            page, where host widgets like the field table live. */}
        <TaskIconButton
          label={t('Open full page')}
          onClick={() =>
            void navigate(AppPath.RecordShowPage, {
              objectNameSingular: 'issue',
              objectRecordId: issueId,
            })
          }
        >
          <IconExternalLink size={16} />
        </TaskIconButton>
        {boardPath !== null && (
          <TaskIconButton label={t('Copy link to issue')} onClick={copyIssueLink}>
            <IconLink size={16} />
          </TaskIconButton>
        )}
        <TaskIconButton label={t('Close')} onClick={onClose}>
          <IconX size={16} />
        </TaskIconButton>
      </div>

      <div style={{ display: 'flex', gap: 20, minHeight: 0, flex: 1, padding: '12px 20px 20px 20px' }}>
        <div
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            gap: 16,
            minHeight: 0,
            minWidth: 0,
            overflowY: 'auto',
            ...TASK_THIN_SCROLLBAR_STYLE,
          }}
        >
          {isEditingTitle ? (
            <TaskTextInput
              ariaLabel={t('Title')}
              value={currentTitle}
              shouldAutoFocus
              onChange={setTitleDraft}
              onEnter={() => {
                setIsEditingTitle(false);
                setTitleDraft(null);
                void update({ data: { title: currentTitle } }, { refreshBoard: true });
              }}
              onBlur={() => {
                setIsEditingTitle(false);

                if (currentTitle !== (issue.title ?? '')) {
                  setTitleDraft(null);
                  void update({ data: { title: currentTitle } }, { refreshBoard: true });
                } else {
                  setTitleDraft(null);
                }
              }}
            />
          ) : (
            <button
              type="button"
              title={t('Edit title')}
              onClick={() => {
                setTitleDraft(issue.title ?? '');
                setIsEditingTitle(true);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                borderRadius: TASK_TOKENS.radiusSmall,
                color: TASK_TOKENS.textPrimary,
                cursor: 'text',
                fontFamily: TASK_TOKENS.fontFamily,
                fontSize: 20,
                fontWeight: 600,
                lineHeight: '28px',
                margin: 0,
                padding: '4px 8px',
                textAlign: 'left',
                width: '100%',
              }}
            >
              {issue.title ?? t('(No title)')}
            </button>
          )}

          <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <SectionHeading label={t('Description')} />
            {isEditingDescription ? (
              <div
                style={{
                  background: TASK_TOKENS.background,
                  border: `1px solid ${TASK_TOKENS.accent}`,
                  borderRadius: TASK_TOKENS.radius,
                  boxShadow: `0 0 0 3px ${TASK_TOKENS.accentSoft}`,
                  boxSizing: 'border-box',
                  display: 'flex',
                  width: '100%',
                }}
              >
                <TaskRichTextEditor
                    value={currentDescription}
                    onChange={(next) => {
                      setDescriptionDraft(next);
                      pendingDescriptionRef.current = next;
                    }}
                    onBlur={() =>
                      void saveDescription(
                        pendingDescriptionRef.current ?? currentDescription,
                      )
                    }
                    placeholder={t('Describe the issue…')}
                    minHeight={180}
                    issueId={issueId}
                  />
              </div>
            ) : (
              <div
                role="button"
                tabIndex={0}
                title={t('Edit')}
                onClick={() => {
                  setDescriptionDraft(storedDescription);
                  pendingDescriptionRef.current = storedDescription;
                  setIsEditingDescription(true);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    setDescriptionDraft(storedDescription);
                    pendingDescriptionRef.current = storedDescription;
                    setIsEditingDescription(true);
                  }
                }}
                style={{ cursor: 'text', minHeight: 120 }}
              >
                {currentDescription.trim() === '' ? (
                  <DescriptionEmptyBox />
                ) : (
                  <div style={{ padding: '4px 8px' }}>
                    <TaskRichTextEditor value={currentDescription} isReadOnly />
                  </div>
                )}
              </div>
            )}
          </section>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <SectionHeading
              label={t('Subtasks')}
              count={data.childIssues.length}
            />
            {data.childIssues.map((child) => (
              <TaskSubtaskRow
                key={child.id}
                row={child}
                statusName={statusNameById.get(child.statusId ?? '') ?? null}
                statusColor={
                  data.issueStatuses.find((candidate) => candidate.id === child.statusId)?.color ??
                  null
                }
                ownerName={
                  child.assigneeId === null || child.assigneeId === undefined
                    ? null
                    : readMemberName(membersById, child.assigneeId, t('Unknown'))
                }
                ownerAvatarUrl={membersById.get(child.assigneeId ?? '')?.avatarUrl}
                onOpen={() => onSelectIssue(child.id)}
                onUnlink={() => unlinkSubtask(child.id)}
                unlinkLabel={t('Remove subtask link')}
              />
            ))}
            <TaskIssueSearch
              value={subtaskDraft}
              onChange={setSubtaskDraft}
              onSelectIssue={linkSubtask}
              onCreateNew={createSubtask}
              isShortcutEnabled={false}
              ariaLabel={t('New subtask title')}
              placeholder={t('Add a subtask…')}
              excludeIds={unlinkableIds}
              maxWidth="100%"
            />
          </section>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <SectionHeading label={t('Activity')} />
            <TaskTabs
              value={activityTab}
              onChange={setActivityTab}
              tabs={[
                { value: 'comments', label: t('Comments'), count: data.issueComments.length },
                { value: 'worklogs', label: t('Worklogs'), count: data.worklogs.length },
                { value: 'history', label: t('History') },
              ]}
            />
            <TaskStatusLine text={actionError} tone="danger" />
            {activityTab === 'comments' ? (
              <IssueCommentList
                issueId={issueId}
                baseUrl={readRecordPageBaseUrl()}
                comments={data.issueComments}
                membersById={membersById}
                currentMemberId={data.currentWorkspaceMemberId}
                highlightedCommentId={null}
                isBusy={isSaving}
                onCreate={(input) =>
                  void runFeedAction(() =>
                    postAppRoute(CREATE_ISSUE_COMMENT_ROUTE_PATH, {
                      issueId,
                      bodyV2: buildRichTextValue(input.markdown),
                      ...(input.parentCommentId === undefined
                        ? {}
                        : { parentCommentId: input.parentCommentId }),
                    }),
                  )
                }
                onUpdate={(commentId, markdown) =>
                  void runFeedAction(() =>
                    postAppRoute(UPDATE_ISSUE_COMMENT_ROUTE_PATH, {
                      issueCommentId: commentId,
                      data: { bodyV2: buildRichTextValue(markdown) },
                    }),
                  )
                }
                onDelete={(commentId) =>
                  void runFeedAction(() =>
                    postAppRoute(DELETE_ISSUE_COMMENT_ROUTE_PATH, {
                      issueCommentId: commentId,
                    }),
                  )
                }
              />
            ) : activityTab === 'worklogs' ? (
              <IssueWorklogList
                issueId={issueId}
                baseUrl={readRecordPageBaseUrl()}
                worklogs={data.worklogs}
                membersById={membersById}
                currentMemberId={data.currentWorkspaceMemberId}
                highlightedWorklogId={null}
                totalMinutes={issue.timeSpentMinutes}
                originalEstimateMinutes={issue.originalEstimateMinutes}
                isBusy={isSaving}
                onCreate={(input) =>
                  void runFeedAction(() =>
                    postAppRoute(CREATE_WORKLOG_ROUTE_PATH, {
                      issueId,
                      data: {
                        timeSpentMinutes: input.timeSpentMinutes,
                        description: input.description,
                        startedAt: input.startedAt,
                      },
                    }),
                  )
                }
                onUpdateDescription={(worklogId, description) =>
                  void runFeedAction(() =>
                    postAppRoute(UPDATE_WORKLOG_ROUTE_PATH, {
                      worklogId,
                      data: { description },
                    }),
                  )
                }
                onDelete={(worklogId) =>
                  void runFeedAction(() =>
                    postAppRoute(DELETE_WORKLOG_ROUTE_PATH, { worklogId }),
                  )
                }
              />
            ) : (
              <IssueHistoryList
                histories={data.issueHistories}
                membersById={membersById}
                statusNameById={statusNameById}
              />
            )}
          </section>
        </div>

        <aside
          style={{
            borderLeft: `1px solid ${TASK_TOKENS.borderLight}`,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            gap: 4,
            minHeight: 0,
            minWidth: 0,
            overflowX: 'hidden',
            overflowY: 'auto',
            ...TASK_THIN_SCROLLBAR_STYLE,
            paddingLeft: 16,
            width: 320,
          }}
        >
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <SectionHeading label={t('Details')} />
            <span style={{ position: 'relative', display: 'inline-flex' }}>
              <TaskIconButton
                label={t('Show and hide fields')}
                onClick={() => setIsFieldsMenuOpen(!isFieldsMenuOpen)}
              >
                <IconSettings size={16} />
              </TaskIconButton>
              {isFieldsMenuOpen && (
                <twenty-overlay offsetX={-180} offsetY={28} onClose={() => setIsFieldsMenuOpen(false)}>
                  <div
                    role="menu"
                    aria-label={t('Show and hide fields')}
                    style={{
                      background: TASK_TOKENS.background,
                      border: `1px solid ${TASK_TOKENS.border}`,
                      borderRadius: TASK_TOKENS.radiusSmall,
                      boxShadow: TASK_TOKENS.shadowStrong,
                      boxSizing: 'border-box',
                      maxHeight: 320,
                      overflowY: 'auto',
                      ...TASK_THIN_SCROLLBAR_STYLE,
                      padding: 4,
                      width: 200,
                    }}
                  >
                    {detailFieldOptions.map((field) => {
                      const isHidden = isDetailFieldHidden(field.key);

                      return (
                        <button
                          key={field.key}
                          type="button"
                          role="menuitemcheckbox"
                          aria-checked={!isHidden}
                          onClick={() => toggleDetailField(field.key)}
                          style={{
                            alignItems: 'center',
                            background: 'transparent',
                            border: 'none',
                            borderRadius: TASK_TOKENS.radiusSmall,
                            color: TASK_TOKENS.textPrimary,
                            cursor: 'pointer',
                            display: 'flex',
                            fontFamily: TASK_TOKENS.fontFamily,
                            fontSize: 13,
                            gap: 8,
                            minHeight: 32,
                            padding: '0 8px',
                            textAlign: 'left',
                            width: '100%',
                          }}
                        >
                          <TaskCheckbox isChecked={!isHidden} />
                          {field.label}
                        </button>
                      );
                    })}
                  </div>
                </twenty-overlay>
              )}
            </span>
          </div>
          {/* Jira draws Details as one bordered card, not bare rows on the
              page: the card is what groups the rows into a panel. */}
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
          {!isDetailFieldHidden('status') && (
          <TaskFieldRow label={t('Status')} Icon={IconProgressCheck}>
            <TaskRelationSelect
              ariaLabel={t('Status')}
              placeholder={t('Status')}
              {...buildOpenProps('status')}
              emptyOptionLabel={t('No status')}
              value={issue.statusId ?? null}
              options={buildTagOptions({
                emptyLabel: t('No status'),
                rows: data.issueStatuses,
              })}
              onChange={(statusId) => setRelation('statusId', statusId)}
            />
          </TaskFieldRow>
          )}
          {!isDetailFieldHidden('type') && (
          <TaskFieldRow label={t('Type')} Icon={IconTag}>
            <TaskRelationSelect
              ariaLabel={t('Type')}
              placeholder={t('Type')}
              {...buildOpenProps('type')}
              emptyOptionLabel={t('No type')}
              value={issue.issueType ?? null}
              options={ISSUE_TYPE_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
                chip: <TaskTag color={option.color}>{option.label}</TaskTag>,
              }))}
              onChange={(issueType) =>
                void update({ data: { issueType } }, { refreshBoard: true })
              }
            />
          </TaskFieldRow>
          )}
          {!isDetailFieldHidden('priority') && (
          <TaskFieldRow label={t('Priority')} Icon={IconFlag}>
            <TaskRelationSelect
              ariaLabel={t('Priority')}
              placeholder={t('Priority')}
              {...buildOpenProps('priority')}
              emptyOptionLabel={t('No priority')}
              value={issue.priority ?? null}
              options={ISSUE_PRIORITY_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
                chip: <TaskTag color={option.color}>{option.label}</TaskTag>,
              }))}
              onChange={(priority) =>
                void update({ data: { priority } }, { refreshBoard: true })
              }
            />
          </TaskFieldRow>
          )}
          {!isDetailFieldHidden('assignee') && (
          <TaskFieldRow label={t('Assignee')} Icon={IconUserCircle}>
            <TaskRelationSelect
              ariaLabel={t('Assignee')}
              placeholder={t('Assignee')}
              {...buildOpenProps('assignee')}
              emptyOptionLabel={t('Unassigned')}
              value={issue.assigneeId ?? null}
              options={buildMemberOptions(issue.assigneeId ?? null)}
              onChange={(assigneeId) => setRelation('assigneeId', assigneeId)}
            />
          </TaskFieldRow>
          )}
          {!isDetailFieldHidden('reporter') && (
          <TaskFieldRow label={t('Reporter')} Icon={IconUserCircle}>
            <TaskRelationSelect
              ariaLabel={t('Reporter')}
              placeholder={t('Reporter')}
              {...buildOpenProps('reporter')}
              emptyOptionLabel={t('Unassigned')}
              value={issue.reporterId ?? null}
              options={buildMemberOptions(issue.reporterId ?? null)}
              onChange={(reporterId) => setRelation('reporterId', reporterId)}
            />
          </TaskFieldRow>
          )}
          {!isDetailFieldHidden('sprint') && (
          <TaskFieldRow label={t('Sprint')} Icon={IconRocket}>
            <TaskRelationSelect
              ariaLabel={t('Sprint')}
              placeholder={t('Sprint')}
              {...buildOpenProps('sprint')}
              emptyOptionLabel={t('No sprint')}
              value={issue.sprintId ?? null}
              options={buildTagOptions({
                emptyLabel: t('No sprint'),
                rows: data.sprints,
              })}
              onChange={(sprintId) => setRelation('sprintId', sprintId)}
            />
          </TaskFieldRow>
          )}
          {!isDetailFieldHidden('epic') && (
          <TaskFieldRow label={t('Epic')} Icon={IconStack2}>
            <TaskRelationSelect
              ariaLabel={t('Epic')}
              placeholder={t('Epic')}
              {...buildOpenProps('epic')}
              emptyOptionLabel={t('No epic')}
              value={issue.epicId ?? null}
              options={buildTagOptions({
                emptyLabel: t('No epic'),
                rows: data.epics,
              })}
              onChange={(epicId) => setRelation('epicId', epicId)}
            />
          </TaskFieldRow>
          )}
          {!isDetailFieldHidden('labels') && (
          <TaskFieldRow label={t('Labels')} Icon={IconTags}>
            <LabelPicker
              selected={(issue.labels ?? []) as string[]}
              isOpen={openField === 'labels'}
              onOpenChange={(isOpen) => setOpenField(isOpen ? 'labels' : null)}
              onChange={(labels) => void update({ data: { labels } })}
              overlayOffsetX={-10}
            />
          </TaskFieldRow>
          )}
          {!isDetailFieldHidden('points') && (
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
                    <span
                      style={{
                        color: TASK_TOKENS.textTertiary,
                        fontSize: 12,
                      }}
                    >
                      {` ${t('pts')}`}
                    </span>
                  </span>
                ) : (
                  <span style={{ color: TASK_TOKENS.textLight }}>
                    {t('None')}
                  </span>
                )}
              </DetailReadButton>
            )}
          </TaskFieldRow>
          )}
          {!isDetailFieldHidden('dueDate') && (
          <TaskFieldRow label={t('Due date')} Icon={IconCalendarEvent}>
            <div style={{ minWidth: 0, position: 'relative', width: '100%' }}>
              <DetailReadButton
                label={t('Edit due date')}
                onOpen={() => setIsDuePickerOpen(true)}
              >
                {(() => {
                  const label = readDueLabel(issue.dueDate);
                  const overdue = isDueOverdue(issue.dueDate);

                  return label === null ? (
                    <span style={{ color: TASK_TOKENS.textLight }}>
                      {t('No due date')}
                    </span>
                  ) : (
                    <span
                      style={{
                        alignItems: 'center',
                        color: overdue
                          ? TASK_TOKENS.textDanger
                          : TASK_TOKENS.textPrimary,
                        display: 'inline-flex',
                        fontWeight: overdue ? 600 : 400,
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
                          overdue
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
                        {label}
                      </span>
                    </span>
                  );
                })()}
              </DetailReadButton>
              {isDuePickerOpen && (
                // Right-aligned flush with the modal's right edge like every
                // other Details dropdown: the 264px card against the 170px
                // value column needs -72 to land 8px inside the dialog border.
                <twenty-overlay
                  offsetX={-72}
                  offsetY={28}
                  onClose={() => setIsDuePickerOpen(false)}
                >
                  <TaskDueDatePicker
                    value={
                      typeof issue.dueDate === 'string' ? issue.dueDate : null
                    }
                    onDone={saveDueDate}
                    onClear={clearDueDate}
                    onClose={() => setIsDuePickerOpen(false)}
                  />
                </twenty-overlay>
              )}
            </div>
          </TaskFieldRow>
          )}
          </div>

          {!isDetailFieldHidden('timeTracking') && (
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
                display: 'flex',
                gap: 6,
                color: TASK_TOKENS.textSecondary,
                fontFamily: TASK_TOKENS.fontFamily,
                fontSize: 12,
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
              {!isEditingEstimate && (
                <TaskIconButton
                  label={t('Edit estimate')}
                  onClick={() => {
                    setEstimateDraft(
                      estimate === null ? '' : String(estimate),
                    );
                    setIsEditingEstimate(true);
                  }}
                >
                  <IconPencil size={14} />
                </TaskIconButton>
              )}
            </div>
            {isEditingEstimate ? (
              <div style={{ display: 'flex', gap: 8 }}>
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
              </div>
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
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <TaskButton size="small" onClick={() => setActivityTab('worklogs')}>
                {t('Log work')}
              </TaskButton>
            </div>
          </div>
          )}

          {typeof issue.parentId === 'string' && data.parentIssue !== null && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 12 }}>
              <SectionHeading label={t('Parent')} />
              <TaskSubtaskRow
                row={data.parentIssue}
                statusName={statusNameById.get(data.parentIssue.statusId ?? '') ?? null}
                statusColor={
                  data.issueStatuses.find(
                    (candidate) => candidate.id === data.parentIssue?.statusId,
                  )?.color ?? null
                }
                ownerName={null}
                onOpen={() => onSelectIssue(data.parentIssue?.id ?? issueId)}
                onUnlink={detachParent}
                unlinkLabel={t('Remove parent link')}
              />
            </div>
          )}

          <TaskStatusLine
            text={actionError ?? (isSaving ? t('Saving...') : null)}
            tone={actionError === null ? 'muted' : 'danger'}
          />
        </aside>
      </div>
    </TaskBoardDetailFrame>
  );
};

// The modal shell: a centered dialog over a backdrop. It MUST render inside
// the host's <twenty-overlay> (see task-board.front-component.tsx), not
// inline in the board: the overlay's children portal to the document body,
// outside the page-layout scroll wrapper whose `container-type: size` traps
// every `position: fixed` inside the content box — an inline modal centers on
// the board area, right of the sidebar, instead of on the viewport. Inside
// the portal `fixed` resolves against the true viewport, and Escape/outside
// click come free from the host's own handlers.
//
// Dialog sizing is viewport-relative for the same reason: the portal wrapper
// carries no height of its own, so percentage heights have nothing to resolve
// against. unitless numbers stay for the icon-sized boxes only.
const TaskBoardDetailFrame = ({
  children,
  onClose,
  focusKey,
}: {
  children: React.ReactNode;
  onClose: () => void;
  focusKey: string;
}) => {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // autoFocus is a no-op on the sandbox's custom elements, so the dialog is
  // focused by hand: Escape only reaches onKeyDown from inside it. Stepping
  // to another issue re-renders the header buttons and drops focus to the
  // body, hence the key.
  useEffect(() => {
    dialogRef.current?.focus();
  }, [focusKey]);

  return (
  <div
    style={{
      alignItems: 'center',
      display: 'flex',
      inset: 0,
      justifyContent: 'center',
      padding: 32,
      position: 'fixed',
      zIndex: 60,
    }}
  >
    <div
      onClick={onClose}
      style={{
        background: 'rgba(0,0,0,0.45)',
        inset: 0,
        position: 'fixed',
      }}
    />
    <div
      ref={dialogRef}
      role="dialog"
      aria-label={t('Issue detail')}
      aria-modal="true"
      tabIndex={-1}
      onKeyDown={(event) => {
        // The wrapping overlay carries no onClose (a nested dropdown's
        // portal counts as "outside" to the host, so it would dismiss the
        // modal on every pick) — Escape is handled here instead. A dropdown
        // open above stops the event on the host side first, so Escape
        // closes the topmost layer only, the way stacked modals behave.
        if (event.key === 'Escape') {
          onClose();
        }
      }}
      style={{
        background: TASK_TOKENS.background,
        border: `1px solid ${TASK_TOKENS.borderLight}`,
        borderRadius: 12,
        boxShadow: TASK_TOKENS.shadowStrong,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: TASK_TOKENS.fontFamily,
        height: 'min(860px, calc(100vh - 64px))',
        maxWidth: '100%',
        minHeight: 0,
        position: 'relative',
        width: 'min(1280px, calc(100vw - 48px))',
        zIndex: 61,
      }}
    >
      {children}
    </div>
  </div>
  );
};

// Shared with the record page's unified left column so both read as the same
// Jira-style sections rather than drifting apart one edit at a time.
export const SectionHeading = ({
  label,
  count,
}: {
  label: string;
  count?: number;
}) => (
  <h3
    style={{
      color: TASK_TOKENS.textTertiary,
      fontFamily: TASK_TOKENS.fontFamily,
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: 0.4,
      margin: 0,
      textTransform: 'uppercase',
    }}
  >
    {label}
    {count !== undefined ? ` (${count})` : ''}
  </h3>
);

// A Details value as Twenty draws one: no box on the row, just the value over
// a tint on hover. Clicking swaps in the real editor (a TaskTextInput, the due
// date picker), so the panel reads like the host's own field
// list instead of a column of browser boxes.
const DetailReadButton = ({
  label,
  children,
  onOpen,
}: {
  label: string;
  children: React.ReactNode;
  onOpen: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onOpen}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        alignItems: 'center',
        background: isHovered ? TASK_TOKENS.backgroundHover : 'transparent',
        border: 'none',
        borderRadius: TASK_TOKENS.radius,
        color: TASK_TOKENS.textPrimary,
        cursor: 'pointer',
        display: 'flex',
        fontFamily: TASK_TOKENS.fontFamily,
        fontSize: 13,
        minHeight: 24,
        minWidth: 0,
        overflow: 'hidden',
        padding: '0 4px',
        textAlign: 'left',
        width: '100%',
      }}
    >
      {children}
    </button>
  );
};

// Labels are a multi-select, and no shared multi picker exists —
// TaskRelationSelect is single-valued — so the drawer owns this small
// checkbox dropdown. Options come from the app's label catalogue, so a label
// stays spelled and coloured the same everywhere.
const LabelPicker = ({
  selected,
  isOpen,
  onOpenChange,
  onChange,
  overlayOffsetX = -4,
}: {
  selected: string[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onChange: (labels: string[]) => void;
  overlayOffsetX?: number;
}) => {
  const [search, setSearch] = useState('');
  const term = search.trim().toLowerCase();
  const matches = ISSUE_LABEL_OPTIONS.filter((option) =>
    option.label.toLowerCase().includes(term),
  );

  return (
    <div style={{ minWidth: 0, width: '100%' }}>
      <button
        type="button"
        aria-label={t('Labels')}
        aria-expanded={isOpen}
        onClick={() => onOpenChange(!isOpen)}
        style={{
          alignItems: 'center',
          background: 'transparent',
          border: 'none',
          borderRadius: TASK_TOKENS.radius,
          cursor: 'pointer',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
          minHeight: 24,
          padding: '0 4px',
          textAlign: 'left',
          width: '100%',
        }}
      >
        {selected.length === 0 ? (
          <span style={{ color: TASK_TOKENS.textLight, fontSize: 13 }}>
            {t('Labels')}
          </span>
        ) : (
          selected.map((value) => {
            const option = ISSUE_LABEL_OPTIONS.find(
              (candidate) => candidate.value === value,
            );

            return (
              <TaskTag key={value} color={option?.color ?? 'gray'}>
                {option?.label ?? value}
              </TaskTag>
            );
          })
        )}
      </button>
      {isOpen && (
        <twenty-overlay offsetY={-4} offsetX={overlayOffsetX} onClose={() => onOpenChange(false)}>
          <div
            style={{
              background: TASK_TOKENS.background,
              border: `1px solid ${TASK_TOKENS.borderLight}`,
              borderRadius: TASK_TOKENS.radiusSmall,
              boxShadow: TASK_TOKENS.shadowStrong,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              width: 202,
            }}
          >
            <div
              style={{
                borderBottom: `1px solid ${TASK_TOKENS.borderLight}`,
                padding: 8,
              }}
            >
              <TaskTextInput
                ariaLabel={t('Search labels')}
                placeholder={t('Search')}
                value={search}
                onChange={setSearch}
              />
            </div>
            <div style={{ maxHeight: 180, overflowY: 'auto', ...TASK_THIN_SCROLLBAR_STYLE, padding: 4 }}>
              {matches.map((option) => {
                const isChecked = selected.includes(option.value);

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="checkbox"
                    aria-checked={isChecked}
                    onClick={() =>
                      onChange(
                        isChecked
                          ? selected.filter((value) => value !== option.value)
                          : [...selected, option.value],
                      )
                    }
                    style={{
                      alignItems: 'center',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: TASK_TOKENS.radiusSmall,
                      cursor: 'pointer',
                      display: 'flex',
                      fontFamily: TASK_TOKENS.fontFamily,
                      fontSize: 13,
                      gap: 8,
                      minHeight: 32,
                      padding: '0 6px',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <TaskCheckbox isChecked={isChecked} />
                    <TaskTag color={option.color}>{option.label}</TaskTag>
                  </button>
                );
              })}
            </div>
          </div>
        </twenty-overlay>
      )}
    </div>
  );
};
