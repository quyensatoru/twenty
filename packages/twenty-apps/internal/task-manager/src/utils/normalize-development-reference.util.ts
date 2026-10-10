import { extractIssueKeys } from './extract-issue-keys.util';

export type DevelopmentLinkKind = 'BRANCH' | 'COMMIT' | 'PULL_REQUEST';

// What the public webhook route accepts per reference. Provider-agnostic on
// purpose: a ten-line forwarder in GitLab CI, a GitHub Action or a Bitbucket
// pipe posts this shape, so no Twenty credential ever lives in git hosting.
export type DevelopmentReferenceInput = {
  kind?: unknown;
  title?: unknown;
  url?: unknown;
  status?: unknown;
  externalId?: unknown;
  authorName?: unknown;
  issueKeys?: unknown;
  text?: unknown;
};

export type NormalizedDevelopmentReference = {
  type: DevelopmentLinkKind;
  title: string | null;
  url: string | null;
  status: string | null;
  externalId: string | null;
  authorName: string | null;
  issueKeys: string[];
};

const readText = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() !== '' ? value : null;

// `branch`, `commit`, `pull-request` and the shorthands forwarders use
// (`mr`, `merge-request`, `pull_request`). Unknown kinds are branches: the
// title still carries the issue key, which is what the panel groups on.
const readKind = (value: unknown): DevelopmentLinkKind => {
  if (typeof value !== 'string') {
    return 'BRANCH';
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === 'commit') {
    return 'COMMIT';
  }

  if (
    normalized === 'pull-request' ||
    normalized === 'pull_request' ||
    normalized === 'pullrequest' ||
    normalized === 'mr' ||
    normalized === 'merge-request' ||
    normalized === 'mergerequest'
  ) {
    return 'PULL_REQUEST';
  }

  return 'BRANCH';
};

// Explicit keys first, then whatever the title, id and free text mention —
// GitLab puts the key in the branch name, GitHub in the MR title, so every
// carrier text is scanned.
export const normalizeDevelopmentReference = (
  input: DevelopmentReferenceInput,
): NormalizedDevelopmentReference => {
  const title = readText(input.title);
  const externalId = readText(input.externalId);
  const freeText = readText(input.text);
  const explicitKeys = Array.isArray(input.issueKeys)
    ? input.issueKeys.filter(
        (key): key is string => typeof key === 'string' && key.trim() !== '',
      )
    : [];
  const scannedKeys = [
    ...extractIssueKeys(title),
    ...extractIssueKeys(externalId),
    ...extractIssueKeys(freeText),
  ];

  return {
    type: readKind(input.kind),
    title,
    url: readText(input.url),
    status:
      readText(input.status) === null
        ? null
        : (readText(input.status) as string).toUpperCase(),
    externalId,
    authorName: readText(input.authorName),
    issueKeys: [
      ...new Set([
        ...explicitKeys.map((key) => key.toUpperCase()),
        ...scannedKeys,
      ]),
    ],
  };
};
