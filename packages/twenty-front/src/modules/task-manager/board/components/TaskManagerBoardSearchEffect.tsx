import { useEffect } from 'react';

import { anyFieldFilterValueComponentState } from '@/object-record/record-filter/states/anyFieldFilterValueComponentState';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { useTaskManagerSearchQuery } from '@/task-manager/hooks/useTaskManagerSearchQuery';
import { useSetAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useSetAtomComponentState';

// The board is fed by the generic record index query, which already folds
// anyFieldFilterValue into its group queries — so pushing the task manager
// search there filters server-side and refetches on its own.
export const TaskManagerBoardSearchEffect = () => {
  const searchQuery = useTaskManagerSearchQuery();
  const { recordIndexId } = useRecordIndexContextOrThrow();

  const setAnyFieldFilterValue = useSetAtomComponentState(
    anyFieldFilterValueComponentState,
    recordIndexId,
  );

  useEffect(() => {
    setAnyFieldFilterValue(searchQuery);
  }, [searchQuery, setAnyFieldFilterValue]);

  return null;
};
