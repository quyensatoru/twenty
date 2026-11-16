import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { SETTINGS_SAVE_ROUTE_PATH } from '../constants/route-paths';
import { SETTINGS_SAVE_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type SettingsSaveBody } from '../types/settings';
import { assertCanManageSettings } from './utils/resolve-bc-scope.util';
import { runBcRoute } from './utils/run-bc-route.util';
import { applySettingsChange } from './utils/settings-save.util';
import { buildSettingsResult } from './utils/settings-store.util';

const handler = async (event: RoutePayload<SettingsSaveBody>) =>
  runBcRoute(async ({ client, scope }) => {
    assertCanManageSettings(scope);

    if (event.body === null || event.body === undefined) {
      throw new Error('Missing settings change.');
    }

    await applySettingsChange(client, event.body, scope.workspaceMemberId);

    return buildSettingsResult(client);
  });

export default defineLogicFunction({
  universalIdentifier: SETTINGS_SAVE_LOGIC_FUNCTION_UID,
  name: 'bc-settings-save',
  description:
    'Route (admins): saves or removes a BC team, membership or catalog plan, corrects a misattributed credit, and returns the settings.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: SETTINGS_SAVE_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
