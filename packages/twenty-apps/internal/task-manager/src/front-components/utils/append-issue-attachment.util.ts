import { APPEND_ISSUE_ATTACHMENT_ROUTE_PATH } from '../../constants/route-paths';
import { postAppRoute } from './post-app-route.util';

// Appends a stored file to the issue's FILES field, so an image pasted into
// the description or a comment also shows up in the Attachments widget — the
// way Jira files an embedded image. The host upload only stores the bytes;
// filing is a separate write the app owns.
//
// Writes for one issue are chained rather than fired in parallel: every append
// is a read-modify-write inside the route, and two of them in flight at once
// would land in whatever order the server finished them, dropping one entry.
const appendChainByIssueId = new Map<string, Promise<void>>();

export const appendIssueAttachment = (
  issueId: string,
  file: { fileId: string; label: string },
): Promise<void> => {
  const run = () =>
    postAppRoute(APPEND_ISSUE_ATTACHMENT_ROUTE_PATH, { issueId, file }).then(
      () => {
        // Released only when nothing newer queued behind it: without this the
        // map grows one entry per issue ever opened.
        if (appendChainByIssueId.get(issueId) === next) {
          appendChainByIssueId.delete(issueId);
        }
      },
    );

  const previous = appendChainByIssueId.get(issueId) ?? Promise.resolve();
  // Run after the previous append whether it succeeded or failed: one failed
  // image must not wedge every later one for the same issue.
  const next = previous.then(run, run);

  appendChainByIssueId.set(issueId, next);

  return next;
};
