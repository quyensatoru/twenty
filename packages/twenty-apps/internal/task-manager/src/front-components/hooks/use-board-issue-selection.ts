import { useEffect, useState } from 'react';
import { navigate, type AppPath } from 'twenty-sdk/front-component';

import { parseBoardIssueAnchor } from '../utils/parse-board-anchor.util';
import {
  useHostLocationHash,
  useHostLocationPathname,
} from './use-host-location';

// Mirrors the open issue modal into the host URL (`<page>#issue-<id>`), the
// same shape as the modal's copy-link, so the address bar can be shared too.
export const useBoardIssueSelection = () => {
  const pathname = useHostLocationPathname();
  const anchoredIssueId = parseBoardIssueAnchor(useHostLocationHash());
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(
    anchoredIssueId,
  );

  // A link pasted into the same tab only changes the fragment, which does not
  // remount the page.
  useEffect(() => {
    if (anchoredIssueId !== null) {
      setSelectedIssueId(anchoredIssueId);
    }
  }, [anchoredIssueId]);

  const selectIssue = (issueId: string | null) => {
    setSelectedIssueId(issueId);

    if (pathname === '') {
      return;
    }

    const destination =
      issueId === null ? pathname : `${pathname}#issue-${issueId}`;

    // The modal is already open; a failed update only leaves the address bar
    // behind.
    void navigate(destination as AppPath, undefined, undefined, {
      replace: true,
      surface: 'main',
    }).catch(() => undefined);
  };

  return { selectedIssueId, selectIssue };
};
