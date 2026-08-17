import { gql } from '@apollo/client';

export const CHECK_IN_SHIFT = gql`
  mutation CheckInShift($shiftId: UUID!) {
    checkInShift(shiftId: $shiftId)
  }
`;

export const CHECK_OUT_SHIFT = gql`
  mutation CheckOutShift($shiftId: UUID!, $handoverNote: String) {
    checkOutShift(shiftId: $shiftId, handoverNote: $handoverNote)
  }
`;

export const CANCEL_SHIFT = gql`
  mutation CancelShift($shiftId: UUID!, $reason: String!, $category: String!) {
    cancelShift(shiftId: $shiftId, reason: $reason, category: $category)
  }
`;
