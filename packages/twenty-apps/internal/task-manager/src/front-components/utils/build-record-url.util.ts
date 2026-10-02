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

// Neither a comment nor a worklog is a record page of its own, so both are
// addressed as a fragment on the issue's. Nothing scrolls to them yet; the
// fragment identifies which row a link was taken from, which is what somebody
// pasting it into a thread means.
const buildIssueFragmentUrl = ({
  baseUrl,
  issueId,
  fragment,
}: {
  baseUrl: string | undefined;
  issueId: string;
  fragment: string;
}): string =>
  `${buildRecordUrl({ baseUrl, objectNameSingular: 'issue', recordId: issueId })}#${fragment}`;

export const buildIssueCommentUrl = ({
  baseUrl,
  issueId,
  commentId,
}: {
  baseUrl: string | undefined;
  issueId: string;
  commentId: string;
}): string =>
  buildIssueFragmentUrl({ baseUrl, issueId, fragment: `comment-${commentId}` });

export const buildIssueWorklogUrl = ({
  baseUrl,
  issueId,
  worklogId,
}: {
  baseUrl: string | undefined;
  issueId: string;
  worklogId: string;
}): string =>
  buildIssueFragmentUrl({ baseUrl, issueId, fragment: `worklog-${worklogId}` });
