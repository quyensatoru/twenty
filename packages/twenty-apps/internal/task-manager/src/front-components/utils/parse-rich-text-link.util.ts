export type RichTextLinkTarget =
  | {
      kind: 'issue';
      issueId: string;
      commentId: string | null;
      // The host the link names, shown when the issue is not found here.
      domain: string | null;
    }
  | { kind: 'external'; domain: string };

const UUID_PATTERN =
  '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const ISSUE_PATH_PATTERN = new RegExp(
  `^/object/issue/(${UUID_PATTERN})/?$`,
  'i',
);
const COMMENT_FRAGMENT_PATTERN = new RegExp(
  `^#comment-(${UUID_PATTERN})$`,
  'i',
);
// The board's own deep link: its page with `#issue-<id>`, which opens that
// issue's modal over the board (see buildBoardIssueUrl).
const BOARD_ISSUE_FRAGMENT_PATTERN = new RegExp(
  `^#issue-(${UUID_PATTERN})$`,
  'i',
);
const LINKED_ISSUE_PATTERN = new RegExp(
  `(?:/object/issue/|#issue-)(${UUID_PATTERN})`,
  'gi',
);
// Any origin parses a bare path; the real one is only known when it is set.
const PATH_ONLY_ORIGIN = 'https://record.invalid';

const stripForComparison = (value: string): string =>
  value
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/+$/, '')
    .toLowerCase();

// Only a link whose text is its own address becomes a chip: words somebody
// chose to link keep their wording.
export const isBareLinkText = (text: string, href: string): boolean =>
  text.trim() !== '' && stripForComparison(text) === stripForComparison(href);

// A link to an issue of this workspace (its record page, optionally a
// comment's fragment on it), any other http(s) link, or null for what is not
// a web link at all.
export const parseRichTextLink = (href: string): RichTextLinkTarget | null => {
  let url: URL;

  try {
    url = new URL(href, PATH_ONLY_ORIGIN);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return null;
  }

  const isPathOnly = url.origin === PATH_ONLY_ORIGIN;
  // Any host: the same workspace is reached under several names (localhost,
  // a LAN address, its domain). Whether the issue is ours is settled by
  // looking it up; one that is not found shows as the host it names.
  const domain = isPathOnly ? null : url.hostname.replace(/^www\./i, '');
  const issueMatch = url.pathname.match(ISSUE_PATH_PATTERN);

  if (issueMatch !== null) {
    const commentMatch = url.hash.match(COMMENT_FRAGMENT_PATTERN);

    return {
      kind: 'issue',
      issueId: issueMatch[1].toLowerCase(),
      commentId: commentMatch === null ? null : commentMatch[1].toLowerCase(),
      domain,
    };
  }

  const boardIssueMatch = url.hash.match(BOARD_ISSUE_FRAGMENT_PATTERN);

  if (boardIssueMatch !== null) {
    return {
      kind: 'issue',
      issueId: boardIssueMatch[1].toLowerCase(),
      commentId: null,
      domain,
    };
  }

  if (isPathOnly) {
    return null;
  }

  return { kind: 'external', domain: url.hostname.replace(/^www\./i, '') };
};

// Every issue a text links to, so a list can look them all up in one request.
export const findLinkedIssueIds = (markdown: string): string[] => [
  ...new Set(
    [...markdown.matchAll(LINKED_ISSUE_PATTERN)].map((match) =>
      match[1].toLowerCase(),
    ),
  ),
];
