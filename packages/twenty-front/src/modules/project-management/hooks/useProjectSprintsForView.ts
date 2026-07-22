import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useRelevantRecordsGqlFields } from '@/object-record/record-field/hooks/useRelevantRecordsGqlFields';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { useFindManyRecordIndexTableParams } from '@/object-record/record-index/hooks/useFindManyRecordIndexTableParams';
import { type ProjectSprint } from '@/project-management/hooks/useProjectSprints';
import { combineFilters, isDefined } from 'twenty-shared/utils';

// View-integrated sprint fetch for the Sprints tab itself (filter/sort/field
// visibility are user-facing here). Board/Backlog use the plain
// useProjectSprints instead — they only need the sprint list/active-sprint
// for internal grouping logic, not a user-configurable view.
export const useProjectSprintsForView = (
  projectId: string | undefined,
  recordIndexId: string,
) => {
  const { objectMetadataItem } = useRecordIndexContextOrThrow();
  const { filter: viewFilter, orderBy } = useFindManyRecordIndexTableParams(
    'sprint',
    recordIndexId,
  );
  const dynamicRecordGqlFields = useRelevantRecordsGqlFields({
    objectMetadataItem,
  });

  const structuralFilter = { projectId: { eq: projectId ?? '' } };

  const { records, loading, refetch } = useFindManyRecords<ProjectSprint>({
    objectNameSingular: 'sprint',
    filter: combineFilters([structuralFilter, viewFilter]),
    orderBy: orderBy ?? [{ startDate: 'AscNullsLast' }],
    recordGqlFields: {
      ...dynamicRecordGqlFields,
      // Always requested: ProjectSprintRow's status tag and Start/Complete
      // actions key off status, not a user-toggleable field here.
      status: true,
    },
    skip: !isDefined(projectId),
  });

  return { sprints: records, loading, refetch };
};
