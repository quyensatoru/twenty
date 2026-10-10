import { en as blockNoteEnglishDictionary } from '@blocknote/core/locales';
import '@blocknote/mantine/style.css';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
import '@blocknote/react/style.css';
import { styled } from '@linaria/react';
import { useEffect, useRef } from 'react';
import { type FrontComponentRichTextEditorImplementationProps as FrontComponentRichTextEditorProps } from 'twenty-front-component-renderer';
import { isDefined } from 'twenty-shared/utils';
import { themeCssVariables, useThemeColorScheme } from 'twenty-ui/theme';

const StyledEditorContainer = styled.div`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  box-sizing: border-box;
  height: 100%;
  overflow-y: auto;
  padding: 8px 0;
  width: 100%;

  & .bn-editor {
    /* BlockNote paints its own editor surface from its own palette, which is
       not Twenty's: the container above already paints the right one, and a
       second one inside it is only ever a rectangle in a slightly wrong
       colour. Leaving it transparent is also what lets a guest neutralise
       this whole frame by blanking the container's theme variables. */
    background: transparent;
    font-size: 13px;
    padding-inline: 8px;
  }

  /* The handles are 19.5px buttons centred in a 30px menu that BlockNote
     top-aligns against the block, which leaves them 2.2px below the line they
     belong to. The margin shortens the half below each button, lifting it onto
     the text: measured against the running host, it puts both handle centres at
     166.5 against the text's 166.8.

     Every child, not just [draggable='true']. Twenty's own BlockEditor and
     DashboardsBlockEditor nudge the drag handle alone, which aligns it to the
     text but leaves the add-block button 2.5px below it. */
  & .bn-side-menu .mantine-UnstyledButton-root:not(.mantine-Menu-item) svg {
    height: 16px;
    width: 16px;
  }

  & .bn-mantine .bn-side-menu > * {
    margin-bottom: 5px;
  }

  /* Read only is a rendering, not an input: the frame around it would draw a
     box people try to type in. */
  &[data-is-read-only='true'] {
    background: transparent;
    border: none;
    border-radius: 0;
    height: auto;
    overflow-y: visible;
    padding: 0;

    /* The inline inset exists to leave room for the block handles beside an
       editable line. A rendering has none, so the inset only pushes the text
       out of line with whatever the app drew above it. */
    & .bn-editor {
      padding-inline: 0;
    }
  }
`;

// BlockNote refuses a rejected upload by leaving the block behind; an error is
// how it learns the file never landed.
const UPLOAD_REFUSED_BY_GUEST = 'The front component did not store the file.';

