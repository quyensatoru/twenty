type RichTextValue = {
  markdown?: string | null;
  tiptap?: string | null;
};

type TipTapNode = {
  attrs?: { src?: unknown; url?: unknown };
  content?: TipTapNode[];
};

// Stops at whitespace and at the characters that close a markdown link, so the
// match is exactly the URL an image or link points to.
const URL_IN_MARKDOWN_REGEX = /https?:\/\/[^\s()<>"'\]]+/g;
const FILE_ID_IN_URL_REGEX = /\/file\/[^/?#]+\/([0-9a-f-]{36})/i;

const readFileId = (url: string): string | null =>
  url.match(FILE_ID_IN_URL_REGEX)?.[1]?.toLowerCase() ?? null;

const rememberSignedUrl = (
  url: unknown,
  signedUrlByFileId: Map<string, string>,
) => {
  if (typeof url !== 'string') {
    return;
  }

  const fileId = readFileId(url);

  if (fileId !== null) {
    signedUrlByFileId.set(fileId, url);
  }
};

const collectTipTapSignedUrls = (
  node: TipTapNode,
  signedUrlByFileId: Map<string, string>,
) => {
  rememberSignedUrl(node.attrs?.src, signedUrlByFileId);
  rememberSignedUrl(node.attrs?.url, signedUrlByFileId);

  for (const child of node.content ?? []) {
    collectTipTapSignedUrls(child, signedUrlByFileId);
  }
};

const parseJson = (json: string | null | undefined): unknown => {
  if (typeof json !== 'string' || json === '') {
    return null;
  }

  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
};

// The server re-signs file URLs on read in the TipTap half of a RICH_TEXT
// value only. The markdown half, which is what this app renders, keeps the
// token minted when the body was saved and is refused once that token expires
// (FILE_TOKEN_EXPIRES_IN). Swap each stored file URL for the freshly signed
// one of the same file.
export const resolveSignedMarkdown = (
  value: RichTextValue | null | undefined,
): string => {
  const markdown = value?.markdown ?? '';

  if (markdown === '') {
    return markdown;
  }

  const signedUrlByFileId = new Map<string, string>();
  const tiptap = parseJson(value?.tiptap);

  if (tiptap !== null && typeof tiptap === 'object') {
    collectTipTapSignedUrls(tiptap as TipTapNode, signedUrlByFileId);
  }

  if (signedUrlByFileId.size === 0) {
    return markdown;
  }

  return markdown.replace(URL_IN_MARKDOWN_REGEX, (url) => {
    const fileId = readFileId(url);

    return fileId === null ? url : (signedUrlByFileId.get(fileId) ?? url);
  });
};

// Two reads of a body nobody edited differ only in their file tokens. Comparing
// without them is what keeps a refetch from handing the editor a "new" value
// and reloading every image in it.
export const stripFileTokens = (markdown: string): string =>
  markdown.replace(URL_IN_MARKDOWN_REGEX, (url) =>
    readFileId(url) === null
      ? url
      : url.replace(/([?&])token=[^&#]*&?/, '$1').replace(/[?&]$/, ''),
  );
