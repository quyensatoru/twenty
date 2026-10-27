import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AppPath,
  copyToClipboard,
  enqueueSnackbar,
  navigate,
  openSidePanelPage,
  SidePanelPages,
  t,
  useFrontComponentExecutionContext,
} from 'twenty-sdk/front-component';
import {
  IconArrowsDiagonal,
  IconCalendar,
  IconChevronDown,
  IconChevronRight,
  IconChevronUp,
  IconLink,
  IconPlus,
  IconSparkles,
  IconX,
} from 'twenty-ui/icon';

import { ISSUE_PRIORITY_OPTIONS } from '../../constants/issue-priority-options';
import { ISSUE_TYPE_OPTIONS } from '../../constants/issue-type-options';
import { readShortDate } from '../utils/read-due-date.util';
import { TaskAvatar } from './task-avatar';
import {
  DETAIL_MAIN_PADDING,
  DETAIL_PAGE_MAIN_PADDING,
  DETAIL_SIDE_PADDING,
  PAGE_ISSUE_COLUMN_MIN_WIDTH,
  readModalSideColumnWidth,
  readPageSideColumnWidth,
} from './task-detail-layout';
import { TaskChip } from './task-chip';
import { TaskPriorityGlyph } from './task-priority-glyph';
import { type ProductItem } from '../../types/product-backlog';
import { type BoardIssue } from '../../types/task-board';
import {
  CREATE_ISSUE_COMMENT_ROUTE_PATH,
  CREATE_ISSUE_ROUTE_PATH,
  CREATE_WORKLOG_ROUTE_PATH,
  DELETE_ISSUE_COMMENT_ROUTE_PATH,
  DELETE_ISSUE_ROUTE_PATH,
  DELETE_WORKLOG_ROUTE_PATH,
  UPDATE_ISSUE_COMMENT_ROUTE_PATH,
  UPDATE_ISSUE_ROUTE_PATH,
  UPDATE_WORKLOG_ROUTE_PATH,
} from '../../constants/route-paths';
import { buildRichTextValue } from '../../utils/read-rich-text-plain-value.util';
import {
  buildBoardIssueUrl,
  buildRecordUrl,
} from '../utils/build-record-url.util';
import { useHiddenDetailFields } from '../hooks/use-hidden-detail-fields';
import { useIsMobile } from '../hooks/use-is-mobile';
import { useStoredSideColumnWidth } from '../hooks/use-side-column-resize';
import {
  type IssueCommentRow,
  useIssueDetail,
} from '../hooks/use-issue-detail';
import { postAppRoute } from '../utils/post-app-route.util';
import { readErrorText } from '../utils/read-error-text.util';
import { readMemberName } from '../utils/read-member-name.util';
import { readRecordPageBaseUrl } from '../utils/read-record-page-base-url.util';
import { parseActivityAnchor } from '../utils/parse-activity-anchor.util';
import { parseBoardActivityAnchor } from '../utils/parse-board-anchor.util';
import { useDiscussionState } from '../hooks/use-discussion-state';
import { buildMembersById } from '../utils/build-members-by-id.util';
import { isPlainPrimaryPress } from '../utils/is-plain-primary-press.util';
import { IssueAiActivityTab } from './issue-ai-activity-tab';
import { TaskActionMenu } from './task-action-menu';
import { IssueCommentList } from './issue-comment-list';
import { IssueDevelopment } from './issue-development-panel';
import { IssueDetailsPanel } from './issue-details-panel';
import { IssueProductPanel } from './issue-product-panel';
import {
  IssueRecordPreview,
  type IssueRecordPreviewTarget,
} from './issue-record-preview';
import { IssueHistoryList } from './issue-history-list';
import { IssueWorklogList } from './issue-worklog-list';
import { IssueModalSummary } from './issue-modal-summary';
import { TaskAttachmentsSection } from './task-attachments-section';
import { IssueTypeGlyph } from './task-board-card';
import { TaskButton } from './task-button';
import {
  TASK_EDITING_RICH_TEXT_FRAME_STYLE,
  TASK_DESCRIPTION_MIN_HEIGHT,
  TASK_RICH_TEXT_READING_PADDING,
} from './task-control-styles';
import { TaskIconButton } from './task-icon-button';
import { TaskIssueSearch } from './task-issue-search';
import { TaskMessage } from './task-message';
import { TaskBoardDetailSkeleton } from './task-board-skeleton';
import { TaskProgressBar } from './task-progress-bar';
import { TaskRichTextEditor } from './task-rich-text-editor';
import { TaskRichTextLinkChipsScope } from './task-rich-text-link-chips-scope';
import { TaskResizableColumns } from './task-resizable-columns';
import { TaskStatusLine } from './task-status-line';
import { readStatusGlyph, TaskStatusIcon } from './task-status-icon';
import { TaskSortToggle } from './task-sort-toggle';
import { TaskSubtaskRow } from './task-subtask-row';
import { TaskTabs } from './task-tabs';
import { TaskTextInput } from './task-text-input';
import {
  readTagColor,
  TASK_THIN_SCROLLBAR_STYLE,
  TASK_TOKENS,
} from './task-tokens';
import { TaskProjectBadge } from './task-toolbar';

