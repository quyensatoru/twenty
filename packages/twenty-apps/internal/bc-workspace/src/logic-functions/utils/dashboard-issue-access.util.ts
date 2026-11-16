import { type ApiClient } from '../../types/api-client';
import { type BcIssueRecord } from '../../types/bc-records';
import { type BcScope } from '../../types/bc-scope';
import { loadScopedVipClient } from './client-store.util';
import { assertCanEditClient } from './dashboard-data.util';
import { BC_ISSUE_SELECTION } from './record-selections';
import { findFirstRecord } from './record-store.util';

export const loadEditableIssue = async ({
  client,
  scope,
  issueId,
}: {
  client: ApiClient;
  scope: BcScope;
  issueId: string;
}): Promise<BcIssueRecord> => {
  const issue = await findFirstRecord<BcIssueRecord>({
    client,
    objectNamePlural: 'bcIssues',
    filter: { id: { eq: issueId } },
    selection: BC_ISSUE_SELECTION,
  });

  if (issue === null || issue.vipClientId === null) {
    throw new Error('This issue no longer exists.');
  }

  const vipClient = await loadScopedVipClient({
    client,
    scope,
    vipClientId: issue.vipClientId,
  });

  assertCanEditClient(scope, vipClient);

  return issue;
};
