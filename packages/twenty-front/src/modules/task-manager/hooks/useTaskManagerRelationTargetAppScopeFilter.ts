import { useMemo } from 'react';

import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { isDefined } from 'twenty-shared/utils';
import { type ObjectRecordFilterInput } from '~/generated/graphql';

// A UUID that can never exist on a real row — used instead of `{ in: [] }`
// to mean "match nothing": the backend's array-operator validation
// (graphql-query-filter-field.parser.ts) rejects an empty array as invalid
// input, it doesn't treat it as an empty result set.
const NEVER_MATCHING_ID = '00000000-0000-0000-0000-000000000000';

// The picker's search query is typed as ObjectRecordFilterInput
// (packages/twenty-server/.../object-record-filter-input.ts), which only
// has `id`/`createdAt`/`updatedAt`/`deletedAt` (plus and/or/not) — no
// object-specific fields like `appId`/`projectId`. So every scope below
// must resolve to a candidate-id list first (via useFindManyRecords on the
// TARGET object's own, fully-featured filter type) and always hand the
// picker a plain `{ id: { in } }`.
const idsToFilter = (ids: string[]): ObjectRecordFilterInput => ({
  id: { in: ids.length > 0 ? ids : [NEVER_MATCHING_ID] },
});

// The relation fields that must be scoped down from "every record" to
// something derived from the current record's own `project`. Every other
// (objectNameSingular, fieldName) pair is intentionally left unrestricted —
// this is a targeted list, not a generic dependent-field-filtering
// framework.
const SCOPED_RELATION_FIELD_KIND_BY_KEY: Record<
  string,
  'merchant' | 'workspaceMember' | 'sprint' | 'epic' | 'issueStatus'
> = {
  'issue.assignee': 'workspaceMember',
  'issue.reporter': 'workspaceMember',
  'issue.merchant': 'merchant',
  'issue.sprint': 'sprint',
  'issue.epic': 'epic',
  'issue.status': 'issueStatus',
  'epic.assignee': 'workspaceMember',
  'sprint.owner': 'workspaceMember',
};

// Returns the extra picker filter for the scoped relation fields above, or
// undefined for every other field (no filter, no extra queries run).
export const useTaskManagerRelationTargetAppScopeFilter = ({
  objectNameSingular,
  fieldName,
  recordId,
}: {
  objectNameSingular: string;
  fieldName: string;
  recordId: string | undefined;
}): ObjectRecordFilterInput | undefined => {
  const scopeKind =
    SCOPED_RELATION_FIELD_KIND_BY_KEY[`${objectNameSingular}.${fieldName}`];

  // Fetch the current record's own `project` id directly rather than
  // reading it off the record store: the store only has whatever some
  // OTHER component happened to load (e.g. only populated once the Kanban
  // card's own query resolves), so reading it here raced that load and was
  // intermittently empty. A dedicated query is deterministic regardless of
  // what else is mounted.
  const { record: currentRecord } = useFindOneRecord({
    objectNameSingular,
    objectRecordId: recordId ?? '',
    recordGqlFields: { id: true, project: { id: true } },
    skip: !isDefined(scopeKind) || !isDefined(recordId),
  });

  const projectId: string | undefined = currentRecord?.project?.id;

  const needsAppLookup =
    scopeKind === 'merchant' || scopeKind === 'workspaceMember';

  const { record: project } = useFindOneRecord({
    objectNameSingular: 'project',
    objectRecordId: projectId ?? '',
    recordGqlFields: { id: true, appId: true },
    skip: !needsAppLookup || !isDefined(projectId),
  });

  const projectAppId: string | null | undefined = project?.appId;

  const { records: merchants } = useFindManyRecords({
    objectNameSingular: 'merchant',
    filter: isDefined(projectAppId)
      ? { appId: { eq: projectAppId } }
      : undefined,
    recordGqlFields: { id: true },
    skip: scopeKind !== 'merchant' || !isDefined(projectAppId),
  });

  const { records: appAccesses } = useFindManyRecords({
    objectNameSingular: 'appAccess',
    filter: isDefined(projectAppId)
      ? { appId: { eq: projectAppId } }
      : undefined,
    recordGqlFields: { id: true, memberId: true },
    skip: scopeKind !== 'workspaceMember' || !isDefined(projectAppId),
  });

  const { records: sprints } = useFindManyRecords({
    objectNameSingular: 'sprint',
    filter: isDefined(projectId) ? { projectId: { eq: projectId } } : undefined,
    recordGqlFields: { id: true },
    skip: scopeKind !== 'sprint' || !isDefined(projectId),
  });

  const { records: epics } = useFindManyRecords({
    objectNameSingular: 'epic',
    filter: isDefined(projectId) ? { projectId: { eq: projectId } } : undefined,
    recordGqlFields: { id: true },
    skip: scopeKind !== 'epic' || !isDefined(projectId),
  });

  const { records: issueStatuses } = useFindManyRecords({
    objectNameSingular: 'issueStatus',
    filter: isDefined(projectId) ? { projectId: { eq: projectId } } : undefined,
    recordGqlFields: { id: true },
    skip: scopeKind !== 'issueStatus' || !isDefined(projectId),
  });

  return useMemo(() => {
    switch (scopeKind) {
      case 'merchant':
        return isDefined(projectAppId)
          ? idsToFilter(merchants.map((merchant) => merchant.id))
          : undefined;
      case 'workspaceMember':
        return isDefined(projectAppId)
          ? idsToFilter(
              appAccesses
                .map((appAccess) => appAccess.memberId as string | undefined)
                .filter(isDefined),
            )
          : undefined;
      case 'sprint':
        return isDefined(projectId)
          ? idsToFilter(sprints.map((sprint) => sprint.id))
          : undefined;
      case 'epic':
        return isDefined(projectId)
          ? idsToFilter(epics.map((epic) => epic.id))
          : undefined;
      case 'issueStatus':
        return isDefined(projectId)
          ? idsToFilter(issueStatuses.map((issueStatus) => issueStatus.id))
          : undefined;
      default:
        return undefined;
    }
  }, [
    scopeKind,
    projectId,
    projectAppId,
    merchants,
    appAccesses,
    sprints,
    epics,
    issueStatuses,
  ]);
};
