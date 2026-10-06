import {
  CRISP_API_IDENTIFIER_VARIABLE,
  CRISP_API_KEY_VARIABLE,
  CRISP_ENABLED_VARIABLE,
  CRISP_WEBSITE_ID_VARIABLE,
} from '../constants/application-variable-names';
import { SELLABLE_APPS } from '../constants/registered-apps';

export type CrispSettings = {
  enabled: boolean;
  websiteId: string;
  websiteIdsByAppKey: Record<string, string>;
};

export type CrispCredentials = {
  identifier: string;
  key: string;
};

// One variable per app by convention, so a new app only needs its own
// declared variable (e.g. CRISP_WEBSITE_ID_EU for key EU) and no logic change:
// the sync below already iterates every sellable app.
const websiteIdVariableForAppKey = (appKey: string): string =>
  `CRISP_WEBSITE_ID_${appKey}`;
export const readCrispSettings = (
  env: Record<string, string | undefined> = process.env,
): CrispSettings => {
  const enabled = (env[CRISP_ENABLED_VARIABLE] ?? 'true').trim() !== 'false';
  const websiteId = (env[CRISP_WEBSITE_ID_VARIABLE] ?? '').trim();
  const websiteIdsByAppKey: Record<string, string> = {};

  for (const app of SELLABLE_APPS) {
    const appWebsiteId = (
      env[websiteIdVariableForAppKey(app.key)] ?? ''
    ).trim();

    if (appWebsiteId.length > 0) {
      websiteIdsByAppKey[app.key] = appWebsiteId;
    }
  }

  return { enabled, websiteId, websiteIdsByAppKey };
};

// One API key, one inbox per app: a shop may have chatted in any of them, so
// every configured website is tried. The shop's own apps go first, then the
// remaining inboxes, then the fallback, so the common single-app case costs a
// single Crisp call and a cross-app chat is still found.
export const resolveCrispWebsiteIds = ({
  ourApps,
  settings,
}: {
  ourApps?: string[] | null;
  settings: CrispSettings;
}): string[] => {
  const normalizedApps = new Set(
    (ourApps ?? [])
      .filter((app): app is string => typeof app === 'string')
      .map((app) => app.trim().toUpperCase())
      .filter((app) => app.length > 0),
  );
  const orderedKeys = [
    ...SELLABLE_APPS.map((app) => app.key).filter((key) =>
      normalizedApps.has(key),
    ),
    ...SELLABLE_APPS.map((app) => app.key).filter(
      (key) => !normalizedApps.has(key),
    ),
  ];
  const websiteIds: string[] = [];

  for (const key of orderedKeys) {
    const websiteId = settings.websiteIdsByAppKey[key];

    if (
      typeof websiteId === 'string' &&
      websiteId.length > 0 &&
      !websiteIds.includes(websiteId)
    ) {
      websiteIds.push(websiteId);
    }
  }

  if (
    settings.websiteId.length > 0 &&
    !websiteIds.includes(settings.websiteId)
  ) {
    websiteIds.push(settings.websiteId);
  }

  return websiteIds;
};

export const readCrispCredentials = (
  env: Record<string, string | undefined> = process.env,
): CrispCredentials => {
  const identifier = (env[CRISP_API_IDENTIFIER_VARIABLE] ?? '').trim();
  const key = (env[CRISP_API_KEY_VARIABLE] ?? '').trim();

  if (identifier.length === 0 || key.length === 0) {
    throw new Error(
      'Crisp credentials are not set. Add CRISP_API_IDENTIFIER and CRISP_API_KEY under Settings > Apps > BD Prospects > Variables.',
    );
  }

  return { identifier, key };
};
