import { useEffect, useRef, useState } from 'react';

import { SEARCH_ISSUES_ROUTE_PATH } from '../../constants/route-paths';
import { type LinkedIssueSummary } from '../components/task-rich-text-link-chip';
import { postAppRoute } from '../utils/post-app-route.util';

// The key, title and type of every issue a discussion links to, looked up in
// one request per batch of new ids. An id the route does not return (deleted,
// or in a project the reader cannot see) is asked once and then left alone:
// its link stays a plain link.
export const useLinkedIssueSummaries = (
  issueIds: string[],
): ReadonlyMap<string, LinkedIssueSummary> => {
  const [issuesById, setIssuesById] = useState<
    ReadonlyMap<string, LinkedIssueSummary>
  >(() => new Map());
  // oxlint-disable-next-line twenty/no-state-useref
  const requestedIdsRef = useRef(new Set<string>());
  const issueIdsKey = [...issueIds].sort().join(',');

  useEffect(() => {
    const missingIds = issueIdsKey
      .split(',')
      .filter(
        (issueId) => issueId !== '' && !requestedIdsRef.current.has(issueId),
      );

    if (missingIds.length === 0) {
      return;
    }

    for (const issueId of missingIds) {
      requestedIdsRef.current.add(issueId);
    }

    void postAppRoute<{ success: boolean; issues: LinkedIssueSummary[] }>(
      SEARCH_ISSUES_ROUTE_PATH,
      { issueIds: missingIds },
    )
      .then((response) => {
        if (response.issues.length === 0) {
          return;
        }

        setIssuesById((previous) => {
          const next = new Map(previous);

          for (const issue of response.issues) {
            next.set(issue.id.toLowerCase(), issue);
          }

          return next;
        });
      })
      .catch(() => {
        // On a failed lookup the links stay plain, and the ids are asked
        // again the next time the list of links changes.
        for (const issueId of missingIds) {
          requestedIdsRef.current.delete(issueId);
        }
      });
  }, [issueIdsKey]);

  return issuesById;
};
