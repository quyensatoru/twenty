import { act, renderHook } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
import { type ReactNode } from 'react';

import { useReplaceBlockEditorContent } from '@/blocknote-editor/hooks/useReplaceBlockEditorContent';
import { recordStoreFamilyState } from '@/object-record/record-store/states/recordStoreFamilyState';
import { jotaiStore } from '@/ui/utilities/state/jotai/jotaiStore';

const Wrapper = ({ children }: { children: ReactNode }) => (
  <JotaiProvider store={jotaiStore}>{children}</JotaiProvider>
);

describe('useReplaceBlockEditorContent', () => {
  it('marks the replace as programmatic while it swaps in fetched content, so callers can skip persisting it as a user edit', () => {
    const recordId = 'record-under-test';

    jotaiStore.set(recordStoreFamilyState.atomFamily(recordId), {
      id: recordId,
      __typename: 'Issue',
      description: {
        blocknote: JSON.stringify([{ type: 'paragraph', content: 'hello' }]),
        markdown: null,
      },
    } as any);

    const flagSeenDuringReplace: boolean[] = [];

    const editor = {
      document: [{ type: 'paragraph', content: 'stale' }],
      replaceBlocks: jest.fn(() => {
        flagSeenDuringReplace.push(
          jotaiStore.get(result.current.isReplacingContentProgrammaticallyAtom),
        );
      }),
    } as any;

    const { result } = renderHook(
      () => useReplaceBlockEditorContent(editor, 'description'),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.replaceBlockEditorContent(recordId);
    });

    expect(editor.replaceBlocks).toHaveBeenCalledTimes(1);
    expect(flagSeenDuringReplace).toEqual([true]);
    expect(
      jotaiStore.get(result.current.isReplacingContentProgrammaticallyAtom),
    ).toBe(false);
  });

  it('does not touch the editor when the fetched content already matches the document', () => {
    const recordId = 'record-already-in-sync';
    const matchingContent = [{ type: 'paragraph', content: 'hello' }];

    jotaiStore.set(recordStoreFamilyState.atomFamily(recordId), {
      id: recordId,
      __typename: 'Issue',
      description: {
        blocknote: JSON.stringify(matchingContent),
        markdown: null,
      },
    } as any);

    const editor = {
      document: matchingContent,
      replaceBlocks: jest.fn(),
    } as any;

    const { result } = renderHook(
      () => useReplaceBlockEditorContent(editor, 'description'),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.replaceBlockEditorContent(recordId);
    });

    expect(editor.replaceBlocks).not.toHaveBeenCalled();
  });
});
