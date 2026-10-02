import {
  defineLogicFunction,
  FieldType,
  type RoutePayload,
} from 'twenty-sdk/define';

import { MERCHANT_CUSTOM_SETTINGS_ROUTE_PATH } from '../constants/route-paths';
import {
  MERCHANT_CUSTOM_SETTINGS_LOGIC_FUNCTION_UID,
  MERCHANT_CUSTOM_SETTING_FILES_FIELD_UID,
  MERCHANT_OBJECT_UID,
} from '../constants/universal-identifiers';
import { normalizeCustomSettingSchema } from '../utils/normalize-custom-setting-schema.util';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { readMerchantCustomSettings } from './utils/read-merchant-custom-settings.util';
import { requireString } from './utils/require-string.util';
import { resolveFieldMetadataId } from './utils/resolve-field-metadata-id.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type MerchantCustomSettingsBody = {
  merchantId?: string;
};

// The schema lives on the merchant's app, which the viewer's own role cannot
// read — only this application's runtime role can. So the form asks for it
// here, behind the same app-scope guard every other read in this app goes
// through: a member with no grant on the merchant's app gets nothing.
const handler = async (event: RoutePayload<MerchantCustomSettingsBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const merchantId = requireString(event.body?.merchantId, 'merchantId');

    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'merchant',
      recordId: merchantId,
      operation: 'read',
    });

    const { appId, customSettings, fieldSchema } =
      await readMerchantCustomSettings({ client, merchantId });

    const canUpdate =
      scope.canBypassAppScope ||
      (appId !== null && scope.grantsByAppId[appId]?.includes('write') === true);

    const schema = normalizeCustomSettingSchema(fieldSchema);

    // Only looked up when the schema actually asks for a file: every merchant
    // page opens this route, and a metadata round trip for a schema with no
    // FILE in it buys nothing.
    const hasFileField = [
      ...schema.fields,
      ...schema.tools.flatMap((tool) => tool.fields),
    ].some((field) => field.type === 'FILE');

    return {
      schema,
      values: customSettings,
      canUpdate,
      uploadFieldMetadataId: hasFileField
        ? await resolveFieldMetadataId({
            objectUniversalIdentifier: MERCHANT_OBJECT_UID,
            fieldUniversalIdentifier: MERCHANT_CUSTOM_SETTING_FILES_FIELD_UID,
            fieldType: FieldType.FILES,
          })
        : null,
    };
  });

export default defineLogicFunction({
  universalIdentifier: MERCHANT_CUSTOM_SETTINGS_LOGIC_FUNCTION_UID,
  name: 'merchant-custom-settings',
  description:
    "Route: the Custom Settings schema off a merchant's app and the values stored on the merchant.",
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: MERCHANT_CUSTOM_SETTINGS_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
