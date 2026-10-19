import { type BlockNoteEditor } from '@blocknote/core';

import { convertMarkdownToBlocks } from '@/front-components/host-components/utils/convertMarkdownToBlocks';
import { isClipboardLeftToBlockNote } from '@/front-components/host-components/utils/isClipboardLeftToBlockNote';

type PasteHandlerContext = {
  event: ClipboardEvent;
  editor: BlockNoteEditor;
  defaultPasteHandler: () => boolean | undefined;
};

// Pasted markdown is read the way stored markdown is (convertMarkdownToBlocks),
// not by BlockNote's own markdown parser, which reads `<https://…>`, escapes
// and entities differently from the preview that will show it once saved.
export const handleMarkdownPaste = ({
  event,
  editor,
  defaultPasteHandler,
}: PasteHandlerContext) => {
  const clipboard = event.clipboardData;
  const isInCodeBlock = editor.transact(
    (transaction) =>
      transaction.selection.$from.parent.type.spec.code === true &&
      transaction.selection.$to.parent.type.spec.code === true,
  );

  if (
    clipboard === null ||
    isInCodeBlock ||
    isClipboardLeftToBlockNote(clipboard)
  ) {
    return defaultPasteHandler();
  }

  const markdown =
    clipboard.getData('text/markdown') || clipboard.getData('text/plain');

  if (markdown === '') {
    return defaultPasteHandler();
  }

  editor.pasteHTML(
    editor.blocksToFullHTML(convertMarkdownToBlocks(editor, markdown)),
    true,
  );

  return true;
};
