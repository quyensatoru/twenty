import { defineApplication, FieldType } from 'twenty-sdk/define';

import {
  CRISP_PLAN_DATA_DAILY_BUDGET_VARIABLE,
  CRISP_PLAN_DATA_ENABLED_VARIABLE,
  CRISP_PLUGIN_IDENTIFIER_VARIABLE,
  CRISP_PLUGIN_KEY_VARIABLE,
  CRISP_SYNC_ENABLED_VARIABLE,
  CRISP_WEBHOOK_SECRET_VARIABLE,
  getCrispWebsiteIdVariable,
} from './constants/crisp';
import {
  APPLICATION_UID,
  CRISP_PLAN_DATA_DAILY_BUDGET_VARIABLE_UID,
  CRISP_PLAN_DATA_ENABLED_VARIABLE_UID,
  CRISP_PLUGIN_IDENTIFIER_VARIABLE_UID,
  CRISP_PLUGIN_KEY_VARIABLE_UID,
  CRISP_SYNC_ENABLED_VARIABLE_UID,
  CRISP_WEBHOOK_SECRET_VARIABLE_UID,
  CRISP_WEBSITE_ID_BLOY_VARIABLE_UID,
  CRISP_WEBSITE_ID_EU_VARIABLE_UID,
  CRISP_WEBSITE_ID_FRAUD_VARIABLE_UID,
  CRISP_WEBSITE_ID_MIDA_VARIABLE_UID,
} from './constants/universal-identifiers';

const websiteIdVariable = (appName: string, universalIdentifier: string) => ({
  [getCrispWebsiteIdVariable(appName)]: {
    universalIdentifier,
    description: `Crisp website ID of the ${appName} inbox, found in the Crisp dashboard URL. Leave empty if ${appName} has no Crisp inbox.`,
    isSecret: false,
  },
});

export default defineApplication({
  universalIdentifier: APPLICATION_UID,
  displayName: 'Customer Support',
  description:
    'Merchant master data shared across apps, and the support inbox that mirrors every Crisp chat next to the merchant it belongs to.',
  applicationVariables: {
    [CRISP_PLUGIN_IDENTIFIER_VARIABLE]: {
      universalIdentifier: CRISP_PLUGIN_IDENTIFIER_VARIABLE_UID,
      description:
        'Production token identifier of the Crisp Marketplace plugin (Marketplace > plugin > Tokens). The plugin must be installed on every website below.',
      isSecret: true,
    },
    [CRISP_PLUGIN_KEY_VARIABLE]: {
      universalIdentifier: CRISP_PLUGIN_KEY_VARIABLE_UID,
      description:
        'Production token key of the Crisp Marketplace plugin, paired with the identifier above.',
      isSecret: true,
    },
    [CRISP_WEBHOOK_SECRET_VARIABLE]: {
      universalIdentifier: CRISP_WEBHOOK_SECRET_VARIABLE_UID,
      description:
        'Signing secret Crisp shows when the plugin web hook is created (Marketplace > plugin > Settings > Events). Deliveries with another signature are rejected.',
      isSecret: true,
    },
    ...websiteIdVariable('MIDA', CRISP_WEBSITE_ID_MIDA_VARIABLE_UID),
    ...websiteIdVariable('BLOY', CRISP_WEBSITE_ID_BLOY_VARIABLE_UID),
    ...websiteIdVariable('FRAUD', CRISP_WEBSITE_ID_FRAUD_VARIABLE_UID),
    ...websiteIdVariable('EU', CRISP_WEBSITE_ID_EU_VARIABLE_UID),
    [CRISP_SYNC_ENABLED_VARIABLE]: {
      universalIdentifier: CRISP_SYNC_ENABLED_VARIABLE_UID,
      description:
        'Whether Crisp chats are synced. Turn off to pause both the web hook and the hourly catch-up without touching Crisp.',
      type: FieldType.BOOLEAN,
      isSecret: false,
      value: true,
    },
    [CRISP_PLAN_DATA_ENABLED_VARIABLE]: {
      universalIdentifier: CRISP_PLAN_DATA_ENABLED_VARIABLE_UID,
      description:
        "Whether the merchant's plan and plan start are written into Crisp session data (crm_plan, crm_plan_started_at). Off on install so merchants can be synced and their plan start backfilled first; plan start dates are recorded either way.",
      type: FieldType.BOOLEAN,
      isSecret: false,
      value: false,
    },
    [CRISP_PLAN_DATA_DAILY_BUDGET_VARIABLE]: {
      universalIdentifier: CRISP_PLAN_DATA_DAILY_BUDGET_VARIABLE_UID,
      description:
        'Crisp requests the plan data sweep of every chat may spend per day. Keep it well under the plugin daily quota, which the chat sync shares.',
      isSecret: false,
      value: '5000',
    },
  },
});
