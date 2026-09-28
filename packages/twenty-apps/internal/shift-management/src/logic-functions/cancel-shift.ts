import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { CANCEL_SHIFT_ROUTE_PATH } from '../constants/route-paths';
import { CANCEL_SHIFT_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { readErrorMessage } from '../utils/read-error-message.util';
import { validateCancel } from '../utils/validate-attendance-action.util';
import { readShiftOwnershipError } from './utils/assert-shift-owner-or-elevated.util';
import { createAppClient } from './utils/create-app-client.util';
import { fetchShift } from './utils/fetch-shift.util';
import { readActor } from './utils/read-actor.util';
import { updateShift } from './utils/update-shift.util';

type CancelBody = { shiftId?: string; reason?: string; category?: string };

const handler = async (
  event: RoutePayload<CancelBody>,
  context: { workspaceMemberId: string | null },
) => {
  try {
    const { shiftId, reason, category } = event.body ?? {};

    if (
      shiftId === undefined ||
      reason === undefined ||
      category === undefined
    ) {
      return {
        success: false,
        error: 'shiftId, reason and category are required.',
      };
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

    const outcome = validateCancel({ shift, reason, category });

    if (!outcome.ok) {
      return { success: false, error: outcome.error };
    }

    return { success: true, shift: await updateShift(client, shiftId, outcome.patch) };
  } catch (error) {
    return { success: false, error: readErrorMessage(error) };
  }
};

export default defineLogicFunction({
  universalIdentifier: CANCEL_SHIFT_LOGIC_FUNCTION_UID,
  name: 'cancel-shift',
  description: 'Route: cancels a registered shift with a reason and category.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: CANCEL_SHIFT_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
