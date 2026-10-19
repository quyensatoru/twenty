import {
  CRISP_PLAN_DATA_ENABLED_VARIABLE,
  CRISP_PLUGIN_IDENTIFIER_VARIABLE,
  CRISP_PLUGIN_KEY_VARIABLE,
  CRISP_SHARED_WEBSITE_APP_NAMES,
  CRISP_SYNC_ENABLED_VARIABLE,
  CRISP_WEBHOOK_SECRET_VARIABLE,
  CRISP_WEBSITE_APP_NAMES,
  type CrispWebsiteAppName,
  getCrispWebsiteIdVariable,
} from '../../constants/crisp';

export type CrispWebsite = {
  appName: string;
  websiteId: string;
};

export type CrispSettings = {
  enabled: boolean;
  planDataEnabled: boolean;
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
  planDataEnabled:
    readVariable(env, CRISP_PLAN_DATA_ENABLED_VARIABLE) === 'true',
  identifier: readVariable(env, CRISP_PLUGIN_IDENTIFIER_VARIABLE),
  key: readVariable(env, CRISP_PLUGIN_KEY_VARIABLE),
  webhookSecret: readVariable(env, CRISP_WEBHOOK_SECRET_VARIABLE),
  // A product sharing another's website may be configured with the same id;
  // the first product keeps it, and the session flags tell the two apart.
  websites: CRISP_WEBSITE_APP_NAMES.map((appName) => ({
    appName,
    websiteId: readVariable(env, getCrispWebsiteIdVariable(appName)),
  })).filter(
    (website, index, websites) =>
      website.websiteId.length > 0 &&
      websites.findIndex(
        (candidate) => candidate.websiteId === website.websiteId,
      ) === index,
  ),
});

export const isCrispApiConfigured = (settings: CrispSettings): boolean =>
  settings.identifier.length > 0 &&
  settings.key.length > 0 &&
  settings.websites.length > 0;

export const canWritePlanData = (settings: CrispSettings): boolean =>
  settings.enabled &&
  settings.planDataEnabled &&
  isCrispApiConfigured(settings);

export const findCrispWebsite = (
  settings: CrispSettings,
  websiteId: string | undefined,
): CrispWebsite | undefined =>
  settings.websites.find((website) => website.websiteId === websiteId);

// The products whose chats land in this website: its own and the ones
// answering in it.
export const listWebsiteAppNames = (website: CrispWebsite): string[] => [
  website.appName,
  ...(CRISP_SHARED_WEBSITE_APP_NAMES[website.appName as CrispWebsiteAppName] ??
    []),
];

// Every product with chats in the configured websites, including the ones
// answering in another product's website.
export const listCrispAppNames = (settings: CrispSettings): string[] => [
  ...new Set(settings.websites.flatMap(listWebsiteAppNames)),
];
