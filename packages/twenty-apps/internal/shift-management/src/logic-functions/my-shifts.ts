import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { SHIFT_SELECTION } from '../constants/record-selections';
import { MY_SHIFTS_ROUTE_PATH } from '../constants/route-paths';
import { MY_SHIFTS_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type ShiftRow } from '../types/shift-row';
import { readErrorMessage } from '../utils/read-error-message.util';
import { createAppClient } from './utils/create-app-client.util';
import { listShiftsInRange } from './utils/list-shifts-in-range.util';
import { readActor } from './utils/read-actor.util';

type MyShiftsBody = {
  fromDate?: string;
  toDate?: string;
  memberId?: string;
};

// The fork enforced this with ShiftFindManyPreQueryHook, which forced
// `memberId = self` into every non-elevated shift.findMany. An app cannot
// install a query hook, so the scoping lives here instead: the member id is
// taken from the CALLER's token and a requested memberId is honoured only for
// an elevated actor. This is the only route that returns attendance and pay
// columns, which is why it can never widen past one member.
const handler = async (
  event: RoutePayload<MyShiftsBody>,
  context: { workspaceMemberId: string | null },
) => {
  try {
    const { fromDate, toDate, memberId: requestedMemberId } = event.body ?? {};

    if (fromDate === undefined || toDate === undefined) {
      return { success: false, error: 'fromDate and toDate are required.' };
    }

    const actor = await readActor(context.workspaceMemberId);

    if (
      requestedMemberId !== undefined &&
      requestedMemberId !== actor.workspaceMemberId &&
      !actor.isElevated
    ) {
      return { success: false, error: 'Permission denied.' };
    }

    const memberId = actor.isElevated
      ? (requestedMemberId ?? actor.workspaceMemberId)
      : actor.workspaceMemberId;

    if (memberId === null || memberId === undefined) {
      return { success: false, error: 'Permission denied.' };
    }

    const shifts = await listShiftsInRange<ShiftRow>({
      client: createAppClient(),
      fromDate,
      toDate,
      memberId,
      selection: { ...SHIFT_SELECTION },
    });

    return { success: true, shifts, memberId };
  } catch (error) {
    return { success: false, error: readErrorMessage(error) };
  }
};

export default defineLogicFunction({
  universalIdentifier: MY_SHIFTS_LOGIC_FUNCTION_UID,
  name: 'my-shifts',
  description: "Route: the caller's own shifts in a date range.",
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: MY_SHIFTS_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
