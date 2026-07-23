import { useEffect } from 'react';

import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { useUpsertRecordsInStore } from '@/object-record/record-store/hooks/useUpsertRecordsInStore';

const ISSUE_POLL_INTERVAL_MS = 5000;

export const useTaskManagerIssue = (issueId: string) => {
  const {
    record: issue,
    loading,
    refetch,
  } = useFindOneRecord({
    objectNameSingular: 'issue',
    objectRecordId: issueId,
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
