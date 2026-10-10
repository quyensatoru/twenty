import { useEffect, useMemo, useRef, useState } from 'react';
import { AppPath, copyToClipboard, enqueueSnackbar, navigate, t } from 'twenty-sdk/front-component';
import {
  IconChevronLeft,
  IconChevronRight,
  IconExternalLink,
  IconLink,
  IconX,
} from 'twenty-ui/icon';

import { ISSUE_TYPE_OPTIONS } from '../../constants/issue-type-options';
import { type BoardIssue } from '../../types/task-board';
import {
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
import { buildBoardIssueUrl } from '../utils/build-record-url.util';
import { useHiddenDetailFields } from '../hooks/use-hidden-detail-fields';
import { useIsMobile } from '../hooks/use-is-mobile';
import { type MemberRow, useIssueDetail } from '../hooks/use-issue-detail';
import { postAppRoute } from '../utils/post-app-route.util';
import { readErrorText } from '../utils/read-error-text.util';
import { readMemberName } from '../utils/read-member-name.util';
import { readRecordPageBaseUrl } from '../utils/read-record-page-base-url.util';
import { IssueCommentList } from './issue-comment-list';
import { IssueDetailsPanel } from './issue-details-panel';
import { IssueHistoryList } from './issue-history-list';
import { IssueWorklogList } from './issue-worklog-list';
import { DescriptionEmptyBox } from './task-description-empty-box';
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
import { TaskRichTextEditor } from './task-rich-text-editor';
import { TaskStatusLine } from './task-status-line';
import { SectionHeading } from './task-section-heading';
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
  const isMobile = useIsMobile();
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
  const [isDescriptionHovered, setIsDescriptionHovered] = useState(false);
  const [subtaskDraft, setSubtaskDraft] = useState('');
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
    setPendingPatch({});
    setActionError(null);
    setIsEditingTitle(false);
    setTitleDraft(null);
    setIsEditingDescription(false);
    setDescriptionDraft(null);
    setSubtaskDraft('');
  }, [issueId]);

  const { detail: displayedDetail, saveHiddenDetailFields } =
    useHiddenDetailFields({ detail: data, reload });

  const projectId =
    typeof data.issue?.projectId === 'string' ? data.issue.projectId : null;

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

  if (isLoading && data.issue === null) {
    return (
      <TaskBoardDetailFrame onClose={onClose} focusKey={issueId} isMobile={isMobile}>
        <TaskBoardDetailSkeleton isMobile={isMobile} />
      </TaskBoardDetailFrame>
    );
  }

  if (data.issue === null) {
    return (
      <TaskBoardDetailFrame onClose={onClose} focusKey={issueId} isMobile={isMobile}>
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
  return (
    <TaskBoardDetailFrame onClose={onClose} focusKey={issueId} isMobile={isMobile}>
      <div
        style={{
          alignItems: 'center',
          borderBottom: `1px solid ${TASK_TOKENS.borderLight}`,
          display: 'flex',
          gap: isMobile ? 4 : 8,
          padding: isMobile ? '12px 12px 8px 16px' : '16px 20px 12px 20px',
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
            whiteSpace: 'nowrap',
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

      {/* On a phone the two columns stack, Details under the content as in
          Jira's mobile issue view, and the whole body scrolls as one. */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: isMobile ? 'column' : 'row',
          gap: 20,
          minHeight: 0,
          overflowY: isMobile ? 'auto' : 'visible',
          ...(isMobile ? TASK_THIN_SCROLLBAR_STYLE : {}),
          padding: isMobile ? '12px 16px 16px 16px' : '12px 20px 20px 20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flex: isMobile ? '0 0 auto' : 1,
            flexDirection: 'column',
            gap: 16,
            minHeight: 0,
            minWidth: 0,
            overflowY: isMobile ? 'visible' : 'auto',
            ...(isMobile ? {} : TASK_THIN_SCROLLBAR_STYLE),
          }}
        >
          {isEditingTitle ? (
            <TaskTextInput
              ariaLabel={t('Title')}
              value={currentTitle}
              shouldAutoFocus
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
              style={{
                background: 'transparent',
                border: 'none',
                borderRadius: TASK_TOKENS.radiusSmall,
                color: TASK_TOKENS.textPrimary,
                cursor: data.canWrite ? 'text' : 'default',
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
            {!data.canWrite ? (
              currentDescription.trim() === '' ? (
                <span
                  style={{
                    color: TASK_TOKENS.textTertiary,
                    fontSize: 13,
                    padding: '4px 8px',
                  }}
                >
                  {t('No description.')}
                </span>
              ) : (
                <div style={{ padding: '4px 8px' }}>
                  <TaskRichTextEditor value={currentDescription} isReadOnly />
                </div>
              )
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {/* Keeping one host editor mounted avoids flashes and preserves its edit session. */}
                <div
                  role={isEditingDescription ? undefined : 'button'}
                  tabIndex={isEditingDescription ? undefined : 0}
                  title={isEditingDescription ? undefined : t('Edit')}
                  onMouseDown={isEditingDescription ? undefined : startEditingDescription}
                  onKeyDown={isEditingDescription ? undefined : (event) => {
                    if (event.key === 'Enter') {
                      startEditingDescription();
                    }
                  }}
                  onMouseEnter={() => setIsDescriptionHovered(true)}
                  onMouseLeave={() => setIsDescriptionHovered(false)}
                  style={{
                    ...(isEditingDescription
                      ? TASK_EDITING_RICH_TEXT_FRAME_STYLE
                      : {}),
                    background:
                      !isEditingDescription && isDescriptionHovered
                        ? TASK_TOKENS.backgroundHover
                        : 'transparent',
                    borderRadius: TASK_TOKENS.radiusSmall,
                    boxSizing: 'border-box',
                    cursor: isEditingDescription ? 'auto' : 'text',
                    display: 'flex',
                    minHeight: isEditingDescription
                      ? undefined
                      : currentDescription.trim() === ''
                        ? 120
                        : TASK_DESCRIPTION_MIN_HEIGHT,
                    padding:
                      isEditingDescription || currentDescription.trim() === ''
                        ? 0
                        : TASK_RICH_TEXT_READING_PADDING,
                    width: '100%',
                  }}
                >
                  {!isEditingDescription && currentDescription.trim() === '' ? (
                    <DescriptionEmptyBox />
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
                        isEditingDescription
                          ? TASK_DESCRIPTION_MIN_HEIGHT
                          : undefined
                      }
                      issueId={issueId}
                    />
                  )}
                </div>
                {isEditingDescription && (
                  <div style={{ display: 'flex', gap: 6 }}>
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
                    <TaskButton size="small" onClick={cancelEditingDescription}>
                      {t('Cancel')}
                    </TaskButton>
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
                onUnlink={
                  data.canWrite ? () => unlinkSubtask(child.id) : undefined
                }
                unlinkLabel={t('Remove subtask link')}
              />
            ))}
            {data.canWrite && (
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
            )}
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
                canWrite={data.canWrite}
                canSoftDelete={data.canSoftDelete}
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
            // Longhands only: the side that carries the rule changes with
            // the layout, and React drops a longhand beside a shorthand.
            borderLeft: isMobile
              ? 'none'
              : `1px solid ${TASK_TOKENS.borderLight}`,
            borderTop: isMobile
              ? `1px solid ${TASK_TOKENS.borderLight}`
              : 'none',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            gap: 4,
            minHeight: 0,
            minWidth: 0,
            overflowX: 'hidden',
            overflowY: isMobile ? 'visible' : 'auto',
            ...(isMobile ? {} : TASK_THIN_SCROLLBAR_STYLE),
            paddingLeft: isMobile ? 0 : 16,
            paddingTop: isMobile ? 16 : 0,
            width: isMobile ? '100%' : 320,
          }}
        >
          <IssueDetailsPanel
            key={issue.id}
            issue={issue}
            detail={displayedDetail}
            onUpdate={(body, options) => void update(body, options)}
            onError={setActionError}
            onHiddenFieldsChange={saveHiddenDetailFields}
            onOpenIssue={onSelectIssue}
            onLogWork={() => setActivityTab('worklogs')}
          />

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
  isMobile,
}: {
  children: React.ReactNode;
  onClose: () => void;
  focusKey: string;
  // A phone gets the whole screen, as Jira's mobile issue view does.
  isMobile: boolean;
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
      padding: isMobile ? 0 : 32,
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
        borderRadius: isMobile ? 0 : 12,
        boxShadow: TASK_TOKENS.shadowStrong,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: TASK_TOKENS.fontFamily,
        height: isMobile ? '100%' : 'min(860px, calc(100vh - 64px))',
        maxWidth: '100%',
        minHeight: 0,
        position: 'relative',
        width: isMobile ? '100%' : 'min(1280px, calc(100vw - 48px))',
        zIndex: 61,
      }}
    >
      {children}
    </div>
  </div>
  );
};
