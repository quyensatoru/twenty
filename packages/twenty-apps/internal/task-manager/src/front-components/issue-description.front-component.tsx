import { useEffect, useRef, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import { t, useRecordId } from 'twenty-sdk/front-component';

import { UPDATE_ISSUE_ROUTE_PATH } from '../constants/route-paths';
import { ISSUE_DESCRIPTION_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { buildRichTextValue } from '../utils/read-rich-text-plain-value.util';
import { TaskMarkdownEditor } from './components/task-markdown-editor';
import { TaskMessage } from './components/task-message';
import { TASK_TOKENS } from './components/task-tokens';
import { useIssueDetail } from './hooks/use-issue-detail';
import { postAppRoute } from './utils/post-app-route.util';
import { readErrorText } from './utils/read-error-text.util';

// Long enough that a normal typing burst is one write, short enough that a
// pause of a sentence already has the text on the server.
const SAVE_DEBOUNCE_MS = 700;

// Markdown is the storage format, never the reading format: the panel shows
// the rendered text and only turns into the source box under the pointer that
// clicked it, so nobody has to read `## Kế hoạch` to find out what an issue is
// about. Saving stays on the debounce plus the blur flush below.
//
// The host's FIELD_RICH_TEXT widget cannot render this field. Its card is hard
// wired to a field literally named `bodyV2` (FieldRichTextCard reads
// `recordStoreFamilySelector` with fieldName 'bodyV2' and shows a skeleton when
// it is absent) and its configuration carries no field reference at all, so on
// an object whose rich text field is `description` it renders an empty bar
// forever. Two further host behaviours rule it out even after a rename: it
// persists with the VIEWER's token, which the Member role no longer has on
// app-owned objects, and it lists attachments through
// `attachment.targetIssueId`, a morph branch the cutover deleted.
const IssueDescription = () => {
  const issueId = useRecordId();
  const { data, isLoading, loadError } = useIssueDetail(issueId);
  const [draft, setDraft] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>(
    'idle',
  );
  // oxlint-disable-next-line twenty/no-state-useref
  const pendingMarkdownRef = useRef<string | null>(null);
  // oxlint-disable-next-line twenty/no-state-useref
  const debounceHandleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // oxlint-disable-next-line twenty/no-state-useref
  const saveChainRef = useRef<Promise<void>>(Promise.resolve());

  const storedMarkdown = data.issue?.description?.markdown ?? '';

  const cancelScheduledSave = () => {
    if (debounceHandleRef.current !== null) {
      clearTimeout(debounceHandleRef.current);
      debounceHandleRef.current = null;
    }
  };

  useEffect(() => {
    cancelScheduledSave();
    pendingMarkdownRef.current = null;
    setDraft(null);
    setSaveState('idle');
  }, [issueId]);

  // A pending debounce must not outlive the panel, or it writes after the user
  // has moved on to another record.
  useEffect(() => cancelScheduledSave, []);

  const persist = async (markdown: string) => {
    if (issueId === null) {
      return;
    }

    setSaveState('saving');

    try {
      await postAppRoute(UPDATE_ISSUE_ROUTE_PATH, {
        issueId,
        data: { description: buildRichTextValue(markdown) },
      });
      setSaveError(null);
      setSaveState('saved');
    } catch (error) {
      // The draft is left untouched, so the text the save failed on is still
      // in the box and the next keystroke retries it.
      setSaveError(readErrorText(error));
      setSaveState('idle');
    }
  };

  // Writes are chained rather than fired in parallel: two updates of the same
  // field in flight at once would land in whatever order the server finished
  // them, not the order they were typed.
  const flushSave = (): Promise<void> => {
    cancelScheduledSave();

    const markdown = pendingMarkdownRef.current;

    if (markdown === null) {
      return saveChainRef.current;
    }

    pendingMarkdownRef.current = null;
    saveChainRef.current = saveChainRef.current.then(() => persist(markdown));

    return saveChainRef.current;
  };

  const handleDraftChange = (nextMarkdown: string) => {
    setDraft(nextMarkdown);
    pendingMarkdownRef.current = nextMarkdown;
    setSaveState('saving');
    cancelScheduledSave();
    debounceHandleRef.current = setTimeout(() => {
      debounceHandleRef.current = null;
      void flushSave();
    }, SAVE_DEBOUNCE_MS);
  };


  if (issueId === null) {
    return <TaskMessage text={t('No issue selected.')} />;
  }

  if (isLoading) {
    return <TaskMessage text={t('Loading…')} />;
  }

  if (loadError !== null) {
    return <TaskMessage text={loadError} tone="danger" />;
  }

  if (data.issue === null) {
    return <TaskMessage text={t('This issue is not available to you.')} />;
  }

  return (
    <section
      style={{
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: TASK_TOKENS.fontFamily,
        gap: 8,
        height: '100%',
        padding: '4px 0',
        width: '100%',
      }}
    >
      {saveError !== null && (
        <span style={{ color: TASK_TOKENS.textDanger, fontSize: 12 }}>
          {saveError}
        </span>
      )}

      <TaskMarkdownEditor
        ariaLabel={t('Issue description')}
        value={draft ?? storedMarkdown}
        onChange={handleDraftChange}
        onBlur={() => void flushSave()}
        placeholder={t('Describe the issue in markdown…')}
        rows={6}
        isClickToEdit
      />
      {saveState !== 'idle' && (
        <span style={{ color: TASK_TOKENS.textTertiary, fontSize: 11 }}>
          {saveState === 'saving' ? t('Saving…') : t('Saved')}
        </span>
      )}
    </section>
  );
};

export default defineFrontComponent({
  universalIdentifier: ISSUE_DESCRIPTION_FRONT_COMPONENT_UID,
  name: 'issue-description',
  description:
    "An issue's description, edited as markdown and written through the app's scoped routes.",
  component: IssueDescription,
});
