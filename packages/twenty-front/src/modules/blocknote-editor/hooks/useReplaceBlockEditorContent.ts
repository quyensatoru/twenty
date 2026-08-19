import { useCallback, useState } from 'react';
import { atom, useStore } from 'jotai';

import { type BLOCK_SCHEMA } from '@/blocknote-editor/blocks/Schema';
import { parseInitialBlocknote } from '@/blocknote-editor/utils/parseInitialBlocknote';
import { recordStoreFamilyState } from '@/object-record/record-store/states/recordStoreFamilyState';
import { isDeeplyEqual } from '~/utils/isDeeplyEqual';

export const useReplaceBlockEditorContent = (
  editor: typeof BLOCK_SCHEMA.BlockNoteEditor,
  fieldName: string,
) => {
  const store = useStore();

  // BlockNote normalizes blocks (ids, default props) when it builds
  // editor.document, so a hydration replace can fire even when the fetched
  // content is unchanged. This atom, read/written through the store
  // directly rather than via useAtom, lets callers check synchronously
  // whether an onChange was caused by that hydration rather than a real
  // user edit, so they can skip re-persisting it.
  const [isReplacingContentProgrammaticallyAtom] = useState(() => atom(false));

  const replaceBlockEditorContent = useCallback(
    (recordId: string) => {
      const record = store.get(recordStoreFamilyState.atomFamily(recordId));

      const fieldValue = record?.[fieldName] as
        | { blocknote?: string | null }
        | undefined;

      const content = parseInitialBlocknote(fieldValue?.blocknote) ?? [
        { type: 'paragraph' as const, content: '' },
      ];

      if (!isDeeplyEqual(editor.document, content as typeof editor.document)) {
        store.set(isReplacingContentProgrammaticallyAtom, true);
        try {
          editor.replaceBlocks(
            editor.document,
            content as typeof editor.document,
          );
        } finally {
          store.set(isReplacingContentProgrammaticallyAtom, false);
        }
      }
    },
    [store, editor, fieldName, isReplacingContentProgrammaticallyAtom],
  );

  return {
    replaceBlockEditorContent,
    isReplacingContentProgrammaticallyAtom,
  };
};
