import { type ReactNode, useEffect, useRef, useState } from 'react';
import {
  copyToClipboard,
  enqueueSnackbar,
  t,
  useRecordId,
} from 'twenty-sdk/front-component';
import { IconLink } from 'twenty-ui/icon';

import { ISSUE_LABEL_OPTIONS } from '../../constants/issue-label-options';
import { ISSUE_PRIORITY_OPTIONS } from '../../constants/issue-priority-options';
import { UPDATE_ISSUE_ROUTE_PATH } from '../../constants/route-paths';
import { buildRichTextValue } from '../../utils/read-rich-text-plain-value.util';
import { DescriptionEmptyBox } from './task-description-empty-box';
import { TaskButton } from './task-button';
import {
  TASK_EDITING_RICH_TEXT_FRAME_STYLE,
  TASK_DESCRIPTION_MIN_HEIGHT,
  TASK_RICH_TEXT_READING_PADDING,
} from './task-control-styles';
import { TaskIconButton } from './task-icon-button';
import { TaskMessage } from './task-message';
import { TaskRichTextEditor } from './task-rich-text-editor';
import { TaskSkeletonBar, TaskSkeletonLines } from './task-skeleton';
import { TaskStatusLine } from './task-status-line';
import { TaskTag } from './task-tag';
import { TASK_THIN_SCROLLBAR_STYLE, TASK_TOKENS } from './task-tokens';
import { useIssueDetail } from '../hooks/use-issue-detail';
import { buildRecordUrl } from '../utils/build-record-url.util';
import { postAppRoute } from '../utils/post-app-route.util';
import { readErrorText } from '../utils/read-error-text.util';
import { readRecordPageBaseUrl } from '../utils/read-record-page-base-url.util';

// One frame for the loaded state.
const DescriptionFrame = ({ children }: { children: ReactNode }) => (
  <section
    style={{
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: TASK_TOKENS.fontFamily,
      height: '100%',
      minHeight: 0,
      width: '100%',
    }}
  >
    {children}
  </section>
);

// The scroll box both modes share: long prose scrolls inside the widget's
// fixed row budget instead of pushing the status line out of it.
const DescriptionBody = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      boxSizing: 'border-box',
      display: 'flex',
      flex: 1,
      minHeight: 0,
      overflowY: 'auto',
      ...TASK_THIN_SCROLLBAR_STYLE,
      width: '100%',
    }}
  >
    {children}
  </div>
);

