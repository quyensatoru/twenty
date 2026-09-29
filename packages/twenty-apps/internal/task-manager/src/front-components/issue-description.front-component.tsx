import { useEffect, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import { t, useRecordId } from 'twenty-sdk/front-component';

import { UPDATE_ISSUE_ROUTE_PATH } from '../constants/route-paths';
import { ISSUE_DESCRIPTION_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { buildRichTextValue } from '../utils/read-rich-text-plain-value.util';
import { TaskButton } from './components/task-button';
import { TaskMarkdownEditor } from './components/task-markdown-editor';
import { TaskMarkdownView } from './components/task-markdown-view';
import { TaskMessage } from './components/task-message';
import { TASK_TOKENS } from './components/task-tokens';
import { useIssueDetail } from './hooks/use-issue-detail';
import { postAppRoute } from './utils/post-app-route.util';
import { readErrorText } from './utils/read-error-text.util';

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
  const { data, isLoading, loadError, reload } = useIssueDetail(issueId);
  const [draft, setDraft] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const storedMarkdown = data.issue?.description?.markdown ?? '';

  useEffect(() => {
    setDraft(null);
  }, [issueId]);

  const save = async () => {
    if (draft === null || issueId === null) {
      return;
    }

    setIsSaving(true);

    try {
      await postAppRoute(UPDATE_ISSUE_ROUTE_PATH, {
        issueId,
        data: { description: buildRichTextValue(draft) },
      });
      setSaveError(null);
      setDraft(null);
      await reload();
    } catch (error) {
      setSaveError(readErrorText(error));
    } finally {
      setIsSaving(false);
    }
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
        display: 'flex',
        flexDirection: 'column',
        fontFamily: TASK_TOKENS.fontFamily,
        gap: 8,
        padding: '4px 0',
        width: '100%',
      }}
    >
      {saveError !== null && (
        <span style={{ color: TASK_TOKENS.textDanger, fontSize: 12 }}>
          {saveError}
        </span>
      )}

      {draft === null ? (
        <>
          <TaskMarkdownView
            markdown={storedMarkdown}
            emptyText={t('No description yet.')}
          />
          <div>
            <TaskButton size="small" onClick={() => setDraft(storedMarkdown)}>
              {storedMarkdown === '' ? t('Add description') : t('Edit')}
            </TaskButton>
          </div>
        </>
      ) : (
        <>
          <TaskMarkdownEditor
            ariaLabel={t('Issue description')}
            value={draft}
            onChange={setDraft}
            placeholder={t('Describe the issue in markdown…')}
            rows={6}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <TaskButton
              variant="primary"
              size="small"
              isDisabled={isSaving}
              onClick={() => void save()}
            >
              {t('Save')}
            </TaskButton>
            <TaskButton size="small" onClick={() => setDraft(null)}>
              {t('Cancel')}
            </TaskButton>
          </div>
        </>
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
