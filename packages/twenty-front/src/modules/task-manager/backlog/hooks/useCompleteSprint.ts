import { useMutation } from '@apollo/client/react';

import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { COMPLETE_SPRINT } from '@/task-manager/backlog/graphql/completeSprint';

type CompleteSprintMutationResult = {
  completeSprint: number;
};

type CompleteSprintMutationVariables = {
  sprintId: string;
  targetSprintId?: string | null;
};

export const useCompleteSprint = () => {
  const apolloCoreClient = useApolloCoreClient();

  const [mutate, { loading }] = useMutation<
    CompleteSprintMutationResult,
    CompleteSprintMutationVariables
  >(COMPLETE_SPRINT, { client: apolloCoreClient });

  const completeSprint = async (
    sprintId: string,
    targetSprintId?: string | null,
  ) => {
    const result = await mutate({ variables: { sprintId, targetSprintId } });

    return result.data?.completeSprint ?? 0;
  };

  return { completeSprint, loading };
};