// Read-first, like Jira and Linear: the description sits on the page as plain
// prose with no box of its own, and a click turns it into a focused editing
// surface with an accent ring. Markdown is the storage format, never the
// reading format. Like the comment editor it saves only on Save, never on
// blur: the editor blurs as the pointer goes down on Cancel, so a blur save
// would store the very text Cancel is meant to throw away.
//
// Entering edit mode mounts the editor, so the click that opens it cannot also
// place the caret: positioning the cursor takes a second click. Autofocus is
// not forwardable from the sandbox, so there is no way around that ordering.
//
// The host's FIELD_RICH_TEXT widget cannot render this field. Its card is hard
// wired to a field literally named `bodyV2` (FieldRichTextCard reads
// `recordStoreFamilySelector` with fieldName 'bodyV2' and shows a skeleton when
// it is absent) and its configuration carries no field reference at all, so on
// an object whose rich text field is `description` it renders an empty bar
// forever. Two further host behaviours rule it out even after a rename: it
// persists with the VIEWER's token, which the Member role no longer has here,
// and it lists attachments through
// `attachment.targetIssueId`, a morph branch the cutover deleted.
//
// Shared between its own widget and the record page's unified left column, so
// this lives outside the front-component file: the app build strips named
// exports out of `*.front-component.tsx`.
export const IssueDescription = () => {
  const issueId = useRecordId();
  const { data, isLoading, loadError } = useIssueDetail(issueId);
  // What the page shows as saved. Set the moment Save is pressed, ahead of
  // the write, so leaving the editor never waits on the server.
  const [draft, setDraft] = useState<string | null>(null);
  // What the open editor holds. Kept apart from `draft` so Cancel can drop it.
  const [editDraft, setEditDraft] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // oxlint-disable-next-line twenty/no-state-useref
  const saveChainRef = useRef<Promise<void>>(Promise.resolve());
  // oxlint-disable-next-line twenty/no-state-useref
  const currentIssueIdRef = useRef(issueId);
  currentIssueIdRef.current = issueId;

  const storedMarkdown = data.issue?.description?.markdown ?? '';

  useEffect(() => {
    setDraft(null);
    setEditDraft('');
    setIsEditing(false);
    setSaveError(null);
  }, [issueId]);

  const persist = async (markdown: string, previousMarkdown: string) => {
    if (issueId === null) {
      return;
    }

    try {
      await postAppRoute(UPDATE_ISSUE_ROUTE_PATH, {
        issueId,
        data: { description: buildRichTextValue(markdown) },
      });
      setSaveError(null);
    } catch (error) {
      // Reported through the host's own toast as well as the status line: the
      // panel has already returned to its reading state, and a failure is the
      // only thing here worth interrupting anyone for.
      const message = readErrorText(error);
      setSaveError(message);
      void enqueueSnackbar({
        message,
        variant: 'error',
      });

      // The page goes back to what is really stored, and the editor reopens
      // on the text that failed so it can be retried.
      if (currentIssueIdRef.current === issueId) {
        setDraft(previousMarkdown);
        setEditDraft(markdown);
        setIsEditing(true);
      }
    }
  };

  const startEditing = (currentMarkdown: string) => {
    setEditDraft(currentMarkdown);
    setIsEditing(true);
  };

  // Writes are chained rather than fired in parallel: two updates of the same
  // field in flight at once would land in whatever order the server finished
  // them, not the order they were saved.
  const saveEdit = (currentMarkdown: string) => {
    setIsEditing(false);

    if (editDraft === currentMarkdown) {
      return;
    }

    const markdown = editDraft;

    setDraft(markdown);
    setSaveError(null);
    saveChainRef.current = saveChainRef.current.then(() =>
      persist(markdown, currentMarkdown),
    );
  };

  // The record's own URL, like the modal's board deep link: the widget header
  // command only shows where the host draws that header, so the panel carries
  // its own button that is always there.
  const copyIssueLink = () => {
    if (issueId === null) {
      return;
    }

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

  if (issueId === null) {
    return <TaskMessage text={t('No issue selected.')} />;
  }

  if (isLoading && data.issue === null) {
    return (
      <DescriptionFrame>
        <div style={{ display: 'flex', gap: 8, paddingBottom: 8 }}>
          <TaskSkeletonBar
            width={64}
            height={22}
            radius={TASK_TOKENS.radiusSmall}
          />
          <TaskSkeletonBar
            width={56}
            height={22}
            radius={TASK_TOKENS.radiusSmall}
          />
        </div>
        <DescriptionBody>
          <TaskSkeletonLines widths={[92, 85, 68]} style={{ width: '100%' }} />
        </DescriptionBody>
      </DescriptionFrame>
    );
  }

  if (data.issue === null) {
    return (
      <TaskMessage
        text={loadError ?? t('This issue is not available to you.')}
        tone={loadError === null ? 'neutral' : 'danger'}
      />
    );
  }

  // The draft is never cleared except when the record changes: the detail
  // route is not refetched after a save, so the stored value stays stale and
  // falling back to it would visibly unwrite what was just saved.
  const currentMarkdown = draft ?? storedMarkdown;
  const isEmpty = currentMarkdown.trim() === '';

  // The Jira top line, so the page carries the issue's state above its prose
  // instead of leaving that to the Details column alone. Everything here is
  // read-only: the pickers live in Details, and duplicating them would offer
  // the same field twice with two different option scopes.
  const status = data.issueStatuses.find(
    (candidate) => candidate.id === data.issue?.statusId,
  );
  const priorityOption = ISSUE_PRIORITY_OPTIONS.find(
    (candidate) => candidate.value === data.issue?.priority,
  );
  const labelRows = (data.issue?.labels ?? []).map((value) => ({
    value,
    option: ISSUE_LABEL_OPTIONS.find((candidate) => candidate.value === value),
  }));

  return (
    <DescriptionFrame>
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          flexShrink: 0,
          flexWrap: 'wrap',
          fontFamily: TASK_TOKENS.fontFamily,
          gap: 8,
          paddingBottom: 8,
          width: '100%',
        }}
      >
        {typeof data.issue?.issueKey === 'string' && (
          <span
            style={{
              color: TASK_TOKENS.textSecondary,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {data.issue.issueKey}
          </span>
        )}
        {typeof status?.name === 'string' && (
          <TaskTag color={status.color}>{status.name}</TaskTag>
        )}
        {priorityOption !== undefined && (
          <TaskTag color={priorityOption.color}>
            {priorityOption.label}
          </TaskTag>
        )}
        <span style={{ flex: 1 }} />
        <TaskIconButton label={t('Copy link to issue')} onClick={copyIssueLink}>
          <IconLink size={14} />
        </TaskIconButton>
      </div>
      {labelRows.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexShrink: 0,
            flexWrap: 'wrap',
            gap: 4,
            paddingBottom: 8,
            width: '100%',
          }}
        >
          {labelRows.map(({ value, option }) => (
            <TaskTag key={value} color={option?.color ?? 'gray'}>
              {option?.label ?? value}
            </TaskTag>
          ))}
        </div>
      )}
      {/* Host-rendered: the worker has no Selection, Range or contentEditable,
          so the editor itself runs on the host side and this component only
          passes the markdown down and takes the edited markdown back. */}
      <DescriptionBody>
        {!data.canWrite ? (
          <div
            style={{
              boxSizing: 'border-box',
              flex: 1,
              minHeight: 0,
              padding: '4px 8px',
              width: '100%',
            }}
          >
            {isEmpty ? (
              <span style={{ color: TASK_TOKENS.textTertiary, fontSize: 13 }}>
                {t('No description.')}
              </span>
            ) : (
              <TaskRichTextEditor value={currentMarkdown} isReadOnly />
            )}
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flex: 1,
              flexDirection: 'column',
              gap: 6,
              minHeight: 0,
              width: '100%',
            }}
          >
            {/* One editor for both states, switched by isReadOnly: swapping a
                read-only copy in on Save mounts a fresh host editor that paints
                empty for a frame before it is seeded, which reads as a flash.
                The reading padding puts the text exactly where the editing
                frame's border and inset put it, so nothing moves either.
                Event props are passed as undefined rather than left out: the
                remote element wrapper never removes a listener whose prop
                disappears, and Save would bubble into a stale startEditing.
                Mousedown, not click: right after Save the read-only editor
                still holds BlockNote's trailing empty block, the first press
                on it removes it, and with the pressed node gone the browser
                fires no click at all. */}
            <div
              role={isEditing ? undefined : 'button'}
              tabIndex={isEditing ? undefined : 0}
              title={isEditing ? undefined : t('Edit')}
              onMouseDown={
                isEditing ? undefined : () => startEditing(currentMarkdown)
              }
              onKeyDown={
                isEditing
                  ? undefined
                  : (event) => {
                      if (event.key === 'Enter') {
                        startEditing(currentMarkdown);
                      }
                    }
              }
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              style={{
                ...(isEditing ? TASK_EDITING_RICH_TEXT_FRAME_STYLE : {}),
                background:
                  !isEditing && isHovered
                    ? TASK_TOKENS.backgroundHover
                    : 'transparent',
                borderRadius: TASK_TOKENS.radiusSmall,
                boxSizing: 'border-box',
                cursor: isEditing ? 'auto' : 'text',
                display: 'flex',
                flex: 1,
                minHeight:
                  isEditing || isEmpty ? 0 : TASK_DESCRIPTION_MIN_HEIGHT,
                padding:
                  isEditing || isEmpty ? 0 : TASK_RICH_TEXT_READING_PADDING,
                width: '100%',
              }}
            >
              {!isEditing && isEmpty ? (
                <DescriptionEmptyBox />
              ) : (
                <TaskRichTextEditor
                  value={isEditing ? editDraft : currentMarkdown}
                  onChange={isEditing ? setEditDraft : undefined}
                  isReadOnly={!isEditing}
                  placeholder={t('Describe the issue…')}
                  shouldFillHeight={isEditing}
                  minHeight={
                    isEditing ? TASK_DESCRIPTION_MIN_HEIGHT : undefined
                  }
                  issueId={issueId}
                />
              )}
            </div>
            {isEditing && (
              <div style={{ display: 'flex', flexShrink: 0, gap: 6 }}>
                <TaskButton
                  variant="primary"
                  size="small"
                  onClick={() => saveEdit(currentMarkdown)}
                >
                  {t('Save')}
                </TaskButton>
                <TaskButton size="small" onClick={() => setIsEditing(false)}>
                  {t('Cancel')}
                </TaskButton>
              </div>
            )}
          </div>
        )}
      </DescriptionBody>
      {/* Failures only, no "Saving...": the page already shows the saved text
          the moment Save is pressed, and a line that blinks in and out for the
          length of the request reads as the page flashing. */}
      <div style={{ paddingTop: 8 }}>
        <TaskStatusLine
          text={saveError}
          tone={saveError === null ? 'muted' : 'danger'}
        />
      </div>
    </DescriptionFrame>
  );
};
