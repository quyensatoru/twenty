import { useRichTextUploads } from '../hooks/use-rich-text-uploads';

type TaskRichTextEditorProps = {
  value: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  isReadOnly?: boolean;
  // Takes the whole height it is given instead of growing with its content.
  // For the panels that own their widget's height rather than sitting in a
  // column of other controls.
  shouldFillHeight?: boolean;
  // Overrides the resting height of an editable box. The comment composer is
  // one line in the design; a worklog note is a paragraph under a form. Also
  // floors a fill-height box: the record page's unified column has no fixed
  // height, so fill-height alone collapses an empty editor to one line.
  minHeight?: number;
  // The issue a stored image is filed against. Without it the upload still
  // lands in storage and in the prose, but the Attachments widget never sees
  // it.
  issueId?: string | null;
};

// An empty composer still has to be a target big enough to click into.
const COMPOSER_MIN_HEIGHT = 72;

// The one editing surface in this app, on every panel and in both directions:
// the host renders Twenty's own BlockNote, this side speaks markdown to it and
// stores what comes back through the app's scoped routes.
//
// It has to be host-rendered: the sandbox's element set has no contentEditable
// property and the guest has no Selection or Range, so ProseMirror — and the
// BlockNote built on it — has nothing to attach to in here.
export const TaskRichTextEditor = ({
  value,
  onChange,
  onBlur,
  placeholder,
  isReadOnly = false,
  shouldFillHeight = false,
  minHeight,
  issueId,
}: TaskRichTextEditorProps) => {
  const { resolvedUploads, handleUpload } = useRichTextUploads(issueId);

  return (
    <div
      style={{
        boxSizing: 'border-box',
        display: 'flex',
        // The editor fills whatever slot it is given. Without this it is only
        // as wide as its own text in a row-direction parent, which is what the
        // comment composer is.
        width: '100%',
        ...(shouldFillHeight
          ? { flex: 1, minHeight: minHeight ?? 0 }
          : isReadOnly
            ? {}
            : { minHeight: minHeight ?? COMPOSER_MIN_HEIGHT }),
      }}
    >
      <twenty-rich-text-editor
        value={value}
        placeholder={placeholder}
        isReadOnly={isReadOnly}
        resolvedUploads={resolvedUploads}
        onChange={(event) => onChange?.(event.target.value)}
        onBlur={() => onBlur?.()}
        onUpload={handleUpload}
      />
    </div>
  );
};
