import { useMutation } from '@apollo/client/react';

import { UPSERT_RECORD_VISIBILITY_POLICY } from '@/settings/roles/graphql/mutations/upsertRecordVisibilityPolicyMutation';
import { type RecordVisibilityPolicy } from '@/settings/roles/role-permissions/object-level-permissions/record-visibility-policy/types/RecordVisibilityPolicy';

export type UpsertRecordVisibilityPolicyInput = {
  roleId: string;
  objectMetadataId: string;
  // oxlint-disable-next-line typescript/no-explicit-any
  filter: Record<string, any>;
  currentMemberFieldName?: string | null;
};

type UpsertRecordVisibilityPolicyResult = {
  upsertRecordVisibilityPolicy: RecordVisibilityPolicy;
};

export const useUpsertRecordVisibilityPolicyMutation = () => {
  return useMutation<
    UpsertRecordVisibilityPolicyResult,
    { input: UpsertRecordVisibilityPolicyInput }
  >(UPSERT_RECORD_VISIBILITY_POLICY);
};
