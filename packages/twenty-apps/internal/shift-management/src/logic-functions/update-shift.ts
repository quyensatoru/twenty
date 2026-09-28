import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { UPDATE_SHIFT_ROUTE_PATH } from '../constants/route-paths';
import { UPDATE_SHIFT_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { getAttendanceRecomputePatch } from '../utils/derive-attendance.util';
import { readErrorMessage } from '../utils/read-error-message.util';
import { readShiftOwnershipError } from './utils/assert-shift-owner-or-elevated.util';
import { createAppClient } from './utils/create-app-client.util';
import { fetchShift } from './utils/fetch-shift.util';
import { readActor } from './utils/read-actor.util';
import { updateShift } from './utils/update-shift.util';

// Everything a non-elevated member may NEVER set. Attendance and pay go through
// the check-in / check-out / cancel routes; the scheduling snapshot is frozen at
// registration — left open, a member could widen endTime on their OWN shift and
// let the recompute below inflate workingMinutes. Only handoverNote stays
// member-editable, which is why it is the one field absent from this list.
const PROTECTED_SHIFT_FIELDS = [
  'checkInAt',
  'checkOutAt',
  'checkInLateMinutes',
  'workingMinutes',
  'status',
  'rateMultiplier',
  'cancelledAt',
  'cancelReason',
  'cancelCategory',
  'memberId',
  'date',
  'startTime',
  'endTime',
  'templateCode',
  'templateName',
  'shiftTemplateId',
] as const;

type UpdateShiftBody = {
  shiftId?: string;
  data?: Record<string, unknown>;
};

// The fork's shift.updateOne pre-hook and post-hook in one place: gate the
// write, apply it, then recompute the derived attendance numbers so they stay
// self-consistent with the punches after a Leader/PO edits checkInAt or
// checkOutAt directly (BR-5.2, BR-9.1). The fork recomputed unconditionally
// because its post-hook payload carried no field-level diff; here the patch is
// known, but recomputing anyway costs one read and keeps the two paths
// identical — getAttendanceRecomputePatch already skips a no-op write.
const handler = async (
  event: RoutePayload<UpdateShiftBody>,
  context: { workspaceMemberId: string | null },
) => {
  try {
    const { shiftId, data } = event.body ?? {};

    if (shiftId === undefined || data === undefined) {
      return { success: false, error: 'shiftId and data are required.' };
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

    const touchesProtectedField = PROTECTED_SHIFT_FIELDS.some(
      (field) => field in data,
    );

    if (touchesProtectedField && !actor.isElevated) {
      return { success: false, error: 'Permission denied.' };
    }

    const updated = await updateShift(client, shiftId, data);
    const recomputePatch = getAttendanceRecomputePatch(updated);

    if (recomputePatch === null) {
      return { success: true, shift: updated };
    }

    return {
      success: true,
      shift: await updateShift(client, shiftId, recomputePatch),
    };
  } catch (error) {
    return { success: false, error: readErrorMessage(error) };
  }
};

export default defineLogicFunction({
  universalIdentifier: UPDATE_SHIFT_LOGIC_FUNCTION_UID,
  name: 'update-shift',
  description:
    'Route: edits a shift and recomputes its derived attendance numbers.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: UPDATE_SHIFT_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
