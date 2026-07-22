import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useRelevantRecordsGqlFields } from '@/object-record/record-field/hooks/useRelevantRecordsGqlFields';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { useFindManyRecordIndexTableParams } from '@/object-record/record-index/hooks/useFindManyRecordIndexTableParams';
import { type ProjectEpic } from '@/project-management/hooks/useProjectEpics';
import { combineFilters, isDefined } from 'twenty-shared/utils';

// View-integrated epic fetch for the Epics tab (filter/sort/field visibility
// are user-facing here).
export const useProjectEpicsForView = (
  projectId: string | undefined,
  recordIndexId: string,
) => {
  const { objectMetadataItem } = useRecordIndexContextOrThrow();
  const { filter: viewFilter, orderBy } = useFindManyRecordIndexTableParams(
    'epic',
    recordIndexId,
  );
  const dynamicRecordGqlFields = useRelevantRecordsGqlFields({
    objectMetadataItem,
  });

  const structuralFilter = { projectId: { eq: projectId ?? '' } };

  const { records, loading, refetch } = useFindManyRecords<ProjectEpic>({
    objectNameSingular: 'epic',
    filter: combineFilters([structuralFilter, viewFilter]),
    orderBy,
    recordGqlFields: {
      ...dynamicRecordGqlFields,
      // Always requested: ProjectEpicsTab's status tag and progress bar key
      // off these directly, not user-toggleable fields here.
      status: true,
      issues: { id: true, status: true },
    },
    skip: !isDefined(projectId),
  });

  return { epics: records, loading, refetch };
};
