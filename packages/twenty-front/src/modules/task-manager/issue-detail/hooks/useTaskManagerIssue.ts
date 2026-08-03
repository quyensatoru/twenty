import { useEffect } from 'react';

import { useGenerateDepthRecordGqlFieldsFromObject } from '@/object-record/graphql/record-gql-fields/hooks/useGenerateDepthRecordGqlFieldsFromObject';
import { type RecordGqlFields } from '@/object-record/graphql/record-gql-fields/types/RecordGqlFields';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { useUpsertRecordsInStore } from '@/object-record/record-store/hooks/useUpsertRecordsInStore';

const ISSUE_POLL_INTERVAL_MS = 5000;

export const useTaskManagerIssue = (issueId: string) => {
  const { recordGqlFields: depthOneRecordGqlFields } =
    useGenerateDepthRecordGqlFieldsFromObject({
      objectNameSingular: 'issue',
      depth: 1,
    });

  // Depth 1 only loads relation identifiers (id + label identifier) by
  // default, so status.color (needed for the header status badge) is
  // missing unless added explicitly — color isn't IssueStatus's label
  // identifier (name is).
  const recordGqlFields: RecordGqlFields = {
    ...depthOneRecordGqlFields,
    status: {
      ...(typeof depthOneRecordGqlFields.status === 'object'
        ? depthOneRecordGqlFields.status
        : undefined),
      color: true,
    },
  };

  const {
    record: issue,
    loading,
    refetch,
  } = useFindOneRecord({
    objectNameSingular: 'issue',
    objectRecordId: issueId,
    recordGqlFields,
    pollInterval: ISSUE_POLL_INTERVAL_MS,
  });

  const { upsertRecordsInStore } = useUpsertRecordsInStore();

  useEffect(() => {
    if (issue) {
      upsertRecordsInStore({ partialRecords: [issue] });
    }
  }, [issue, upsertRecordsInStore]);

  return { issue, loading, refetch };
};
