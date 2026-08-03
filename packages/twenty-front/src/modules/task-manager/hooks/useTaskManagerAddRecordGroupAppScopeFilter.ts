import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { idsToFilter } from '@/task-manager/hooks/useTaskManagerRelationTargetAppScopeFilter';
import { type ViewFilter } from '@/views/types/ViewFilter';
import { isDefined } from 'twenty-shared/utils';
import { type ObjectRecordFilterInput } from '~/generated/graphql';

// The Kanban board's "New group" pickers (RecordBoardAddGroupColumn's
// AddRecordGroupButton, and ObjectOptionsDropdownAddRecordGroupContent) have
// no record to read a `project` off of like the relation-field pickers do —
// they operate on the current VIEW, whose permanent `project` filter (seeded
// per-project, see project-post-query-hook.service.ts) is the only source of
// scope available. Only `issue.status` needs this; every other
// (objectNameSingular, fieldName) pair is left unrestricted.
const SCOPED_GROUP_BY_FIELD_KEY = 'issue.status';

const extractProjectIdFromViewFilters = (
  viewFilters: ViewFilter[],
  projectFieldMetadataId: string,
): string | undefined => {
  const projectFilter = viewFilters.find(
    (viewFilter) => viewFilter.fieldMetadataId === projectFieldMetadataId,
  );

  if (!isDefined(projectFilter)) {
    return undefined;
  }

  try {
    const parsedValue = JSON.parse(projectFilter.value) as {
      selectedRecordIds?: string[];
    };

    return parsedValue.selectedRecordIds?.[0];
  } catch {
    return undefined;
  }
};

export const useTaskManagerAddRecordGroupAppScopeFilter = ({
  objectNameSingular,
  groupByFieldName,
  projectFieldMetadataId,
  viewFilters,
}: {
  objectNameSingular: string;
  groupByFieldName: string | undefined;
  projectFieldMetadataId: string | undefined;
  viewFilters: ViewFilter[];
}): ObjectRecordFilterInput | undefined => {
  const isScoped =
    `${objectNameSingular}.${groupByFieldName}` === SCOPED_GROUP_BY_FIELD_KEY;

  const projectId =
    isScoped && isDefined(projectFieldMetadataId)
      ? extractProjectIdFromViewFilters(viewFilters, projectFieldMetadataId)
      : undefined;

  const { records: issueStatuses } = useFindManyRecords({
    objectNameSingular: 'issueStatus',
    filter: isDefined(projectId) ? { projectId: { eq: projectId } } : undefined,
    recordGqlFields: { id: true },
    skip: !isScoped || !isDefined(projectId),
  });

  if (!isScoped) {
    return undefined;
  }

  return isDefined(projectId)
    ? idsToFilter(issueStatuses.map((issueStatus) => issueStatus.id))
    : undefined;
};
