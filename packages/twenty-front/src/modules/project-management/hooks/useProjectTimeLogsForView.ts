import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useRelevantRecordsGqlFields } from '@/object-record/record-field/hooks/useRelevantRecordsGqlFields';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { useFindManyRecordIndexTableParams } from '@/object-record/record-index/hooks/useFindManyRecordIndexTableParams';
import { type ProjectTimeLog } from '@/project-management/hooks/useProjectTimeLogs';
import { isDefined } from 'twenty-shared/utils';

// View-integrated time log fetch for the Timelogs tab. TimeLog has no direct
// project relation, the filter DSL doesn't support nested issue.projectId,
// and querying issue.project transitively through TimeLog resolves to null
// (a two-relation-deep traversal this backend doesn't support) — so project
// scoping is done by membership against the project's own issue id set
// (already fetched by the caller for the "Log Time" issue picker), same
// precedent as useEpicIdsOutsideProject.ts.
export const useProjectTimeLogsForView = (
  projectIssueIds: Set<string>,
  recordIndexId: string,
) => {
  const { objectMetadataItem } = useRecordIndexContextOrThrow();
  const { filter: viewFilter, orderBy } = useFindManyRecordIndexTableParams(
    'timeLog',
    recordIndexId,
  );
  const dynamicRecordGqlFields = useRelevantRecordsGqlFields({
    objectMetadataItem,
  });

  const { records, loading, refetch } = useFindManyRecords<ProjectTimeLog>({
    objectNameSingular: 'timeLog',
    filter: viewFilter,
    orderBy: orderBy ?? [{ loggedDate: 'DescNullsLast' }],
    recordGqlFields: {
      ...dynamicRecordGqlFields,
      // Always requested: issue.name is the row's primary label; issue.id
      // drives the structural project-scope filter below.
      issue: { id: true, name: true },
    },
  });

  const timeLogs = records.filter(
    (timeLog) =>
      isDefined(timeLog.issue) && projectIssueIds.has(timeLog.issue.id),
  );

  return { timeLogs, loading, refetch };
};
