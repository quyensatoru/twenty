import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { REGISTER_SHIFTS_ROUTE_PATH } from '../constants/route-paths';
import { REGISTER_SHIFTS_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { readErrorMessage } from '../utils/read-error-message.util';
import { validateShiftRegistration } from '../utils/validate-shift-registration.util';
import { createAppClient } from './utils/create-app-client.util';
import { createShift } from './utils/create-shift.util';
import { fetchShiftTemplate } from './utils/fetch-shift-template.util';
import { listActiveSpecialDays } from './utils/list-active-special-days.util';
import { listShiftsOnSlot } from './utils/list-shifts-on-slot.util';
import { readActor } from './utils/read-actor.util';

type RegisterBody = {
  date?: string;
  templateIds?: string[];
  memberId?: string;
};

export type RegistrationFailure = { templateId: string; message: string };

// The fork's shift.createOne / createMany pre-hooks, collapsed into the write
// itself: the registration-integrity gate (no past date, active template only,
// start time not yet passed, no duplicate, OT slots exclusive) runs
// synchronously before each create, and the server stamps the template
// snapshot, the name, the OT multiplier and nulls every attendance field.
//
// Registration is day-centric and partial success is deliberate: one create per
// picked template, each rejection keyed back to its template so the modal can
// re-check only the failures. The upsert vector the fork had to reject does not
// exist here — the route never accepts a client-supplied id, so a create can
// only ever INSERT a new row.
const handler = async (
  event: RoutePayload<RegisterBody>,
  context: { workspaceMemberId: string | null },
) => {
  try {
    const { date, templateIds, memberId: requestedMemberId } = event.body ?? {};

    if (date === undefined || templateIds === undefined) {
      return { success: false, error: 'date and templateIds are required.' };
    }

    if (templateIds.length === 0) {
      return { success: true, successCount: 0, errors: [] };
    }

    const actor = await readActor(context.workspaceMemberId);
    const client = createAppClient();
    const specialDays = await listActiveSpecialDays(client);

    const errors: RegistrationFailure[] = [];
    let successCount = 0;

    // Sequential, not Promise.all: two picks of the same OT slot in one request
    // would both read an empty slot and both pass. An app has no transaction, so
    // ordering the reads and writes is what keeps the exclusivity check honest
    // within a request. Across concurrent requests the race remains — see the
    // note in MIGRATION.md.
    for (const templateId of templateIds) {
      const [template, shiftsOnSameSlot] = await Promise.all([
        fetchShiftTemplate(client, templateId),
        listShiftsOnSlot({ client, date, shiftTemplateId: templateId }),
      ]);

      const outcome = validateShiftRegistration({
        date,
        shiftTemplateId: templateId,
        requestedMemberId: requestedMemberId ?? null,
        actorMemberId: actor.workspaceMemberId,
        isElevatedActor: actor.isElevated,
        template,
        shiftsOnSameSlot,
        specialDays,
      });

      if (!outcome.ok) {
        errors.push({ templateId, message: outcome.error });
        continue;
      }

      try {
        await createShift(client, outcome.record);
        successCount += 1;
      } catch (error) {
        errors.push({ templateId, message: readErrorMessage(error) });
      }
    }

    return { success: true, successCount, errors };
  } catch (error) {
    return { success: false, error: readErrorMessage(error) };
  }
};

export default defineLogicFunction({
  universalIdentifier: REGISTER_SHIFTS_LOGIC_FUNCTION_UID,
  name: 'register-shifts',
  description: 'Route: registers a member for one or more shifts on one day.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: REGISTER_SHIFTS_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
