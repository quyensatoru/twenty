import { type RelationTargetAppScopeEntry } from '../app-scope/assert-relation-target-app-scope.util';

// assignee, reporter and merchant links must all belong to the issue's own
// app. Ported one-for-one from the fork's three createOne/createMany/updateOne
// hooks, which each rebuilt this list inline.
export const buildIssueRelationTargets = (data: {
  assigneeId?: unknown;
  reporterId?: unknown;
  merchantIds?: unknown;
}): RelationTargetAppScopeEntry[] => {
  const entries: RelationTargetAppScopeEntry[] = [];

  if (typeof data.assigneeId === 'string') {
    entries.push({
      fieldName: 'assigneeId',
      kind: 'workspaceMember',
      targetId: data.assigneeId,
    });
  }

  if (typeof data.reporterId === 'string') {
    entries.push({
      fieldName: 'reporterId',
      kind: 'workspaceMember',
      targetId: data.reporterId,
    });
  }

  if (Array.isArray(data.merchantIds)) {
    for (const merchantId of data.merchantIds) {
      if (typeof merchantId === 'string') {
        entries.push({
          fieldName: 'merchantIds',
          kind: 'merchant',
          targetId: merchantId,
        });
      }
    }
  }

  return entries;
};
