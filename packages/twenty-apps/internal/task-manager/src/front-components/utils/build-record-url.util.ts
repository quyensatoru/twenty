// The record page path the host routes on. AppPath.RecordShowPage in the SDK
// is a pattern with named params, and the SDK ships no builder for it, so the
// one shape the app needs is written out here.
const buildRecordPath = (objectNameSingular: string, recordId: string): string =>
  `/object/${objectNameSingular}/${recordId}`;

// `baseUrl` is the RECORD_PAGE_BASE_URL application variable. Unset, the result
// is the bare path: still enough to paste into the address bar of the tab the
// reader is already in, and the only honest answer when nothing told the app
// which host it is served from.
export const buildRecordUrl = ({
  baseUrl,
  objectNameSingular,
  recordId,
}: {
  baseUrl: string | undefined;
  objectNameSingular: string;
  recordId: string;
}): string => {
  const path = buildRecordPath(objectNameSingular, recordId);
  const trimmedBaseUrl = (baseUrl ?? '').trim().replace(/\/+$/, '');

  return trimmedBaseUrl === '' ? path : `${trimmedBaseUrl}${path}`;
};

const buildIssueFragmentUrl = ({
  baseUrl,
  issueId,
  fragment,
  boardPath,
}: {
  baseUrl: string | undefined;
  issueId: string;
  fragment: string;
  boardPath?: string;
}): string =>
  boardPath === undefined
    ? `${buildRecordUrl({ baseUrl, objectNameSingular: 'issue', recordId: issueId })}#${fragment}`
    : `${buildBoardIssueUrl({ baseUrl, boardPath, issueId })}/${fragment}`;

export const buildIssueCommentUrl = ({
  baseUrl,
  issueId,
  commentId,
  boardPath,
}: {
  baseUrl: string | undefined;
  issueId: string;
  commentId: string;
  boardPath?: string;
}): string =>
  buildIssueFragmentUrl({ baseUrl, issueId, fragment: `comment-${commentId}`, boardPath });

export const buildIssueWorklogUrl = ({
  baseUrl,
  issueId,
  worklogId,
  boardPath,
}: {
  baseUrl: string | undefined;
  issueId: string;
  worklogId: string;
  boardPath?: string;
}): string =>
  buildIssueFragmentUrl({ baseUrl, issueId, fragment: `worklog-${worklogId}`, boardPath });

// A board deep link: the board page with the issue's modal open. `boardPageUrl`
// is the host page URL without fragment, assembled from the base URL and the
// page path the execution context reports — the path carries
// workspace-specific identifiers no source file may hardcode.
export const buildBoardIssueUrl = ({
  baseUrl,
  boardPath,
  issueId,
}: {
  baseUrl: string | undefined;
  boardPath: string;
  issueId: string;
}): string => {
  const trimmedBaseUrl = (baseUrl ?? '').trim().replace(/\/+$/, '');

  return `${trimmedBaseUrl}${boardPath}#issue-${issueId}`;
};