type TaskBoardDetailProps = {
  // `page` is the issue's own record page: no backdrop or prev/next, related
  // records open in the host side panel, and the development and attachment
  // panels join the sidebar.
  presentation?: 'modal' | 'page';
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

// Jira's issue view as a modal over the board: title and description on the
// left with subtasks and the activity feed under them, the Details panel on
// the right. Every read and write goes through the app's scoped routes — the
// same ones the record page uses — so app-scope stays enforced and worklog
// time-tracking keeps recomputing.
export const TaskBoardDetail = ({
  presentation = 'modal',
  issueId,
  navIssueIds,
  onSelectIssue,
  onClose,
  boardPath,
  onCardChanged,
}: TaskBoardDetailProps) => {
  const locationHash = useFrontComponentExecutionContext(
    (context) => (context as { locationHash?: string }).locationHash ?? '',
  );
  const boardAnchor = parseBoardActivityAnchor(locationHash);
  const activityAnchor =
    presentation === 'page'
      ? parseActivityAnchor(locationHash)
      : boardAnchor?.issueId === issueId
        ? boardAnchor.activity
        : null;
  const { data, isLoading, loadError, reload } = useIssueDetail(issueId);
  const discussion = useDiscussionState(
    issueId,
    activityAnchor?.kind === 'comment' ? activityAnchor.id : null,
  );
  const isMobile = useIsMobile();
  const [recordPreview, setRecordPreview] = useState<
    (IssueRecordPreviewTarget & { issueId: string }) | null
  >(null);
  const preview = recordPreview?.issueId === issueId ? recordPreview : null;
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  // Field values just picked, shown before the server confirms them, the way
  // the record page's Details widget does: saving re-runs the issue-detail
  // route, and a chip sitting on its old value until that returns is the lag.
  const [pendingPatch, setPendingPatch] = useState<Record<string, unknown>>({});
  // Writes still in flight. The record is only re-read once the last one
  // lands: re-reading after each would paint a later pick back to its old
  // value while its own write is still on the wire.
  // oxlint-disable-next-line twenty/no-state-useref
  const pendingWriteCountRef = useRef(0);
  // oxlint-disable-next-line twenty/no-state-useref
  const currentIssueIdRef = useRef(issueId);
  currentIssueIdRef.current = issueId;
  const [activityTab, setActivityTab] = useState<
    'comments' | 'worklogs' | 'history' | 'ai'
  >(activityAnchor?.kind === 'worklog' ? 'worklogs' : 'comments');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState<string | null>(null);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState<string | null>(null);
  const [isDescriptionHovered, setIsDescriptionHovered] = useState(false);
  const [isTitleHovered, setIsTitleHovered] = useState(false);
  const [isCommentsNewestFirst, setIsCommentsNewestFirst] = useState(false);
  const [isWorklogsNewestFirst, setIsWorklogsNewestFirst] = useState(true);
  const [subtaskDraft, setSubtaskDraft] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const { sideColumnWidth, changeSideColumnWidth } = useStoredSideColumnWidth();
  // Mirrors the description draft synchronously (see saveDescription below).
  // A ref, not state: it is written on every keystroke and must never
  // repaint. Declared up here with the other hooks — anything below the
  // early loading returns would shift the hook order between renders.
  // oxlint-disable-next-line twenty/no-state-useref
  const pendingDescriptionRef = useRef<string | null>(null);
  // The remote preview container retains its first event handler across edits.
  // oxlint-disable-next-line twenty/no-state-useref
  const currentDescriptionRef = useRef('');
  // The remote element wrapper can go on answering with the mousedown/keydown
  // handler it was given on an earlier render even after the prop is set back
  // to undefined for the editing render, so Enter bubbling up from BlockNote
  // can still reach a startEditingDescription closure captured before editing
  // began — restarting the edit mid-keystroke and wiping pendingDescriptionRef
  // back to the pre-edit text. isEditingDescription itself can't guard this: a
  // stale handler closes over the value it had when it was captured, never the
  // current one, so only a ref read inside the handler sees the real state.
  // oxlint-disable-next-line twenty/no-state-useref
  const isEditingDescriptionRef = useRef(isEditingDescription);
  isEditingDescriptionRef.current = isEditingDescription;

  // The drawer stays mounted while stepping between cards, so every transient
  // edit state resets with the issue — otherwise one card's draft leaks into
  // the next. The Details panel's own drafts reset by its key instead.
  useEffect(() => {
    setRecordPreview(null);
    setPendingPatch({});
    setActionError(null);
    setIsEditingTitle(false);
    setTitleDraft(null);
    setIsEditingDescription(false);
    setDescriptionDraft(null);
    setSubtaskDraft('');
    setIsAddingSubtask(false);
  }, [issueId]);

  const { detail: displayedDetail, saveHiddenDetailFields } =
    useHiddenDetailFields({ detail: data, reload });

  const projectId =
    typeof data.issue?.projectId === 'string' ? data.issue.projectId : null;

  const membersById = useMemo(
    () =>
      buildMembersById(
        data.members,
        discussion.snapshot?.members,
        discussion.snapshot?.participants,
      ),
    [
      data.members,
      discussion.snapshot?.members,
      discussion.snapshot?.participants,
    ],
  );

  // Rows the link search must never offer: the issue itself, its current
  // children and its parent — any of them would loop the parent chain.
  const unlinkableIds = useMemo(() => {
    const ids = new Set<string>([issueId]);

    if (data.parentIssue !== null && typeof data.parentIssue.id === 'string') {
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

  // Feed writes (comments, worklogs) share one busy flag and error line, the
  // way the record page's activity panel does. They never touch the board —
  // no card renders them.
  const runFeedAction = async (action: () => Promise<unknown>) => {
    setIsSaving(true);

    try {
      await action();
      setActionError(null);
      await reload();
      await discussion.reload();
    } catch (error) {
      setActionError(readErrorText(error));
    } finally {
      setIsSaving(false);
    }
  };

  if (data.issue === null) {
    const placeholder = isLoading ? (
      <TaskBoardDetailSkeleton
        isMobile={isMobile}
        presentation={presentation}
      />
    ) : (
      <TaskMessage
        text={loadError ?? t('This issue is not available to you.')}
        tone={loadError === null ? 'neutral' : 'danger'}
      />
    );

    return presentation === 'page' ? (
      placeholder
    ) : (
      <TaskBoardDetailFrame
        onClose={onClose}
        focusKey={issueId}
        shouldFocusDialog={activityAnchor === null}
        isMobile={isMobile}
      >
        {placeholder}
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
  currentDescriptionRef.current = currentDescription;

  // Read-first like the record page: click to edit, Save or Cancel to return
  // to view. Never saved on blur: the editor blurs as the pointer goes down on
  // Cancel, so a blur save would store the text Cancel is meant to discard.
  // Save carries the ref mirror rather than the state draft: the last
  // keystroke's setState may not have flushed yet, and saving a stale closure
  // would unwrite it.
  // Returns to view at once and keeps showing what was saved. Not through
  // update(): a failed save reopens the editor with the draft intact, so the
  // text is still there to retry — update() would already have reloaded and
  // wiped it.
  const saveDescription = async (markdown: string) => {
    setIsEditingDescription(false);

    if (markdown === storedDescription) {
      setDescriptionDraft(null);

      return;
    }

    setDescriptionDraft(markdown);

    // No "Saving..." and no swap to the re-read text: the saved text is on
    // screen already, a status line blinking for the length of the request
    // reads as the modal flashing, and the server's copy of the markdown can
    // differ in whitespace, which would make the editor redraw every block.
    // The draft stays until the modal moves to another issue.
    try {
      await postAppRoute(UPDATE_ISSUE_ROUTE_PATH, {
        issueId,
        data: { description: buildRichTextValue(markdown) },
      });
      setActionError(null);

      if (currentIssueIdRef.current === issueId) {
        await reload();
      }
    } catch (error) {
      const message = readErrorText(error);
      setActionError(message);
      void enqueueSnackbar({ message, variant: 'error' });

      if (currentIssueIdRef.current === issueId) {
        setIsEditingDescription(true);
      }
    }
  };

  // Seeded from what is on screen, not the stored value: during a save the
  // stored value is still the old text. Guarded against a stale handler
  // calling this mid-edit (see isEditingDescriptionRef above) — without this
  // check, Enter bubbling up from the editor would reopen editing on the
  // pre-edit text, wiping pendingDescriptionRef's in-progress draft.
  const startEditingDescription = () => {
    if (isEditingDescriptionRef.current) {
      return;
    }

    setDescriptionDraft(currentDescriptionRef.current);
    pendingDescriptionRef.current = currentDescriptionRef.current;
    setIsEditingDescription(true);
  };

  const cancelEditingDescription = () => {
    pendingDescriptionRef.current = null;
    setDescriptionDraft(null);
    setIsEditingDescription(false);
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

  const openFullPage = () =>
    void navigate(AppPath.RecordShowPage, {
      objectNameSingular: 'issue',
      objectRecordId: issueId,
    });

  // The record page's own link, for the page presentation where there is no
  // board to deep-link into.
  const copyRecordLink = () => {
    void copyToClipboard(
      buildRecordUrl({
        baseUrl: readRecordPageBaseUrl(),
        objectNameSingular: 'issue',
        recordId: issueId,
      }),
    )
      .then(() =>
        enqueueSnackbar({ message: t('Link copied'), variant: 'success' }),
      )
      .catch((error: unknown) =>
        enqueueSnackbar({ message: readErrorText(error), variant: 'error' }),
      );
  };

  const deleteIssue = async () => {
    try {
      await postAppRoute(DELETE_ISSUE_ROUTE_PATH, { issueId });
      void enqueueSnackbar({
        message: t('Issue deleted.'),
        variant: 'success',
      });
      onCardChanged();
      onClose();
    } catch (error) {
      void enqueueSnackbar({ message: readErrorText(error), variant: 'error' });
    }
  };

  const createSubtask = () => {
    const title = subtaskDraft.trim();

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

  const recordPreviewPanel =
    preview === null ? null : (
      <IssueRecordPreview
        issueId={issueId}
        target={preview}
        merchants={data.merchants}
        onBack={() => setRecordPreview(null)}
        onSelect={(target) => setRecordPreview({ ...target, issueId })}
        onOpenIssue={(linkedIssueId) => {
          setRecordPreview(null);
          if (linkedIssueId !== issueId) onSelectIssue(linkedIssueId);
        }}
        onOpenFull={onClose}
      />
    );

  const isPage = presentation === 'page';
  const statusById = new Map(
    data.issueStatuses.map((status) => [status.id, status]),
  );
  const doneChildCount = data.childIssues.filter(
    (child) => statusById.get(child.statusId ?? '')?.category === 'DONE',
  ).length;
  const readLinkedRowProps = (row: {
    statusId?: string | null;
    assigneeId?: string | null;
  }) => {
    const status = statusById.get(row.statusId ?? '');

    return {
      statusName: status?.name ?? null,
      statusColor: status?.color ?? null,
      statusGlyph: readStatusGlyph(status, data.issueStatuses),
      isDone: status?.category === 'DONE',
      ownerName:
        typeof row.assigneeId === 'string'
          ? readMemberName(membersById, row.assigneeId, t('Unknown'))
          : null,
      ownerAvatarUrl: membersById.get(row.assigneeId ?? '')?.avatarUrl,
    };
  };
  const commentCount =
    discussion.snapshot?.comments.length ?? data.issueComments.length;
  const projectName = data.project?.name ?? null;

  const header = (
    <div
      style={{
        alignItems: 'center',
        borderBottom: isPage ? 'none' : `1px solid ${TASK_TOKENS.border}`,
        boxSizing: 'border-box',
        display: 'flex',
        flexShrink: 0,
        gap: 4,
        minHeight: isPage ? 36 : 48,
        padding: isPage
          ? '0 0 4px 0'
          : isMobile
            ? '0 8px 0 12px'
            : '0 12px 0 20px',
      }}
    >
      <span
        style={{
          alignItems: 'center',
          color: TASK_TOKENS.textTertiary,
          display: 'flex',
          flex: 1,
          fontFamily: TASK_TOKENS.fontFamily,
          fontSize: 13,
          gap: 6,
          minWidth: 0,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
      >
        <TaskProjectBadge projectKey={data.project?.key ?? null} size={18} />
        {projectName !== null && !isMobile && (
          <>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {projectName}
            </span>
            <IconChevronRight size={12} color={TASK_TOKENS.textLight} />
          </>
        )}
        <span title={typeOption?.label} style={{ display: 'inline-flex' }}>
          <IssueTypeGlyph issueType={issue.issueType ?? null} />
        </span>
        <span
          style={{
            color: TASK_TOKENS.textPrimary,
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 500,
          }}
        >
          {issue.issueKey ?? ''}
        </span>
      </span>
      {!isPage && navIndex >= 0 && navIssueIds.length > 1 && !isMobile && (
        <span
          style={{
            color: TASK_TOKENS.textTertiary,
            fontFamily: TASK_TOKENS.fontFamily,
            fontSize: 12,
            fontVariantNumeric: 'tabular-nums',
            padding: '0 6px',
          }}
        >
          {`${navIndex + 1} / ${navIssueIds.length}`}
        </span>
      )}
      {!isPage && (
        <>
          <TaskIconButton
            label={t('Previous issue')}
            onClick={() =>
              previousIssueId !== undefined && onSelectIssue(previousIssueId)
            }
            isDisabled={previousIssueId === undefined}
          >
            <IconChevronUp size={16} />
          </TaskIconButton>
          <TaskIconButton
            label={t('Next issue')}
            onClick={() =>
              nextIssueId !== undefined && onSelectIssue(nextIssueId)
            }
            isDisabled={nextIssueId === undefined}
          >
            <IconChevronDown size={16} />
          </TaskIconButton>
          <TaskHeaderDivider />
        </>
      )}
      {(isPage || boardPath !== null) && (
        <TaskIconButton
          label={t('Copy link to issue')}
          onClick={isPage ? copyRecordLink : copyIssueLink}
        >
          <IconLink size={16} />
        </TaskIconButton>
      )}
      <TaskActionMenu
        label={t('Issue actions')}
        items={[
          {
            key: 'copy-key',
            label: t('Copy issue key'),
            onSelect: () =>
              void copyToClipboard(issue.issueKey ?? '').then(() =>
                enqueueSnackbar({
                  message: t('Issue key copied'),
                  variant: 'success',
                }),
              ),
          },
          ...(!isPage && data.canSoftDelete
            ? [
                {
                  key: 'delete',
                  label: t('Delete issue'),
                  isDanger: true,
                  confirmLabel: t('Confirm delete?'),
                  onSelect: () => void deleteIssue(),
                },
              ]
            : []),
        ]}
      />
      {!isPage && (
        <>
          {/* Leaves the board for the record's own page, with the
              development and attachment panels. */}
          <TaskIconButton label={t('Open full page')} onClick={openFullPage}>
            <IconArrowsDiagonal size={16} />
          </TaskIconButton>
          <TaskIconButton label={t('Close')} onClick={onClose}>
            <IconX size={16} />
          </TaskIconButton>
        </>
      )}
    </div>
  );

  const titleBlock = isEditingTitle ? (
    <TaskTextInput
      ariaLabel={t('Title')}
      value={currentTitle}
      shouldAutoFocus
      height={40}
      onChange={setTitleDraft}
      onEnter={(value) => {
        setIsEditingTitle(false);
        setTitleDraft(null);
        void update({ data: { title: value } }, { refreshBoard: true });
      }}
      onBlur={(value) => {
        setIsEditingTitle(false);
        setTitleDraft(null);

        if (value !== (issue.title ?? '')) {
          void update({ data: { title: value } }, { refreshBoard: true });
        }
      }}
    />
  ) : (
    <button
      type="button"
      title={data.canWrite ? t('Edit title') : undefined}
      disabled={!data.canWrite}
      onClick={() => {
        setTitleDraft(issue.title ?? '');
        setIsEditingTitle(true);
      }}
      onMouseEnter={() => setIsTitleHovered(true)}
      onMouseLeave={() => setIsTitleHovered(false)}
      style={{
        background:
          data.canWrite && isTitleHovered
            ? TASK_TOKENS.backgroundHover
            : 'transparent',
        border: 'none',
        borderRadius: TASK_TOKENS.radiusSmall,
        color: TASK_TOKENS.textPrimary,
        cursor: data.canWrite ? 'text' : 'default',
        fontFamily: TASK_TOKENS.fontFamily,
        fontSize: isMobile ? 18 : 22,
        fontWeight: 600,
        letterSpacing: -0.2,
        lineHeight: isMobile ? '26px' : '30px',
        margin: '0 0 0 -8px',
        padding: '2px 8px',
        textAlign: 'left',
        width: 'calc(100% + 8px)',
      }}
    >
      {issue.title ?? t('(No title)')}
    </button>
  );

  const descriptionBlock = !data.canWrite ? (
    currentDescription.trim() === '' ? (
      <span style={{ color: TASK_TOKENS.textTertiary, fontSize: 13 }}>
        {t('No description.')}
      </span>
    ) : (
      <TaskRichTextEditor value={currentDescription} isReadOnly />
    )
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Keeping one host editor mounted avoids flashes and preserves its edit session. */}
      <div
        role={isEditingDescription ? undefined : 'button'}
        tabIndex={isEditingDescription ? undefined : 0}
        title={isEditingDescription ? undefined : t('Edit')}
        onMouseDown={
          isEditingDescription
            ? undefined
            : (event) => {
                if (isPlainPrimaryPress(event)) {
                  startEditingDescription();
                }
              }
        }
        onKeyDown={
          isEditingDescription
            ? undefined
            : (event) => {
                if (event.key === 'Enter') {
                  startEditingDescription();
                }
              }
        }
        onMouseEnter={() => setIsDescriptionHovered(true)}
        onMouseLeave={() => setIsDescriptionHovered(false)}
        style={{
          ...(isEditingDescription ? TASK_EDITING_RICH_TEXT_FRAME_STYLE : {}),
          background:
            !isEditingDescription && isDescriptionHovered
              ? TASK_TOKENS.backgroundTransparentLighter
              : 'transparent',
          borderRadius: TASK_TOKENS.radiusSmall,
          boxSizing: 'border-box',
          cursor: isEditingDescription ? 'auto' : 'text',
          display: 'flex',
          // Pulled back out by the reading padding on the left and below, so
          // the text lines up with the title and the next block keeps the
          // column's 24px rhythm; the padding only shows as the hover tint.
          margin: isEditingDescription
            ? 0
            : currentDescription.trim() === ''
              ? '0 0 0 -9px'
              : '0 0 -9px -9px',
          minHeight: isEditingDescription
            ? undefined
            : currentDescription.trim() === ''
              ? 40
              : 80,
          padding:
            isEditingDescription || currentDescription.trim() === ''
              ? 0
              : TASK_RICH_TEXT_READING_PADDING,
          width: isEditingDescription ? '100%' : 'calc(100% + 9px)',
        }}
      >
        {!isEditingDescription && currentDescription.trim() === '' ? (
          <span
            style={{
              alignItems: 'center',
              color: TASK_TOKENS.textLight,
              display: 'flex',
              fontFamily: TASK_TOKENS.fontFamily,
              fontSize: 13,
              padding: '0 9px',
            }}
          >
            {t('Add a description…')}
          </span>
        ) : (
          <TaskRichTextEditor
            value={currentDescription}
            onChange={
              isEditingDescription
                ? (next) => {
                    setDescriptionDraft(next);
                    pendingDescriptionRef.current = next;
                  }
                : undefined
            }
            isReadOnly={!isEditingDescription}
            placeholder={t('Describe the issue…')}
            minHeight={
              isEditingDescription ? TASK_DESCRIPTION_MIN_HEIGHT : undefined
            }
            issueId={issueId}
          />
        )}
      </div>
      {isEditingDescription && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <TaskButton
            size="small"
            variant="ghost"
            onClick={cancelEditingDescription}
          >
            {t('Cancel')}
          </TaskButton>
          <TaskButton
            variant="primary"
            size="small"
            onClick={() =>
              void saveDescription(
                pendingDescriptionRef.current ?? currentDescription,
              )
            }
          >
            {t('Save')}
          </TaskButton>
        </div>
      )}
    </div>
  );

  const subIssuesBlock = (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.parentIssue !== null && (
        <div
          style={{
            border: `1px solid ${TASK_TOKENS.border}`,
            borderRadius: TASK_TOKENS.radius,
            overflow: 'hidden',
          }}
        >
          <TaskSubtaskRow
            row={data.parentIssue}
            {...readLinkedRowProps(data.parentIssue)}
            isOwnerSlotShown={false}
            prefix={t('Sub-issue of')}
            onOpen={() =>
              data.parentIssue !== null && onSelectIssue(data.parentIssue.id)
            }
            onUnlink={
              data.canWrite
                ? () => void update({ data: { parentId: null } })
                : undefined
            }
            unlinkLabel={t('Remove parent link')}
          />
        </div>
      )}
      {data.childIssues.length > 0 && (
        <div
          style={{
            alignItems: 'center',
            color: TASK_TOKENS.textPrimary,
            display: 'flex',
            fontFamily: TASK_TOKENS.fontFamily,
            fontSize: 13,
            fontWeight: 600,
            gap: 10,
            minHeight: 24,
          }}
        >
          {t('Sub-issues')}
          <span
            style={{
              color: TASK_TOKENS.textTertiary,
              fontSize: 12,
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 400,
            }}
          >
            {`${doneChildCount} / ${data.childIssues.length}`}
          </span>
          <TaskProgressBar
            width={72}
            height={4}
            total={data.childIssues.length}
            segments={[
              {
                value: doneChildCount,
                color: readTagColor('green').text,
                label: t('Done'),
              },
            ]}
          />
        </div>
      )}
      {/* The same full-width list with or without sub-issues, so adding the
          first one starts from the row every later one is added from. */}
      {(data.childIssues.length > 0 || data.canWrite) && (
        <div
          style={{
            border: `1px solid ${TASK_TOKENS.border}`,
            borderRadius: TASK_TOKENS.radius,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {data.childIssues.map((child) => (
            <TaskSubtaskRow
              key={child.id}
              row={child}
              {...readLinkedRowProps(child)}
              isOwnerSlotShown={data.childIssues.some(
                (candidate) => typeof candidate.assigneeId === 'string',
              )}
              onOpen={() => onSelectIssue(child.id)}
              onUnlink={
                data.canWrite ? () => unlinkSubtask(child.id) : undefined
              }
              unlinkLabel={t('Remove subtask link')}
            />
          ))}
          {data.canWrite &&
            (isAddingSubtask ? (
              <div style={{ display: 'flex', padding: 4 }}>
                <TaskIssueSearch
                  value={subtaskDraft}
                  onChange={setSubtaskDraft}
                  onSelectIssue={linkSubtask}
                  onCreateNew={createSubtask}
                  ariaLabel={t('New subtask title')}
                  placeholder={t('Sub-issue title, or search to link one…')}
                  excludeIds={unlinkableIds}
                  maxWidth="100%"
                  size="small"
                  shouldAutoFocus
                  onDismiss={() => setIsAddingSubtask(false)}
                />
              </div>
            ) : (
              <TaskAddRow
                label={t('Add sub-issue')}
                onClick={() => setIsAddingSubtask(true)}
              />
            ))}
        </div>
      )}
    </section>
  );

  const activityBlock = (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <TaskTabs
        variant="underline"
        value={activityTab}
        onChange={setActivityTab}
        tabs={[
          { value: 'comments', label: t('Comments'), count: commentCount },
          {
            value: 'worklogs',
            label: t('Worklogs'),
            count: data.worklogs.length,
          },
          { value: 'history', label: t('History') },
          {
            value: 'ai',
            label: t('Ask AI'),
            icon: <IconSparkles size={14} />,
          },
        ]}
        trailing={
          activityTab === 'comments' && commentCount > 1 ? (
            <TaskSortToggle
              isNewestFirst={isCommentsNewestFirst}
              onChange={setIsCommentsNewestFirst}
            />
          ) : activityTab === 'worklogs' && data.worklogs.length > 1 ? (
            <TaskSortToggle
              isNewestFirst={isWorklogsNewestFirst}
              onChange={setIsWorklogsNewestFirst}
            />
          ) : undefined
        }
      />
      {(actionError ?? discussion.error) !== null && (
        <TaskStatusLine text={actionError ?? discussion.error} tone="danger" />
      )}
      {activityTab === 'comments' ? (
        <>
          {discussion.snapshot?.nextCursor && (
            <TaskButton
              variant="ghost"
              size="small"
              onClick={() => void discussion.loadEarlier()}
            >
              {t('Load earlier comments')}
            </TaskButton>
          )}
          <IssueCommentList
            key={issueId}
            issueId={issueId}
            baseUrl={readRecordPageBaseUrl()}
            boardPath={presentation === 'modal' ? boardPath : undefined}
            comments={
              discussion.isPermissionDenied
                ? []
                : (discussion.snapshot?.comments ?? data.issueComments)
            }
            membersById={membersById}
            currentMemberId={
              discussion.snapshot?.currentMemberId ??
              data.currentWorkspaceMemberId
            }
            highlightedCommentId={
              activityAnchor?.kind === 'comment' ? activityAnchor.id : null
            }
            canWrite={
              !discussion.isPermissionDenied &&
              (discussion.snapshot?.canWrite ?? data.canWrite)
            }
            canSoftDelete={
              !discussion.isPermissionDenied &&
              (discussion.snapshot?.canSoftDelete ?? data.canSoftDelete)
            }
            isBusy={isSaving}
            mentionMembers={
              discussion.snapshot?.members ?? data.assignableMembers
            }
            reactions={discussion.snapshot?.reactions}
            readStates={discussion.snapshot?.readStates}
            onReact={(commentId, emoji, active) =>
              void discussion
                .act('react', { commentId, emoji, active })
                .catch(() => undefined)
            }
            onRead={(commentIds) => discussion.act('read', { commentIds })}
            onCreate={async (input) => {
              const result = await postAppRoute<{
                issueComment: IssueCommentRow;
              }>(CREATE_ISSUE_COMMENT_ROUTE_PATH, {
                issueId,
                bodyV2: buildRichTextValue(input.markdown),
                requestId: input.requestId,
                mentionMemberIds: input.mentionMemberIds,
                ...(input.parentCommentId === undefined
                  ? {}
                  : { parentCommentId: input.parentCommentId }),
              });
              void discussion.reload();
              void reload();
              return result.issueComment;
            }}
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
            sortIsNewestFirst={isCommentsNewestFirst}
          />
        </>
      ) : activityTab === 'worklogs' ? (
        <IssueWorklogList
          issueId={issueId}
          baseUrl={readRecordPageBaseUrl()}
          boardPath={presentation === 'modal' ? boardPath : undefined}
          worklogs={data.worklogs}
          membersById={membersById}
          currentMemberId={data.currentWorkspaceMemberId}
          highlightedWorklogId={
            activityAnchor?.kind === 'worklog' ? activityAnchor.id : null
          }
          canWrite={data.canWrite}
          canSoftDelete={data.canSoftDelete}
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
          sortIsNewestFirst={isWorklogsNewestFirst}
        />
      ) : activityTab === 'history' ? (
        <IssueHistoryList
          histories={data.issueHistories}
          membersById={membersById}
          statusNameById={statusNameById}
        />
      ) : null}
      <IssueAiActivityTab issueId={issueId} isActive={activityTab === 'ai'} />
    </section>
  );

  const detailsPanel = (
    <IssueDetailsPanel
      key={issue.id}
      issue={issue}
      detail={displayedDetail}
      onUpdate={(body, options) => void update(body, options)}
      onError={setActionError}
      onHiddenFieldsChange={saveHiddenDetailFields}
      onOpenIssue={onSelectIssue}
      onOpenRecord={(objectNameSingular, recordId) => {
        if (
          objectNameSingular === 'merchant' ||
          objectNameSingular === 'crispConversation'
        ) {
          setRecordPreview({ issueId, objectNameSingular, recordId });
        } else if (isPage) {
          void openSidePanelPage({
            page: SidePanelPages.ViewRecord,
            recordId,
            objectNameSingular,
          });
        } else {
          void navigate(
            AppPath.RecordShowPage,
            { objectNameSingular, objectRecordId: recordId },
            undefined,
            { surface: 'main' },
          ).then(onClose);
        }
      }}
      onLogWork={() => setActivityTab('worklogs')}
    />
  );

  // The modal has no room for the Development and Attachments panels: one
  // summary line each, opening the record page where they live.
  const attachmentsBlock = isPage ? (
    <TaskAttachmentsSection
      key={`attachments-${issueId}`}
      issueId={issueId}
      attachments={data.attachments}
      canWrite={data.canWrite}
      onUploaded={() => void reload()}
    />
  ) : (
    <IssueModalSummary
      key={`summary-${issueId}`}
      issueId={issueId}
      attachmentCount={data.attachments.length}
      onOpenFullPage={openFullPage}
    />
  );

  const sidebarBody = (
    <>
      {detailsPanel}
      {isPage && (
        <IssueDevelopment issueId={issueId} sectionLabel={t('Development')} />
      )}
      {attachmentsBlock}
      <TaskStatusLine
        text={actionError ?? (isSaving ? t('Saving...') : null)}
        tone={actionError === null ? 'muted' : 'danger'}
      />
    </>
  );

  // On a phone the properties sit at the bottom of the page, so the four that
  // say where the issue stands come up under the title as chips.
  const currentStatus = statusById.get(issue.statusId ?? '');
  const priorityOption = ISSUE_PRIORITY_OPTIONS.find(
    (option) => option.value === issue.priority,
  );
  const dueShortLabel = readShortDate(issue.dueDate);
  const mobileSummary = (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      <TaskChip
        icon={
          <TaskStatusIcon
            glyph={readStatusGlyph(currentStatus, data.issueStatuses)}
            color={currentStatus?.color}
            size={12}
          />
        }
      >
        {currentStatus?.name ?? t('No status')}
      </TaskChip>
      {priorityOption !== undefined && (
        <TaskChip icon={<TaskPriorityGlyph priority={issue.priority} />}>
          {priorityOption.label}
        </TaskChip>
      )}
      {typeof issue.assigneeId === 'string' && (
        <TaskChip
          icon={
            <TaskAvatar
              name={readMemberName(membersById, issue.assigneeId, '')}
              avatarUrl={membersById.get(issue.assigneeId)?.avatarUrl}
              size={14}
              shouldShowTitle={false}
            />
          }
        >
          {readMemberName(membersById, issue.assigneeId, t('Unknown'))}
        </TaskChip>
      )}
      {dueShortLabel !== null && (
        <TaskChip icon={<IconCalendar size={11} />}>{dueShortLabel}</TaskChip>
      )}
    </div>
  );

  const mainColumn = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        // Fills the column beside the properties: a capped, centred column
        // left empty margins wider than the gutters around it.
        minWidth: 0,
        width: '100%',
      }}
    >
      {isPage && header}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!isPage && titleBlock}
        {isMobile && mobileSummary}
        <TaskRichTextLinkChipsScope markdown={currentDescription}>
          {descriptionBlock}
        </TaskRichTextLinkChipsScope>
      </div>
      <IssueProductPanel
        key={`product-${issueId}`}
        item={issue as ProductItem}
        onUpdate={(patch) =>
          void update({ data: patch }, { refreshBoard: true })
        }
        onStageChanged={() => {
          onCardChanged();
          void reload();
        }}
        onOpenIssue={onSelectIssue}
      />
      {subIssuesBlock}
      {activityBlock}
    </div>
  );

  // The linked merchant or chat opens as a drawer over the right of the view
  // rather than widening the sidebar, so the issue under it never reflows.
  const recordPreviewDrawer =
    preview === null || isMobile || isPage ? null : (
      <div
        style={{
          background: TASK_TOKENS.background,
          borderLeft: `1px solid ${TASK_TOKENS.border}`,
          bottom: 0,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          position: 'absolute',
          right: 0,
          top: 0,
          width: readModalSideColumnWidth(sideColumnWidth),
          zIndex: 3,
        }}
      >
        {recordPreviewPanel}
      </div>
    );

  if (isPage) {
    const isPagePreviewOpen = preview !== null && !isMobile;

    return (
      <div
        style={{
          height: '100%',
          minHeight: 0,
          overflow: 'hidden',
          position: 'relative',
          width: '100%',
        }}
      >
        {/* Two scroll areas, as in the modal: the issue and its properties
            each scroll on their own. Too narrow for both side by side (a side
            panel, a phone), the columns wrap and this outer box scrolls them
            as one page instead. */}
        <TaskResizableColumns
          rowStyle={{
            boxSizing: 'border-box',
            display: 'flex',
            flexWrap: 'wrap',
            fontFamily: TASK_TOKENS.fontFamily,
            height: '100%',
            minHeight: 0,
            overflowY: 'auto',
            ...TASK_THIN_SCROLLBAR_STYLE,
            width: '100%',
          }}
          sideColumnWidth={sideColumnWidth}
          onSideColumnWidthChange={changeSideColumnWidth}
          isResizable={!isMobile}
          mainColumn={
            <div
              style={{
                boxSizing: 'border-box',
                flex: `1 1 ${PAGE_ISSUE_COLUMN_MIN_WIDTH}px`,
                height: '100%',
                minWidth: 0,
                overflowY: 'auto',
                padding: DETAIL_PAGE_MAIN_PADDING,
                // Kept whether or not the issue scrolls, so a comment that ends
                // the scrolling does not nudge the column sideways.
                scrollbarGutter: 'stable',
                ...TASK_THIN_SCROLLBAR_STYLE,
              }}
            >
              {mainColumn}
            </div>
          }
          // A linked merchant or chat takes this column's place, at its width
          // and height, so the issue beside it never moves. The panel scrolls
          // itself, so the column does not.
          sideColumn={isPagePreviewOpen ? recordPreviewPanel : sidebarBody}
          readSideColumnStyle={(width) => ({
            background: isPagePreviewOpen
              ? TASK_TOKENS.background
              : TASK_TOKENS.backgroundSecondary,
            borderLeft: `1px solid ${TASK_TOKENS.border}`,
            boxSizing: 'border-box',
            display: 'flex',
            flex: `0 0 ${readPageSideColumnWidth(width)}`,
            flexDirection: 'column',
            height: '100%',
            minHeight: 0,
            overflowX: 'hidden',
            overflowY: isPagePreviewOpen ? 'hidden' : 'auto',
            padding: isPagePreviewOpen ? 0 : '16px 12px 32px 12px',
            ...TASK_THIN_SCROLLBAR_STYLE,
          })}
        />
        {recordPreviewDrawer}
        {isMobile && preview !== null && (
          <div
            style={{
              background: TASK_TOKENS.background,
              display: 'flex',
              flexDirection: 'column',
              inset: 0,
              position: 'absolute',
              zIndex: 3,
            }}
          >
            {recordPreviewPanel}
          </div>
        )}
      </div>
    );
  }

  return (
    <TaskBoardDetailFrame
      onClose={onClose}
      focusKey={issueId}
      shouldFocusDialog={activityAnchor === null}
      isMobile={isMobile}
      onEscape={preview === null ? onClose : () => setRecordPreview(null)}
    >
      {header}
      <div
        style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative' }}
      >
        {/* On a phone the two columns stack, Details under the content, and
            the whole body scrolls as one. */}
        <TaskResizableColumns
          rowStyle={{
            display: 'flex',
            flex: 1,
            flexDirection: isMobile ? 'column' : 'row',
            visibility: isMobile && preview !== null ? 'hidden' : undefined,
            minHeight: 0,
            // Without it the description's widest line sets the row's width
            // and pushes the sidebar out of the dialog.
            minWidth: 0,
            overflowY: isMobile ? 'auto' : 'visible',
            ...(isMobile ? TASK_THIN_SCROLLBAR_STYLE : {}),
          }}
          sideColumnWidth={sideColumnWidth}
          onSideColumnWidthChange={changeSideColumnWidth}
          isResizable={!isMobile}
          mainColumn={
            <div
              style={{
                boxSizing: 'border-box',
                display: 'flex',
                flex: isMobile ? '0 0 auto' : 1,
                flexDirection: 'column',
                minHeight: 0,
                minWidth: 0,
                overflowY: isMobile ? 'visible' : 'auto',
                ...(isMobile ? {} : TASK_THIN_SCROLLBAR_STYLE),
                padding: isMobile ? '16px 16px 24px 16px' : DETAIL_MAIN_PADDING,
              }}
            >
              {mainColumn}
            </div>
          }
          sideColumn={sidebarBody}
          readSideColumnStyle={(width) => ({
            background: TASK_TOKENS.backgroundSecondary,
            // Longhands only: the side that carries the rule changes with
            // the layout, and React drops a longhand beside a shorthand.
            borderLeft: isMobile ? 'none' : `1px solid ${TASK_TOKENS.border}`,
            borderTop: isMobile ? `1px solid ${TASK_TOKENS.border}` : 'none',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            minHeight: 0,
            minWidth: 0,
            overflowX: 'hidden',
            overflowY: isMobile ? 'visible' : 'auto',
            ...(isMobile ? {} : TASK_THIN_SCROLLBAR_STYLE),
            padding: DETAIL_SIDE_PADDING,
            width: isMobile ? '100%' : readModalSideColumnWidth(width),
          })}
        />
        {recordPreviewDrawer}
        {isMobile && preview !== null && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              background: TASK_TOKENS.background,
            }}
          >
            {recordPreviewPanel}
          </div>
        )}
      </div>
    </TaskBoardDetailFrame>
  );
};

const TaskAddRow = ({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        alignItems: 'center',
        background: isHovered ? TASK_TOKENS.backgroundHover : 'transparent',
        border: 'none',
        color: isHovered ? TASK_TOKENS.textSecondary : TASK_TOKENS.textTertiary,
        cursor: 'pointer',
        display: 'flex',
        fontFamily: TASK_TOKENS.fontFamily,
        fontSize: 13,
        gap: 10,
        minHeight: 34,
        padding: '0 10px',
        textAlign: 'left',
        width: '100%',
      }}
    >
      <IconPlus size={14} />
      {label}
    </button>
  );
};

