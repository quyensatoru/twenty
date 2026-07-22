import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useRelevantRecordsGqlFields } from '@/object-record/record-field/hooks/useRelevantRecordsGqlFields';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { useFindManyRecordIndexTableParams } from '@/object-record/record-index/hooks/useFindManyRecordIndexTableParams';
import { type ProjectIssue } from '@/project-management/hooks/useProjectIssues';
import { combineFilters, isDefined } from 'twenty-shared/utils';

// View-integrated issue fetch: structural project scope ANDed with the
// tab's own hidden view filter/sort, dynamic recordGqlFields driven by the
// view's visible fields. Must be called from a component nested under a
// ProjectViewProvider mounted with this exact recordIndexId. Use for
// Board/Backlog, where filter/sort/field-visibility are user-facing.
export const useProjectIssuesForView = (
  projectId: string | undefined,
  recordIndexId: string,
) => {
  const { objectMetadataItem } = useRecordIndexContextOrThrow();
  const { filter: viewFilter, orderBy } = useFindManyRecordIndexTableParams(
    'issue',
    recordIndexId,
  );
  const dynamicRecordGqlFields = useRelevantRecordsGqlFields({
    objectMetadataItem,
  });

  const structuralFilter = { projectId: { eq: projectId ?? '' } };

  const { records, loading, refetch } = useFindManyRecords<ProjectIssue>({
    objectNameSingular: 'issue',
    filter: combineFilters([structuralFilter, viewFilter]),
    orderBy,
    recordGqlFields: {
      ...dynamicRecordGqlFields,
      // Always requested regardless of field visibility (issueType/status/
      // sprint stay hardcoded UI, not user-toggleable, but the data is
      // needed either way): ProjectIssueCard's type icon reads issueType,
      // Board's columns key off status, its active-sprint filter and
      // Backlog's sprint-section grouping depend on sprint/epic.
      issueType: true,
      status: true,
      sprint: { id: true, status: true },
      epic: { id: true, name: true },
    },
    skip: !isDefined(projectId),
  });

  return { issues: records, loading, refetch };
};
