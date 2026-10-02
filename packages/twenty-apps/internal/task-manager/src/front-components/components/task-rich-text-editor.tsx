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
  // one line in the design; a worklog note is a paragraph under a form.
  minHeight?: number;
  // Reserves the strip BlockNote draws its block handles in. Only for a box
  // with something of its own immediately to its left — an author avatar. A box
  // that starts at its panel's edge leaves the handles the margin outside it.
  shouldInsetBlockHandles?: boolean;
};

// An empty composer still has to be a target big enough to click into.
const COMPOSER_MIN_HEIGHT = 72;

// BlockNote draws its add-block and drag handles in a `.bn-side-menu` 39px
// wide, pinned flush to the LEFT of the block being hovered — outside the
// editor box, in whatever happens to be there. Measured against the running
// host: 39px of menu plus the 8px inline padding `.bn-editor` carries.
//
// Reserved only where something else occupies that strip. In a feed row the
// author avatar does, and the handles covered it exactly; the description and
// the worklog note own their panel's full width, so the handles fall in the
// margin beside it and the inset would only narrow the writing area.
export const BLOCK_HANDLE_GUTTER = 48;

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
  shouldInsetBlockHandles = false,
}: TaskRichTextEditorProps) => {
  const { resolvedUploads, handleUpload } = useRichTextUploads();

  return (
    <div
      style={{
        boxSizing: 'border-box',
        display: 'flex',
        paddingLeft:
          shouldInsetBlockHandles && !isReadOnly ? BLOCK_HANDLE_GUTTER : 0,
        // The editor fills whatever slot it is given. Without this it is only
        // as wide as its own text in a row-direction parent, which is what the
        // comment composer is.
        width: '100%',
        ...(shouldFillHeight
          ? { flex: 1, minHeight: 0 }
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
