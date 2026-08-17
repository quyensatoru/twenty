import { useMutation } from '@apollo/client/react';

import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import {
  CANCEL_SHIFT,
  CHECK_IN_SHIFT,
  CHECK_OUT_SHIFT,
} from '@/shift/graphql/shiftAttendanceMutations';

export const useShiftAttendance = () => {
  const apolloCoreClient = useApolloCoreClient();

  const [checkInShiftMutation] = useMutation(CHECK_IN_SHIFT, {
    client: apolloCoreClient,
  });
  const [checkOutShiftMutation] = useMutation(CHECK_OUT_SHIFT, {
    client: apolloCoreClient,
  });
  const [cancelShiftMutation] = useMutation(CANCEL_SHIFT, {
    client: apolloCoreClient,
  });

  return {
    checkInShift: (shiftId: string) =>
      checkInShiftMutation({ variables: { shiftId } }),
    checkOutShift: (shiftId: string, handoverNote: string | null) =>
      checkOutShiftMutation({ variables: { shiftId, handoverNote } }),
    cancelShift: (shiftId: string, reason: string, category: string) =>
      cancelShiftMutation({ variables: { shiftId, reason, category } }),
  };
};
