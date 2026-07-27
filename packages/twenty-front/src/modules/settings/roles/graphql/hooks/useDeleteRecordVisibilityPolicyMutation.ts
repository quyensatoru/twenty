import { useMutation } from '@apollo/client/react';

import { DELETE_RECORD_VISIBILITY_POLICY } from '@/settings/roles/graphql/mutations/deleteRecordVisibilityPolicyMutation';

export type DeleteRecordVisibilityPolicyInput = {
  roleId: string;
  objectMetadataId: string;
};

type DeleteRecordVisibilityPolicyResult = {
  deleteRecordVisibilityPolicy: boolean;
};

export const useDeleteRecordVisibilityPolicyMutation = () => {
  return useMutation<
    DeleteRecordVisibilityPolicyResult,
    { input: DeleteRecordVisibilityPolicyInput }
  >(DELETE_RECORD_VISIBILITY_POLICY);
};
