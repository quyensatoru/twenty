import { useEffect, useState } from 'react';

import { IssueAiPanel } from './issue-ai-panel';

type IssueAiActivityTabProps = { issueId: string; isActive: boolean };

export const IssueAiActivityTab = ({
  issueId,
  isActive,
}: IssueAiActivityTabProps) => {
  const [openedIssueId, setOpenedIssueId] = useState<string | null>(null);
  useEffect(() => {
    if (isActive) setOpenedIssueId(issueId);
  }, [isActive, issueId]);
  if (!isActive && openedIssueId !== issueId) return null;
  return (
    <div style={{ display: isActive ? 'block' : 'none' }}>
      <IssueAiPanel key={issueId} issueId={issueId} />
    </div>
  );
};
