import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { SHIFT_HANDOVER_SELECTION } from '../constants/record-selections';
import { SHIFT_HANDOVERS_ROUTE_PATH } from '../constants/route-paths';
import { SHIFT_HANDOVERS_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type ShiftHandoverEntry } from '../types/shift-handover-entry';
import { readErrorMessage } from '../utils/read-error-message.util';
import { createAppClient } from './utils/create-app-client.util';
import { fetchMemberNames } from './utils/fetch-member-names.util';
import { listShiftsInRange } from './utils/list-shifts-in-range.util';

type HandoversBody = { fromDate?: string; toDate?: string };

type HandoverShift = Omit<ShiftHandoverEntry, 'memberName' | 'handoverNote'> & {
  memberId: string | null;
  handoverNote: string | null;
};

// The person starting a shift reads what the person on the preceding shift
// handed over, so this route deliberately crosses members: BR-4.6 makes the
// handover note team-readable. The exposure is narrow — only handoverNote plus
// the minimal identity to label it. Only COMPLETED shifts carry a final note.
const handler = async (event: RoutePayload<HandoversBody>) => {
  try {
    const { fromDate, toDate } = event.body ?? {};

    if (fromDate === undefined || toDate === undefined) {
      return { success: false, error: 'fromDate and toDate are required.' };
    }

    const client = createAppClient();

    const shifts = await listShiftsInRange<HandoverShift>({
      client,
      fromDate,
      toDate,
      selection: { ...SHIFT_HANDOVER_SELECTION },
      extraFilters: [{ status: { eq: 'COMPLETED' } }],
    });

    // Only shifts that actually carry a note are handovers worth returning.
    const withNote = shifts.filter(
      (shift) => (shift.handoverNote ?? '').trim().length > 0,
    );

    const memberNameById = await fetchMemberNames(
      client,
      withNote.map((shift) => shift.memberId),
    );

    const handovers: ShiftHandoverEntry[] = withNote.map((shift) => ({
      id: shift.id,
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      templateCode: shift.templateCode,
      templateName: shift.templateName,
      memberName:
        shift.memberId === null
          ? null
          : (memberNameById.get(shift.memberId) ?? null),
      handoverNote: shift.handoverNote as string,
    }));

    return { success: true, handovers };
  } catch (error) {
    return { success: false, error: readErrorMessage(error) };
  }
};

export default defineLogicFunction({
  universalIdentifier: SHIFT_HANDOVERS_LOGIC_FUNCTION_UID,
  name: 'shift-handovers',
  description:
    'Route: team handover notes (COMPLETED shifts with a note) for a range.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: SHIFT_HANDOVERS_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
