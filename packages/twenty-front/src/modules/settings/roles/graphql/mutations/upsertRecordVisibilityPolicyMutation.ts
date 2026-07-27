import { gql } from '@apollo/client';

import { RECORD_VISIBILITY_POLICY_FRAGMENT } from '@/settings/roles/graphql/fragments/recordVisibilityPolicyFragment';

export const UPSERT_RECORD_VISIBILITY_POLICY = gql`
  ${RECORD_VISIBILITY_POLICY_FRAGMENT}
  mutation UpsertRecordVisibilityPolicy(
    $input: UpsertRecordVisibilityPolicyInput!
  ) {
    upsertRecordVisibilityPolicy(input: $input) {
      ...RecordVisibilityPolicyFragment
    }
  }
`;
