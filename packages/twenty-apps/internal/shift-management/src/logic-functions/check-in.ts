import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { CHECK_IN_ROUTE_PATH } from '../constants/route-paths';
import { CHECK_IN_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { readErrorMessage } from '../utils/read-error-message.util';
import { validateCheckIn } from '../utils/validate-attendance-action.util';
import { readShiftOwnershipError } from './utils/assert-shift-owner-or-elevated.util';
import { createAppClient } from './utils/create-app-client.util';
import { fetchShift } from './utils/fetch-shift.util';
import { fetchShiftTemplate } from './utils/fetch-shift-template.util';
import { readActor } from './utils/read-actor.util';
import { updateShift } from './utils/update-shift.util';

type CheckInBody = { shiftId?: string };

// BR-9.x. This and the check-out / cancel routes are the ONLY member-facing
// path that mutates attendance fields — the fork's shift.updateOne pre-hook
// blocked every other one, and here the workspace Member role simply has no
// write on shift at all. No notification code lives here; workflows fire on
// record-updated.
const handler = async (
  event: RoutePayload<CheckInBody>,
  context: { workspaceMemberId: string | null },
) => {
  try {
    const shiftId = event.body?.shiftId;

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

    const template =
      shift.shiftTemplateId === null
        ? null
        : await fetchShiftTemplate(client, shift.shiftTemplateId);

    const outcome = validateCheckIn({
      shift,
      earlyCheckInMinutes: template?.earlyCheckInMinutes ?? null,
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
  universalIdentifier: CHECK_IN_LOGIC_FUNCTION_UID,
  name: 'check-in-shift',
  description: 'Route: checks a member in to a registered shift.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: CHECK_IN_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
