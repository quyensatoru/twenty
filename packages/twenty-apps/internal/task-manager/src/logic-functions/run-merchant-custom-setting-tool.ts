import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { RUN_MERCHANT_CUSTOM_SETTING_TOOL_ROUTE_PATH } from '../constants/route-paths';
import { RUN_MERCHANT_CUSTOM_SETTING_TOOL_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type CustomSettingDraftValue, type CustomSettingToolRun } from '../types/custom-setting-schema';
import {
  buildToolRunParams,
  listMissingRequiredLabels,
} from '../utils/custom-setting-value.util';
import { normalizeCustomSettingSchema } from '../utils/normalize-custom-setting-schema.util';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { readMerchantCustomSettings } from './utils/read-merchant-custom-settings.util';
import { requireString } from './utils/require-string.util';
import { resolveCallerEmail } from './utils/resolve-caller-email.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type RunMerchantCustomSettingToolBody = {
  merchantId?: string;
  toolKey?: string;
  params?: Record<string, CustomSettingDraftValue>;
};

// There is no echo back through this app: the app behind the webhook reads
// this envelope, does the work, and writes PROCESSING/DONE/FAILED straight
// onto the merchant record through its own Twenty credentials — the same way
// `update-merchant-custom-settings` itself writes, just from the other side.
// This route's only job is the REQUESTED half.
const handler = async (event: RoutePayload<RunMerchantCustomSettingToolBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const merchantId = requireString(event.body?.merchantId, 'merchantId');
    const toolKey = requireString(event.body?.toolKey, 'toolKey');
    const draftValues = event.body?.params ?? {};

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

    // The schema is re-read here rather than trusted from the caller, exactly
    // as the settings write does: a toolKey or a field the app never declared
    // has no business turning into a run.
    const { tools } = normalizeCustomSettingSchema(fieldSchema);
    const tool = tools.find((candidate) => candidate.key === toolKey);

    if (tool === undefined) {
      throw new Error(`Unknown tool "${toolKey}"`);
    }

    const missingLabels = listMissingRequiredLabels(tool.fields, draftValues);

    if (missingLabels.length > 0) {
      throw new Error(`Missing required fields: ${missingLabels.join(', ')}`);
    }

    const requestedBy = await resolveCallerEmail({
      client,
      workspaceMemberId: scope.workspaceMemberId,
    });

    // A fresh runId every time: the app behind the webhook dedupes on it, so
    // a second click is a new job, never a reply to the one before it.
    const run: CustomSettingToolRun = {
      runId: crypto.randomUUID(),
      requestedAt: new Date().toISOString(),
      ...(requestedBy === null ? {} : { requestedBy }),
      status: 'REQUESTED',
      params: buildToolRunParams(tool.fields, draftValues),
    };

    const values = { ...customSettings, [toolKey]: run };

    await client.mutation({
      updateMerchant: {
        __args: { id: merchantId, data: { customSettings: values } },
        id: true,
      },
    });

    return { values, run };
  });

export default defineLogicFunction({
  universalIdentifier: RUN_MERCHANT_CUSTOM_SETTING_TOOL_LOGIC_FUNCTION_UID,
  name: 'run-merchant-custom-setting-tool',
  description:
    "Route: writes a fresh REQUESTED run envelope for one tool a merchant's app declares.",
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: RUN_MERCHANT_CUSTOM_SETTING_TOOL_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
