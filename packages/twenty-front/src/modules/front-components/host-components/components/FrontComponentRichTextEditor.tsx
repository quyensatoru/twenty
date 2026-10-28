import { AdvancedTextEditor } from '@/advanced-text-editor/components/AdvancedTextEditor';
import { AdvancedTextEditorBlockHandle } from '@/advanced-text-editor/components/AdvancedTextEditorBlockHandle';
import { useAdvancedTextEditor } from '@/advanced-text-editor/hooks/useAdvancedTextEditor';
import { getStorableEditorDocument } from '@/advanced-text-editor/utils/getStorableEditorDocument';
import { convertEditorDocumentToMarkdown } from '@/front-components/host-components/utils/convertEditorDocumentToMarkdown';
import { FRONT_COMPONENT_RICH_TEXT_EDITOR_PROFILE } from '@/front-components/host-components/constants/FrontComponentRichTextEditorProfile';
import { parseMarkdownAsEditorContent } from '@/front-components/host-components/utils/parseMarkdownAsEditorContent';
import { styled } from '@linaria/react';
import { type Editor } from '@tiptap/core';
import { useEffect, useRef } from 'react';
import { type FrontComponentRichTextEditorImplementationProps as FrontComponentRichTextEditorProps } from 'twenty-front-component-renderer';
import { isDefined } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme';

// Text sits behind the frame's 1px border plus an 8px inset (ProseMirror's own
// padding), the offset the guest's read-only preview reserves so the text
// stays put when editing starts. The block handle therefore hangs outside the
// frame, which is why nothing here clips: the guest's box grows or scrolls.
const StyledEditorFrame = styled.div`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  box-sizing: border-box;
  container: front-component-rich-text-editor / inline-size;
  min-height: 100%;
  width: 100%;

  /* Read only is a rendering, not an input: a frame would invite typing. */
  &[data-is-read-only='true'] {
    background: transparent;
    border: none;
    border-radius: 0;
    min-height: 0;
  }
`;

const StyledEditorContent = styled.div`
  box-sizing: border-box;
  padding: ${themeCssVariables.spacing[1]} 0;
  position: relative;

  [data-is-read-only='true'] > & {
    padding: 0;
  }

  /* Core draws it as a zero-height float, which a second line spills out of.
     It only shows on an empty document, so it can sit at the first line's
     fixed spot on a single, truncated line. Doubled class: outranks core. */
  .tiptap.tiptap
    p.is-editor-empty:first-of-type:not([data-placeholder=''])::before {
    float: none;
    height: auto;
    left: ${themeCssVariables.spacing[2]};
    overflow: hidden;
    position: absolute;
    right: ${themeCssVariables.spacing[2]};
    text-overflow: ellipsis;
    top: ${themeCssVariables.spacing[1]};
    white-space: nowrap;
  }

  /* A composer has no room beside it for the handle. */
  @container front-component-rich-text-editor (max-width: 480px) {
    .drag-handle {
      display: none;
    }
  }
`;

// The editor takes its content at creation, as core's do: seeding it from an
// effect makes React node views (images, files) flushSync mid-render. A seed
// lives as long as the editor, which a read-only toggle recreates.
type EditorSeed = { isReadOnly: boolean; value: string; content: string };

const UPLOAD_REFUSED_BY_GUEST = 'The front component did not store the file.';

const convertEditorToMarkdown = (editor: Editor): string =>
  convertEditorDocumentToMarkdown(getStorableEditorDocument(editor));

