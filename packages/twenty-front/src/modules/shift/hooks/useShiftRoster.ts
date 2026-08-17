import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';

// Hand-written against the CORE client (like the attendance mutations): the
// shiftRoster query lives on the core schema and is not part of the generated
// object-record operations. It returns ONLY safe coverage fields — no attendance,
// cancel, or pay data ever comes back.
export const SHIFT_ROSTER = gql`
  query ShiftRoster($fromDate: String!, $toDate: String!) {
    shiftRoster(fromDate: $fromDate, toDate: $toDate) {
      id
      date
      status
      templateCode
      templateName
      startTime
      endTime
      shiftTemplateId
      memberId
      memberName
    }
  }
`;

export type ShiftRosterEntry = {
  id: string;
  date: string;
  status: string;
  templateCode: string | null;
  templateName: string | null;
  startTime: string | null;
  endTime: string | null;
  shiftTemplateId: string | null;
  memberId: string | null;
  memberName: string | null;
};

export const useShiftRoster = ({
  fromDate,
  toDate,
}: {
  fromDate: string;
  toDate: string;
}) => {
  const apolloCoreClient = useApolloCoreClient();

  const { data, loading, error, refetch } = useQuery<{
    shiftRoster: ShiftRosterEntry[];
  }>(SHIFT_ROSTER, {
    client: apolloCoreClient,
    variables: { fromDate, toDate },
    fetchPolicy: 'cache-and-network',
  });

  return { roster: data?.shiftRoster ?? [], loading, error, refetch };
};
