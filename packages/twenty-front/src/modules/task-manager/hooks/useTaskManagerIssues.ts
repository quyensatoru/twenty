import { useEffect, useMemo } from 'react';

import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { generateDepthRecordGqlFieldsFromFields } from '@/object-record/graphql/record-gql-fields/utils/generateDepthRecordGqlFieldsFromFields';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { visibleRecordFieldsComponentSelector } from '@/object-record/record-field/states/visibleRecordFieldsComponentSelector';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { useUpsertRecordsInStore } from '@/object-record/record-store/hooks/useUpsertRecordsInStore';
import { useAtomComponentSelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentSelectorValue';
import { isDefined } from 'twenty-shared/utils';

// Structural fields Board/Backlog/Roadmap group, sort, or filter by — needed
// regardless of whether the user hid them from the Fields dropdown.
const ISSUE_BASE_RECORD_GQL_FIELDS = {
  id: true,
  title: true,
  issueKey: true,
  issueType: true,
  status: true,
  priority: true,
  storyPoints: true,
  position: true,
  dueDate: true,
  projectId: true,
  sprintId: true,
  epicId: true,
  parentId: true,
  assignee: true,
  reporter: true,
};

export const useTaskManagerIssues = ({ projectId }: { projectId?: string }) => {
  const { objectMetadataItem, recordIndexId } = useRecordIndexContextOrThrow();
  const { objectMetadataItems } = useObjectMetadataItems();

  const visibleRecordFields = useAtomComponentSelectorValue(
    visibleRecordFieldsComponentSelector,
    recordIndexId,
  );

  const recordGqlFields = useMemo(() => {
    const visibleFieldMetadataItems = visibleRecordFields
      .map((recordField) =>
        objectMetadataItem.fields.find(
          (field) => field.id === recordField.fieldMetadataItemId,
        ),
      )
      .filter(isDefined);

    return {
      ...ISSUE_BASE_RECORD_GQL_FIELDS,
      ...generateDepthRecordGqlFieldsFromFields({
        objectMetadataItems,
        fields: visibleFieldMetadataItems,
        depth: 1,
      }),
    };
  }, [visibleRecordFields, objectMetadataItem.fields, objectMetadataItems]);

  const { records, loading, refetch } = useFindManyRecords({
    objectNameSingular: 'issue',
    filter: projectId ? { projectId: { eq: projectId } } : undefined,
    recordGqlFields,
    limit: 250,
  });

  const { upsertRecordsInStore } = useUpsertRecordsInStore();

  useEffect(() => {
    upsertRecordsInStore({ partialRecords: records });
  }, [records, upsertRecordsInStore]);

  return { issues: records, loading, refetch };
};
