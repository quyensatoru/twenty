import { defineLogicFunction } from 'twenty-sdk/define';

import { SHIFT_CATALOG_ROUTE_PATH } from '../constants/route-paths';
import { SHIFT_CATALOG_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { readErrorMessage } from '../utils/read-error-message.util';
import { createAppClient } from './utils/create-app-client.util';
import { listActiveSpecialDays } from './utils/list-active-special-days.util';
import { listActiveTemplates } from './utils/list-active-templates.util';

// The catalog every page needs: active templates plus the active special days
// that decide which dates are holidays. Team-visible by design — a template is
// the published rota, not personal data. salaryPerHour rides along because the
// Report page turns it into the member's own estimated earnings; the All Shift
// Templates view keeps it hidden from the shared catalog grid.
const handler = async () => {
  try {
    const client = createAppClient();
    const [shiftTemplates, specialDays] = await Promise.all([
      listActiveTemplates(client),
      listActiveSpecialDays(client),
    ]);

    return { success: true, shiftTemplates, specialDays };
  } catch (error) {
    return { success: false, error: readErrorMessage(error) };
  }
};

export default defineLogicFunction({
  universalIdentifier: SHIFT_CATALOG_LOGIC_FUNCTION_UID,
  name: 'shift-catalog',
  description: 'Route: active shift templates and special days.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: SHIFT_CATALOG_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
