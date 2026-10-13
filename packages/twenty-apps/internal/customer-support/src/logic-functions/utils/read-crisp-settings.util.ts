import {
  CRISP_PLUGIN_IDENTIFIER_VARIABLE,
  CRISP_PLUGIN_KEY_VARIABLE,
  CRISP_SYNC_ENABLED_VARIABLE,
  CRISP_WEBHOOK_SECRET_VARIABLE,
  CRISP_WEBSITE_APP_NAMES,
  getCrispWebsiteIdVariable,
} from '../../constants/crisp';

export type CrispWebsite = {
  appName: string;
  websiteId: string;
};

export type CrispSettings = {
  enabled: boolean;
  identifier: string;
  key: string;
  webhookSecret: string;
  websites: CrispWebsite[];
};

const readVariable = (
  env: Record<string, string | undefined>,
  name: string,
): string => (env[name] ?? '').trim();

export const readCrispSettings = (
  env: Record<string, string | undefined> = process.env,
): CrispSettings => ({
  enabled: readVariable(env, CRISP_SYNC_ENABLED_VARIABLE) !== 'false',
  identifier: readVariable(env, CRISP_PLUGIN_IDENTIFIER_VARIABLE),
  key: readVariable(env, CRISP_PLUGIN_KEY_VARIABLE),
  webhookSecret: readVariable(env, CRISP_WEBHOOK_SECRET_VARIABLE),
  websites: CRISP_WEBSITE_APP_NAMES.map((appName) => ({
    appName,
    websiteId: readVariable(env, getCrispWebsiteIdVariable(appName)),
  })).filter((website) => website.websiteId.length > 0),
});

export const isCrispApiConfigured = (settings: CrispSettings): boolean =>
  settings.identifier.length > 0 &&
  settings.key.length > 0 &&
  settings.websites.length > 0;

export const findCrispWebsite = (
  settings: CrispSettings,
  websiteId: string | undefined,
): CrispWebsite | undefined =>
  settings.websites.find((website) => website.websiteId === websiteId);
