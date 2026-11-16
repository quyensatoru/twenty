import { defineLogicFunction } from 'twenty-sdk/define';

import { SETTINGS_ROUTE_PATH } from '../constants/route-paths';
import { SETTINGS_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { assertCanManageSettings } from './utils/resolve-bc-scope.util';
import { runBcRoute } from './utils/run-bc-route.util';
import { buildSettingsResult } from './utils/settings-store.util';

const handler = async () =>
  runBcRoute(async ({ client, scope }) => {
    assertCanManageSettings(scope);

    return buildSettingsResult(client);
  });

export default defineLogicFunction({
  universalIdentifier: SETTINGS_LOGIC_FUNCTION_UID,
  name: 'bc-settings',
  description:
    'Route (admins): BC teams and memberships, the plan catalog and the integration endpoints.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: SETTINGS_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