const TaskHeaderDivider = () => (
  <span
    style={{
      background: TASK_TOKENS.border,
      flexShrink: 0,
      height: 16,
      margin: '0 4px',
      width: 1,
    }}
  />
);

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
  onEscape,
  focusKey,
  shouldFocusDialog = true,
  isMobile,
}: {
  onEscape?: () => void;
  children: React.ReactNode;
  onClose: () => void;
  focusKey: string;
  shouldFocusDialog?: boolean;
  // A phone gets the whole screen.
  isMobile: boolean;
}) => {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // autoFocus is a no-op on the sandbox's custom elements, so the dialog is
  // focused by hand: Escape only reaches onKeyDown from inside it. Stepping
  // to another issue re-renders the header buttons and drops focus to the
  // body, hence the key.
  useEffect(() => {
    if (shouldFocusDialog) dialogRef.current?.focus();
  }, [focusKey, shouldFocusDialog]);

  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        inset: 0,
        justifyContent: 'center',
        padding: isMobile ? 0 : 32,
        position: 'fixed',
        zIndex: 60,
      }}
    >
      <div
        onClick={onClose}
        style={{
          background: 'rgba(0,0,0,0.4)',
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
            event.stopPropagation();
            (onEscape ?? onClose)();
          }
        }}
        style={{
          background: TASK_TOKENS.background,
          border: `1px solid ${TASK_TOKENS.border}`,
          borderRadius: isMobile ? 0 : 12,
          boxShadow: TASK_TOKENS.shadowStrong,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: TASK_TOKENS.fontFamily,
          // 100%, not 100vh, on a phone: the host zooms this subtree there, so
          // 100vh came out taller than the screen and pushed the header off
          // the top. The fixed wrapper is already the screen's size.
          height: isMobile ? '100%' : 'min(860px, calc(100vh - 64px))',
          maxWidth: '100%',
          minHeight: 0,
          outline: 'none',
          overflow: 'hidden',
          position: 'relative',
          width: isMobile ? '100%' : 'min(1480px, calc(100vw - 48px))',
          zIndex: 61,
        }}
      >
        {children}
      </div>
    </div>
  );
};
