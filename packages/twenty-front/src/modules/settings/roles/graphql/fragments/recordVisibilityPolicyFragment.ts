import { gql } from '@apollo/client';

export const RECORD_VISIBILITY_POLICY_FRAGMENT = gql`
  fragment RecordVisibilityPolicyFragment on RecordVisibilityPolicy {
    id
    roleId
    objectMetadataId
    filter
    currentMemberFieldName
  }
`;
