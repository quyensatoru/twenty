import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { UPDATE_MERCHANT_CUSTOM_SETTINGS_ROUTE_PATH } from '../constants/route-paths';
import { UPDATE_MERCHANT_CUSTOM_SETTINGS_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type CustomSettingValues } from '../types/custom-setting-schema';
import {
  buildCustomSettingDraft,
  listMissingRequiredLabels,
  mergeCustomSettingValues,
} from '../utils/custom-setting-value.util';
import { normalizeCustomSettingSchema } from '../utils/normalize-custom-setting-schema.util';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { readMerchantCustomSettings } from './utils/read-merchant-custom-settings.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type UpdateMerchantCustomSettingsBody = {
  merchantId?: string;
  values?: CustomSettingValues;
};

const handler = async (event: RoutePayload<UpdateMerchantCustomSettingsBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const merchantId = requireString(event.body?.merchantId, 'merchantId');
    const submittedValues = event.body?.values ?? {};

    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'merchant',
      recordId: merchantId,
      operation: 'write',
    });

    const { customSettings, fieldSchema } = await readMerchantCustomSettings({
      client,
      merchantId,
    });

    // The schema is re-read here rather than trusted from the caller: the
    // browser form is one client of this route, and a value under a key the
    // app never declared has no business landing on the record. Tools are left
    // out of the write set entirely — their value is a run envelope, not a
    // setting, and a save must never touch one.
    const { fields } = normalizeCustomSettingSchema(fieldSchema);
    const draftValues = buildCustomSettingDraft(fields, submittedValues);

    const missingLabels = listMissingRequiredLabels(fields, draftValues);

    // Thrown, not returned: runScopedRoute turns a payload into `success:
    // true`, and a refusal that answers success is a refusal the form shows as
    // a save.
    if (missingLabels.length > 0) {
      throw new Error(`Missing required settings: ${missingLabels.join(', ')}`);
    }

    const values = mergeCustomSettingValues({
      entries: fields,
      storedValues: customSettings,
      draftValues,
    });

    await client.mutation({
      updateMerchant: {
        __args: { id: merchantId, data: { customSettings: values } },
        id: true,
      },
    });

    return { values };
  });

export default defineLogicFunction({
  universalIdentifier: UPDATE_MERCHANT_CUSTOM_SETTINGS_LOGIC_FUNCTION_UID,
  name: 'update-merchant-custom-settings',
  description:
    "Route: writes the Custom Settings a merchant's app declares, leaving every other key on the record untouched.",
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: UPDATE_MERCHANT_CUSTOM_SETTINGS_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
