import { isNonEmptyString } from '@sniptt/guards';

import { parseInitialBlocknote } from '@/blocknote-editor/utils/parseInitialBlocknote';

const FILE_TOKEN_SEARCH_PARAM = 'token';

// The server re-signs every file URL in a rich text body on each read, so the
// same body comes back with a different token every fetch. Dropping the token
// lets two reads of unchanged content compare equal; the server signs the
// file again from its id when the body is read back.
export const stripFileTokensFromBlocknote = (
  blocknote: string | null | undefined,
): string => {
  if (!isNonEmptyString(blocknote)) {
    return blocknote ?? '';
  }

  const blocks = parseInitialBlocknote(blocknote);

  if (!blocks) {
    return blocknote;
  }

  let hasStrippedToken = false;

  const blocksWithoutFileTokens = blocks.map((block) => {
    const url = (block.props as { url?: unknown } | undefined)?.url;

    if (!isNonEmptyString(url)) {
      return block;
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(url);
    } catch {
      return block;
    }

    if (
      !parsedUrl.pathname.startsWith('/file/') ||
      !parsedUrl.searchParams.has(FILE_TOKEN_SEARCH_PARAM)
    ) {
      return block;
    }

    parsedUrl.searchParams.delete(FILE_TOKEN_SEARCH_PARAM);
    hasStrippedToken = true;

    return {
      ...block,
      props: { ...block.props, url: parsedUrl.toString() },
    };
  });

  return hasStrippedToken ? JSON.stringify(blocksWithoutFileTokens) : blocknote;
};
