import { createExtension } from '@blocknote/core';
import { Plugin } from '@tiptap/pm/state';

import { normalizeDocumentForMarkdown } from '@/front-components/host-components/utils/normalizeDocumentForMarkdown';

// An appended transaction joins the change that caused it in the undo history,
// so undoing a Tab reverts the nest and the lift together instead of reviving
// the nesting only for it to be lifted again.
export const markdownDocumentExtension = createExtension({
  key: 'markdownDocument',
  prosemirrorPlugins: [
    new Plugin({
      appendTransaction: (transactions, _oldState, newState) => {
        if (!transactions.some((transaction) => transaction.docChanged)) {
          return null;
        }

        const transaction = newState.tr;

        return normalizeDocumentForMarkdown(transaction) ? transaction : null;
      },
    }),
  ],
});