// The front component speaks markdown on both ends, so a host-side editor that
// speaks blocks has to translate. The conversion is lossy by BlockNote's own
// admission, which is why the guest keeps owning persistence: it decides what
// to store, this only reports what the user typed.
export const FrontComponentRichTextEditor = ({
  value,
  placeholder,
  isReadOnly,
  onChange,
  onFocus,
  onBlur,
  onUploadFile,
}: FrontComponentRichTextEditorProps) => {
  const colorScheme = useThemeColorScheme();

  // A value change that arrives mid-session — no Save, Cancel, or read-only
  // toggle since the last reseed — can only legitimately be an echo of this
  // editor's own typing: the live BlockNote document already shows whatever
  // the user actually typed, so there is no external content left to apply.
  // The host/guest round trip can echo a keystroke late, out of order, or
  // duplicated (and has been observed to occasionally echo back a bare empty
  // string that this editor never emitted), so once anything has been typed
  // this effect no longer trusts a mid-session value change at all — it
  // forces a reseed only at a genuine session boundary (entering/leaving edit
  // mode) or for the very first, pristine value. Reseeding on an untrusted
  // mid-session echo would silently overwrite live, correct, in-progress text
  // with a stale or bogus one.
  // Not state: these are read inside BlockNote's own change callback and must
  // never schedule a render of their own, or every keystroke would remount the
  // editor.
  // oxlint-disable-next-line twenty/no-state-useref
  const isReadOnlyRef = useRef(isReadOnly);
  // oxlint-disable-next-line twenty/no-state-useref
  const hasEmittedSinceSeedRef = useRef(false);
  // oxlint-disable-next-line twenty/no-state-useref
  const seededMarkdownRoundTripRef = useRef<string | null>(null);
  // oxlint-disable-next-line twenty/no-state-useref
  const isSeedingRef = useRef(false);
  // oxlint-disable-next-line twenty/no-state-useref
  const uploadsInFlightCountRef = useRef(0);
  // BlockNote reads its options once, at creation, so the current callback has
  // to be reachable from a closure that never changes.
  // oxlint-disable-next-line twenty/no-state-useref
  const onUploadFileRef = useRef(onUploadFile);
  onUploadFileRef.current = onUploadFile;

  const editor = useCreateBlockNote({
    dictionary: {
      ...blockNoteEnglishDictionary,
      placeholders: {
        ...blockNoteEnglishDictionary.placeholders,
        emptyDocument: placeholder,
        default: placeholder,
      },
    },
    // Configuring this is what makes BlockNote accept a pasted or dropped
    // file at all. It never uploads here: the file is handed to the guest,
    // which is the side that holds the application's credentials and knows
    // what the file may be attached to.
    uploadFile: async (file: File): Promise<string> => {
      uploadsInFlightCountRef.current += 1;

      try {
        const url = await onUploadFileRef.current(file);

        if (!isDefined(url)) {
          throw new Error(UPLOAD_REFUSED_BY_GUEST);
        }

        return url;
      } finally {
        uploadsInFlightCountRef.current -= 1;
      }
    },
  });

  useEffect(() => {
    const isSessionBoundary = isReadOnlyRef.current !== isReadOnly;

    isReadOnlyRef.current = isReadOnly;

    if (!isSessionBoundary && hasEmittedSinceSeedRef.current) {
      return;
    }

    hasEmittedSinceSeedRef.current = false;

    const blocks = editor.tryParseMarkdownToBlocks(value);

    isSeedingRef.current = true;

    editor.replaceBlocks(
      editor.document,
      blocks.length > 0 ? blocks : [{ type: 'paragraph' }],
    );

    isSeedingRef.current = false;

    seededMarkdownRoundTripRef.current = editor.blocksToMarkdownLossy(
      editor.document,
    );
  }, [editor, value, isReadOnly]);

  const handleChange = (): void => {
    // Seeding the editor fires onChange as well, synchronously inside the
    // effect above and again once the ref below is filled. Reporting the round
    // trip of text nobody typed would rewrite the stored markdown just by
    // opening the record.
    if (isSeedingRef.current) {
      return;
    }

    // A file still on its way has an empty address, and markdown cannot say
    // "an image is coming": it would serialise as a broken picture and the
    // guest would save that. Everything typed meanwhile is still in the
    // document and goes out with the change the finished upload triggers.
    if (uploadsInFlightCountRef.current > 0) {
      return;
    }

    const markdown = editor.blocksToMarkdownLossy(editor.document);

    if (markdown === seededMarkdownRoundTripRef.current) {
      return;
    }

    hasEmittedSinceSeedRef.current = true;
    onChange(markdown);
  };

  return (
    <StyledEditorContainer data-is-read-only={isReadOnly}>
      {/* A rendering has nothing to offer a pointer: BlockNote's floating
          toolbars and menus otherwise stay mounted on every read-only copy,
          and one of them drifts over whatever the app drew around it. */}
      <BlockNoteView
        editor={editor}
        editable={!isReadOnly}
        formattingToolbar={!isReadOnly}
        linkToolbar={!isReadOnly}
        sideMenu={!isReadOnly}
        slashMenu={!isReadOnly}
        filePanel={!isReadOnly}
        tableHandles={!isReadOnly}
        theme={colorScheme === 'dark' ? 'dark' : 'light'}
        onChange={handleChange}
        onFocus={() => onFocus()}
        onBlur={() => onBlur()}
      />
    </StyledEditorContainer>
  );
};
