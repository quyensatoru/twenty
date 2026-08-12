import { useEffect, useMemo } from 'react';

import {
  useFindManyRecords,
  type UseFindManyRecordsParams,
} from '@/object-record/hooks/useFindManyRecords';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { isDefined } from 'twenty-shared/utils';
import { type ObjectRecordFilterInput } from '~/generated/graphql';

// Scope lists back an id-in-list filter, so they must be exhaustive. Keep
// fetching pages until the query itself reports there's nothing left,
// instead of capping at a fixed page size.
const SCOPE_LIST_PAGE_SIZE = 1000;

const useAllRecordsForScope = <T extends ObjectRecord = ObjectRecord>(
  params: UseFindManyRecordsParams<T>,
): T[] => {
  const { records, fetchMoreRecords, hasNextPage } = useFindManyRecords<T>({
    limit: SCOPE_LIST_PAGE_SIZE,
    ...params,
  });

  useEffect(() => {
    if (hasNextPage) {
      fetchMoreRecords();
    }
  }, [hasNextPage, fetchMoreRecords]);

  return records;
};

// A UUID that can never exist on a real row — used instead of `{ in: [] }`
// to mean "match nothing": the backend's array-operator validation
// (graphql-query-filter-field.parser.ts) rejects an empty array as invalid
// input, it doesn't treat it as an empty result set.
const NEVER_MATCHING_ID = '00000000-0000-0000-0000-000000000000';

// The picker's search query is typed as ObjectRecordFilterInput
// (packages/twenty-server/.../object-record-filter-input.ts), which only
// has `id`/`createdAt`/`updatedAt`/`deletedAt` (plus and/or/not) — no
// object-specific fields like `appId`/`projectId`. So every scope below,
// other than `merchant` (see directMerchantAppId), must resolve to a
// candidate-id list first (via useFindManyRecords on the TARGET object's
// own, fully-featured filter type) and hand the picker a plain
// `{ id: { in } }`.
export const idsToFilter = (ids: string[]): ObjectRecordFilterInput => ({
  id: { in: ids.length > 0 ? ids : [NEVER_MATCHING_ID] },
});

// The relation fields that must be scoped down from "every record" to
// something derived from the current record's own `project`. Every other
// (objectNameSingular, fieldName) pair is intentionally left unrestricted —
// this is a targeted list, not a generic dependent-field-filtering
// framework.
const SCOPED_RELATION_FIELD_KIND_BY_KEY: Record<
  string,
  'merchant' | 'workspaceMember' | 'sprint' | 'epic' | 'issueStatus' | 'worklog'
> = {
  'issue.assignee': 'workspaceMember',
  'issue.reporter': 'workspaceMember',
  'issue.merchants': 'merchant',
  'issue.sprint': 'sprint',
  'issue.epic': 'epic',
  'issue.status': 'issueStatus',
  'issue.worklogs': 'worklog',
  'epic.assignee': 'workspaceMember',
  'sprint.owner': 'workspaceMember',
};

export type TaskManagerRelationTargetAppScope = {
  filter: ObjectRecordFilterInput | undefined;
  // Set only for the `merchant` scope kind: a project's app can have tens
  // of thousands of merchants, so instead of resolving to an id-in-list
  // `filter` (which would need every merchant id crawled client-side
  // first), the picker searches the merchant object directly, scoped by
  // this appId, via searchMerchantsByAppId.
  directMerchantAppId: string | undefined;
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
}): TaskManagerRelationTargetAppScope => {
  const scopeKind =
    SCOPED_RELATION_FIELD_KIND_BY_KEY[`${objectNameSingular}.${fieldName}`];

  // Fetch the current record's own `project` id directly rather than
  // reading it off the record store: the store only has whatever some
  // OTHER component happened to load (e.g. only populated once the Kanban
  // card's own query resolves), so reading it here raced that load and was
  // intermittently empty. A dedicated query is deterministic regardless of
  // what else is mounted.
  const needsProjectId = isDefined(scopeKind) && scopeKind !== 'worklog';

  const { record: currentRecord } = useFindOneRecord({
    objectNameSingular,
    objectRecordId: recordId ?? '',
    recordGqlFields: { id: true, project: { id: true } },
    skip: !needsProjectId || !isDefined(recordId),
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

  const appAccesses = useAllRecordsForScope({
    objectNameSingular: 'appAccess',
    filter: isDefined(projectAppId)
      ? { appId: { eq: projectAppId } }
      : undefined,
    recordGqlFields: { id: true, memberId: true },
    skip: scopeKind !== 'workspaceMember' || !isDefined(projectAppId),
  });

  const sprints = useAllRecordsForScope({
    objectNameSingular: 'sprint',
    filter: isDefined(projectId) ? { projectId: { eq: projectId } } : undefined,
    recordGqlFields: { id: true },
    skip: scopeKind !== 'sprint' || !isDefined(projectId),
  });

  const epics = useAllRecordsForScope({
    objectNameSingular: 'epic',
    filter: isDefined(projectId) ? { projectId: { eq: projectId } } : undefined,
    recordGqlFields: { id: true },
    skip: scopeKind !== 'epic' || !isDefined(projectId),
  });

  const issueStatuses = useAllRecordsForScope({
    objectNameSingular: 'issueStatus',
    filter: isDefined(projectId) ? { projectId: { eq: projectId } } : undefined,
    recordGqlFields: { id: true },
    skip: scopeKind !== 'issueStatus' || !isDefined(projectId),
  });

  // Worklogs belong exclusively to the issue they were logged against
  // (issueId is required, cascade-delete) — unlike merchants/sprints/epics,
  // which are shared pools scoped by project, a worklog can never be picked
  // up from elsewhere. Scope candidates to this issue's own worklogs, not
  // its project's.
  const worklogs = useAllRecordsForScope({
    objectNameSingular: 'worklog',
    filter: isDefined(recordId) ? { issueId: { eq: recordId } } : undefined,
    recordGqlFields: { id: true },
    skip: scopeKind !== 'worklog' || !isDefined(recordId),
  });

  return useMemo((): TaskManagerRelationTargetAppScope => {
    switch (scopeKind) {
      case 'merchant':
        return {
          filter: undefined,
          directMerchantAppId: isDefined(projectAppId)
            ? projectAppId
            : undefined,
        };
      case 'workspaceMember':
        return {
          filter: isDefined(projectAppId)
            ? idsToFilter(
                appAccesses
                  .map((appAccess) => appAccess.memberId as string | undefined)
                  .filter(isDefined),
              )
            : undefined,
          directMerchantAppId: undefined,
        };
      case 'sprint':
        return {
          filter: isDefined(projectId)
            ? idsToFilter(sprints.map((sprint) => sprint.id))
            : undefined,
          directMerchantAppId: undefined,
        };
      case 'epic':
        return {
          filter: isDefined(projectId)
            ? idsToFilter(epics.map((epic) => epic.id))
            : undefined,
          directMerchantAppId: undefined,
        };
      case 'issueStatus':
        return {
          filter: isDefined(projectId)
            ? idsToFilter(issueStatuses.map((issueStatus) => issueStatus.id))
            : undefined,
          directMerchantAppId: undefined,
        };
      case 'worklog':
        return {
          filter: isDefined(recordId)
            ? idsToFilter(worklogs.map((worklog) => worklog.id))
            : undefined,
          directMerchantAppId: undefined,
        };
      default:
        return { filter: undefined, directMerchantAppId: undefined };
    }
  }, [
    scopeKind,
    recordId,
    projectId,
    projectAppId,
    worklogs,
    appAccesses,
    sprints,
    epics,
    issueStatuses,
  ]);
};
