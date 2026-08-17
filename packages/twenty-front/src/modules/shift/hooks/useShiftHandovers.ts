import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';

// Hand-written against the CORE client (like the roster query): shiftHandovers
// lives on the core schema, not the generated object-record operations. It
// returns the team's handover notes (COMPLETED shifts that carry a note) plus the
// minimal identity to label each — no attendance, cancel, or pay data.
export const SHIFT_HANDOVERS = gql`
  query ShiftHandovers($fromDate: String!, $toDate: String!) {
    shiftHandovers(fromDate: $fromDate, toDate: $toDate) {
      id
      date
      startTime
      endTime
      templateCode
      templateName
      memberName
      handoverNote
    }
  }
`;

export type ShiftHandoverEntry = {
  id: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  templateCode: string | null;
  templateName: string | null;
  memberName: string | null;
  handoverNote: string;
};

export const useShiftHandovers = ({
  fromDate,
  toDate,
}: {
  fromDate: string;
  toDate: string;
}) => {
  const apolloCoreClient = useApolloCoreClient();

  const { data, loading, error, refetch } = useQuery<{
    shiftHandovers: ShiftHandoverEntry[];
  }>(SHIFT_HANDOVERS, {
    client: apolloCoreClient,
    variables: { fromDate, toDate },
    fetchPolicy: 'cache-and-network',
  });

  return { handovers: data?.shiftHandovers ?? [], loading, error, refetch };
};
