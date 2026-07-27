import { gql } from '@apollo/client';

export const DELETE_RECORD_VISIBILITY_POLICY = gql`
  mutation DeleteRecordVisibilityPolicy(
    $input: DeleteRecordVisibilityPolicyInput!
  ) {
    deleteRecordVisibilityPolicy(input: $input)
  }
`;
