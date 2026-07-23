import { gql } from '@apollo/client';

export const COMPLETE_SPRINT = gql`
  mutation CompleteSprint($sprintId: UUID!, $targetSprintId: UUID) {
    completeSprint(sprintId: $sprintId, targetSprintId: $targetSprintId)
  }
`;