// The guest speaks markdown on both ends and owns persistence; this only
// reports what the user typed.
export const FrontComponentRichTextEditor = ({
  value,
  placeholder,
  isReadOnly,
  onChange,
  onFocus,
  onBlur,
  onUploadFile,
}: FrontComponentRichTextEditorProps) => {
  // Once the user has typed, a mid-session value change can only be a late,
  // reordered or bogus echo of this editor's own output, so only a read-only
  // toggle (which recreates the editor) or a pristine editor may reseed.
  // oxlint-disable-next-line twenty/no-state-useref
  const hasEmittedSinceSeedRef = useRef(false);
  // oxlint-disable-next-line twenty/no-state-useref
  const seededMarkdownRef = useRef<string | null>(null);
  // oxlint-disable-next-line twenty/no-state-useref
  const uploadsInFlightCountRef = useRef(0);
  // oxlint-disable-next-line twenty/no-state-useref
  const onUploadFileRef = useRef(onUploadFile);
  onUploadFileRef.current = onUploadFile;
  // oxlint-disable-next-line twenty/no-state-useref
  const editorRef = useRef<Editor | null>(null);
  // oxlint-disable-next-line twenty/no-state-useref
  const seedRef = useRef<EditorSeed | null>(null);
  const seed: EditorSeed =
    seedRef.current?.isReadOnly === isReadOnly
      ? seedRef.current
      : { isReadOnly, value, content: parseMarkdownAsEditorContent(value) };
  seedRef.current = seed;

  const uploadThroughGuest = async (file: File) => {
    uploadsInFlightCountRef.current += 1;

    try {
      const url = await onUploadFileRef.current(file);

      if (!isDefined(url)) {
        throw new Error(UPLOAD_REFUSED_BY_GUEST);
      }

      return { url };
    } finally {
      uploadsInFlightCountRef.current -= 1;
    }
  };

  const handleEditorUpdate = (editor: Editor) => {
    // Markdown cannot say "an image is coming"; the finished upload triggers
    // another update that carries everything typed meanwhile.
    if (uploadsInFlightCountRef.current > 0) {
      return;
    }

    const markdown = convertEditorToMarkdown(editor);

    if (markdown === seededMarkdownRef.current) {
      return;
    }

    hasEmittedSinceSeedRef.current = true;
    onChange(markdown);
  };

  const editor = useAdvancedTextEditor(
    {
      profile: FRONT_COMPONENT_RICH_TEXT_EDITOR_PROFILE,
      placeholder,
      readonly: isReadOnly,
      defaultValue: undefined,
      content: seed.content,
      onUpdate: handleEditorUpdate,
      onFocus: () => onFocus(),
      onBlur: () => onBlur(),
      onImageUpload: uploadThroughGuest,
      onFileUpload: uploadThroughGuest,
      editorProps: {
        // macOS spell checking rewrites words still being composed by the
        // Vietnamese input source, and ProseMirror then keeps both copies.
        attributes: { spellcheck: 'false' },
        handlePaste: (_view, event) => {
          const clipboardData = event.clipboardData;

          if (
            !isDefined(clipboardData) ||
            clipboardData.types.includes('text/html') ||
            clipboardData.files.length > 0
          ) {
            return false;
          }

          const pastedText = clipboardData.getData('text/plain');

          if (pastedText === '') {
            return false;
          }

          if (!isDefined(editorRef.current)) {
            return false;
          }

          editorRef.current.commands.insertContent(
            parseMarkdownAsEditorContent(pastedText),
          );

          return true;
        },
      },
    },
    [isReadOnly],
  );

  editorRef.current = editor;

  useEffect(() => {
    if (!isDefined(editor)) {
      return;
    }

    hasEmittedSinceSeedRef.current = false;
    seededMarkdownRef.current = convertEditorToMarkdown(editor);
  }, [editor]);

  useEffect(() => {
    if (
      !isDefined(editor) ||
      hasEmittedSinceSeedRef.current ||
      value === seedRef.current?.value
    ) {
      return;
    }

    // Only the value matters once the editor exists.
    seedRef.current = { isReadOnly, value, content: '' };

    queueMicrotask(() => {
      if (editor.isDestroyed) {
        return;
      }

      editor.commands.setContent(parseMarkdownAsEditorContent(value), {
        emitUpdate: false,
      });
      seededMarkdownRef.current = convertEditorToMarkdown(editor);
    });
  }, [editor, isReadOnly, value]);

  if (!isDefined(editor)) {
    return null;
  }

  return (
    <StyledEditorFrame data-is-read-only={isReadOnly}>
      <StyledEditorContent>
        <AdvancedTextEditor
          editor={editor}
          readonly={isReadOnly}
          minHeight={FRONT_COMPONENT_RICH_TEXT_EDITOR_PROFILE.minHeight}
          variant={FRONT_COMPONENT_RICH_TEXT_EDITOR_PROFILE.variant}
        />
        {!isReadOnly && <AdvancedTextEditorBlockHandle editor={editor} />}
      </StyledEditorContent>
    </StyledEditorFrame>
  );
};
