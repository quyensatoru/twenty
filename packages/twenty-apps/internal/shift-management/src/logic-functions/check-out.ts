import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { CHECK_OUT_ROUTE_PATH } from '../constants/route-paths';
import { CHECK_OUT_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { readErrorMessage } from '../utils/read-error-message.util';
import { validateCheckOut } from '../utils/validate-attendance-action.util';
import { readShiftOwnershipError } from './utils/assert-shift-owner-or-elevated.util';
import { createAppClient } from './utils/create-app-client.util';
import { fetchShift } from './utils/fetch-shift.util';
import { readActor } from './utils/read-actor.util';
import { updateShift } from './utils/update-shift.util';

type CheckOutBody = { shiftId?: string; handoverNote?: string | null };

// Payable minutes are frozen here: actual elapsed time capped at the shift's
// own scheduled length, so early check-in or late check-out never earns more
// than the shift's hours.
const handler = async (
  event: RoutePayload<CheckOutBody>,
  context: { workspaceMemberId: string | null },
) => {
  try {
    const { shiftId, handoverNote } = event.body ?? {};

    if (shiftId === undefined) {
      return { success: false, error: 'shiftId is required.' };
    }

    const actor = await readActor(context.workspaceMemberId);
    const client = createAppClient();
    const shift = await fetchShift(client, shiftId);

    if (shift === null) {
      return { success: false, error: 'Shift not found.' };
    }

    const ownershipError = readShiftOwnershipError({
      actor,
      shiftMemberId: shift.memberId,
    });

    if (ownershipError !== null) {
      return { success: false, error: ownershipError };
    }

    const outcome = validateCheckOut({
      shift,
      handoverNote: handoverNote ?? null,
    });

    if (!outcome.ok) {
      return { success: false, error: outcome.error };
    }

    return { success: true, shift: await updateShift(client, shiftId, outcome.patch) };
  } catch (error) {
    return { success: false, error: readErrorMessage(error) };
  }
};

export default defineLogicFunction({
  universalIdentifier: CHECK_OUT_LOGIC_FUNCTION_UID,
  name: 'check-out-shift',
  description: 'Route: checks a member out; computes payable minutes.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: CHECK_OUT_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
