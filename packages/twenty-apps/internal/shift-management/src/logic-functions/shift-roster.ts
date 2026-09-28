import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { SHIFT_ROSTER_SELECTION } from '../constants/record-selections';
import { SHIFT_ROSTER_ROUTE_PATH } from '../constants/route-paths';
import { SHIFT_ROSTER_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type ShiftRosterEntry } from '../types/shift-roster-entry';
import { readErrorMessage } from '../utils/read-error-message.util';
import { createAppClient } from './utils/create-app-client.util';
import { fetchMemberNames } from './utils/fetch-member-names.util';
import { listShiftsInRange } from './utils/list-shifts-in-range.util';

type RosterBody = { fromDate?: string; toDate?: string };

type RosterShift = Omit<ShiftRosterEntry, 'memberName'>;

// Team roster for the Register and Analytics pages. Coverage is team-visible by
// design — like the shared roster sheet it replaces — so this route deliberately
// returns every member's shifts, not just the caller's. The exposure is safe
// because SHIFT_ROSTER_SELECTION is the security boundary: no attendance, no
// cancel detail and no pay column is ever read out of the database here.
const handler = async (event: RoutePayload<RosterBody>) => {
  try {
    const { fromDate, toDate } = event.body ?? {};

    if (fromDate === undefined || toDate === undefined) {
      return { success: false, error: 'fromDate and toDate are required.' };
    }

    const client = createAppClient();

    const shifts = await listShiftsInRange<RosterShift>({
      client,
      fromDate,
      toDate,
      selection: { ...SHIFT_ROSTER_SELECTION },
      extraFilters: [{ status: { neq: 'CANCELLED' } }],
    });

    const memberNameById = await fetchMemberNames(
      client,
      shifts.map((shift) => shift.memberId),
    );

    const roster: ShiftRosterEntry[] = shifts.map((shift) => ({
      ...shift,
      memberName:
        shift.memberId === null
          ? null
          : (memberNameById.get(shift.memberId) ?? null),
    }));

    return { success: true, roster };
  } catch (error) {
    return { success: false, error: readErrorMessage(error) };
  }
};

export default defineLogicFunction({
  universalIdentifier: SHIFT_ROSTER_LOGIC_FUNCTION_UID,
  name: 'shift-roster',
  description: 'Route: team shift roster (safe coverage fields) for a range.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: SHIFT_ROSTER_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
