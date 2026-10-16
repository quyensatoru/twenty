import { type ReactNode, useMemo } from 'react';

import { useLinkedIssueSummaries } from '../hooks/use-linked-issue-summaries';
import { findLinkedIssueIds } from '../utils/parse-rich-text-link.util';
import { readRecordPageBaseUrl } from '../utils/read-record-page-base-url.util';
import { TaskRichTextLinkChipsContext } from './task-rich-text-link-chip';

type TaskRichTextLinkChipsScopeProps = {
  markdown: string;
  children: ReactNode;
};

// Draws the links of one text as chips, the way the discussion does, for a
// preview that stands on its own (the description).
export const TaskRichTextLinkChipsScope = ({
  markdown,
  children,
}: TaskRichTextLinkChipsScopeProps) => {
  const linkedIssueIds = useMemo(
    () => findLinkedIssueIds(markdown),
    [markdown],
  );
  const issuesById = useLinkedIssueSummaries(linkedIssueIds);
  const linkChips = useMemo(
    () => ({ baseUrl: readRecordPageBaseUrl(), issuesById }),
    [issuesById],
  );

  return (
    <TaskRichTextLinkChipsContext.Provider value={linkChips}>
      {children}
    </TaskRichTextLinkChipsContext.Provider>
  );
};
