import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  enqueueSnackbar,
  t,
  useRecordId,
} from 'twenty-sdk/front-component';

import { UPDATE_ISSUE_ROUTE_PATH } from '../constants/route-paths';
import { ISSUE_DESCRIPTION_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { buildRichTextValue } from '../utils/read-rich-text-plain-value.util';
import { TaskMessage } from './components/task-message';
import { TaskRichTextEditor } from './components/task-rich-text-editor';
import { TaskSkeletonBlock } from './components/task-skeleton-block';
import { TASK_TOKENS } from './components/task-tokens';
import { useIssueDetail } from './hooks/use-issue-detail';
import { postAppRoute } from './utils/post-app-route.util';
import { readErrorText } from './utils/read-error-text.util';

// Long enough that a normal typing burst is one write, short enough that a
// pause of a sentence already has the text on the server.
const SAVE_DEBOUNCE_MS = 700;

// One frame for the loading state and the loaded state, so the fetch landing
// does not move anything: the skeleton stands in the same boxes.
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

// React's CSSProperties has no room for custom properties, and the two below
// are the whole point of this style object.
type SurfaceStyle = CSSProperties & Record<`--${string}`, string>;

// The prose gets a surface of its own, tinted rather than bordered, so the
// block handles have somewhere to be that is visibly NOT the description.
//
// They cannot be outside the widget's own frame. That frame is
// StyledWidgetContentFrame, drawn by the host around every front component; an
// app cannot remove its border (it reads --t-border-color-medium off its own
// ancestors, not off anything this component sets) and the 47px BlockNote
// needs to the left of a line would land on the navigation drawer, since the
// description widget starts at column 0 of the page. So the box the handles sit
// outside of is this one, inside that frame.
//
// A tint rather than a border because a second bordered rectangle 48px inside
// the first reads as a mistake, while a filled block reads as content.
//
// The editor is host-rendered but it is a DOM descendant of this element, so
// the theme variables its own container reads resolve from here: the medium
// border is blanked, the primary background redirected at the tint. The app can
// reach the host element no other way, and if the variable names ever move the
// editor simply keeps its own frame.
const DescriptionSurface = ({ children }: { children?: ReactNode }) => {
  const surfaceStyle: SurfaceStyle = {
    '--t-background-primary':
      'var(--t-background-transparent-light, rgba(0,0,0,0.04))',
    '--t-border-color-medium': 'transparent',
    boxSizing: 'border-box',
    display: 'flex',
    flex: 1,
    minHeight: 0,
    width: '100%',
  };

  return <div style={surfaceStyle}>{children}</div>;
};

// Markdown is the storage format, never the reading format: the rendering is
// always on screen under the source box, so nobody has to read `## Kế hoạch`
// to find out what an issue is about, and a pasted picture is visible in the
// place the text puts it. Saving stays on the debounce plus the blur flush
// below.
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
  }, [issueId]);

  // A pending debounce must not outlive the panel, or it writes after the user
  // has moved on to another record.
  useEffect(() => cancelScheduledSave, []);

  const persist = async (markdown: string) => {
    if (issueId === null) {
      return;
    }

    try {
      await postAppRoute(UPDATE_ISSUE_ROUTE_PATH, {
        issueId,
        data: { description: buildRichTextValue(markdown) },
      });
    } catch (error) {
      // Reported through the host's own toast rather than a line in the panel:
      // a save that fails must still be visible now that the panel is the
      // editor and nothing else, and a failure is the only thing here worth
      // interrupting anyone for. The draft is left untouched, so the text the
      // save failed on is still in the box and the next keystroke retries it.
      await enqueueSnackbar({
        message: readErrorText(error),
        variant: 'error',
      });
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
    cancelScheduledSave();
    debounceHandleRef.current = setTimeout(() => {
      debounceHandleRef.current = null;
      void flushSave();
    }, SAVE_DEBOUNCE_MS);
  };

  if (issueId === null) {
    return <TaskMessage text={t('No issue selected.')} />;
  }

  if (isLoading && data.issue === null) {
    return (
      <DescriptionFrame>
        <DescriptionSurface>
          <TaskSkeletonBlock height="100%" shouldGrow />
        </DescriptionSurface>
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

  return (
    <DescriptionFrame>
      {/* Host-rendered: the worker has no Selection, Range or contentEditable,
          so the editor itself runs on the host side and this component only
          passes the markdown down and takes the edited markdown back. */}
      <DescriptionSurface>
        <TaskRichTextEditor
          value={draft ?? storedMarkdown}
          onChange={handleDraftChange}
          onBlur={() => void flushSave()}
          placeholder={t('Describe the issue…')}
          shouldFillHeight
        />
      </DescriptionSurface>
    </DescriptionFrame>
  );
};

export default defineFrontComponent({
  universalIdentifier: ISSUE_DESCRIPTION_FRONT_COMPONENT_UID,
  name: 'issue-description',
  description:
    "An issue's description, edited as markdown and written through the app's scoped routes.",
  component: IssueDescription,
});
