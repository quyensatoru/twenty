import {
  CRISP_API_IDENTIFIER_VARIABLE,
  CRISP_API_KEY_VARIABLE,
  CRISP_ENABLED_VARIABLE,
  CRISP_WEBSITE_ID_VARIABLE,
} from '../constants/application-variable-names';
import { SELLABLE_APPS } from '../constants/registered-apps';

export type CrispWorkspace = {
  identifier: string;
  key: string;
  websiteId: string;
};

export type CrispSettings = {
  enabled: boolean;
  fallbackWorkspace: CrispWorkspace;
  workspacesByAppKey: Record<string, CrispWorkspace>;
};

// One Crisp workspace per app, each with its own credentials, all following
// the same naming convention: CRISP_API_IDENTIFIER_<KEY>,
// CRISP_API_KEY_<KEY>, CRISP_WEBSITE_ID_<KEY>. A new app only needs its three
// declared variables and no logic change.
const workspaceVariable = (
  kind: 'CRISP_API_IDENTIFIER' | 'CRISP_API_KEY' | 'CRISP_WEBSITE_ID',
  appKey: string,
): string => `${kind}_${appKey}`;

const readWorkspace = ({
  env,
  identifierVariable,
  keyVariable,
  websiteIdVariable,
}: {
  env: Record<string, string | undefined>;
  identifierVariable: string;
  keyVariable: string;
  websiteIdVariable: string;
}): CrispWorkspace => ({
  identifier: (env[identifierVariable] ?? '').trim(),
  key: (env[keyVariable] ?? '').trim(),
  websiteId: (env[websiteIdVariable] ?? '').trim(),
});

const isCompleteWorkspace = (workspace: CrispWorkspace): boolean =>
  workspace.identifier.length > 0 &&
  workspace.key.length > 0 &&
  workspace.websiteId.length > 0;

export const readCrispSettings = (
  env: Record<string, string | undefined> = process.env,
): CrispSettings => {
  const enabled = (env[CRISP_ENABLED_VARIABLE] ?? 'true').trim() !== 'false';
  const fallbackWorkspace = readWorkspace({
    env,
    identifierVariable: CRISP_API_IDENTIFIER_VARIABLE,
    keyVariable: CRISP_API_KEY_VARIABLE,
    websiteIdVariable: CRISP_WEBSITE_ID_VARIABLE,
  });
  const workspacesByAppKey: Record<string, CrispWorkspace> = {};

  for (const app of SELLABLE_APPS) {
    const workspace = readWorkspace({
      env,
      identifierVariable: workspaceVariable('CRISP_API_IDENTIFIER', app.key),
      keyVariable: workspaceVariable('CRISP_API_KEY', app.key),
      websiteIdVariable: workspaceVariable('CRISP_WEBSITE_ID', app.key),
    });

    if (isCompleteWorkspace(workspace)) {
      workspacesByAppKey[app.key] = workspace;
    }
  }

  return { enabled, fallbackWorkspace, workspacesByAppKey };
};

// Each app lives in its own Crisp workspace with its own credentials. A shop
// may have chatted in any of them, so every complete workspace is tried: the
// shop's own apps first, then the remaining workspaces, then the fallback, so
// the common single-app case costs a single Crisp call and a cross-app chat
// is still found.
export const resolveCrispWorkspaces = ({
  ourApps,
  settings,
}: {
  ourApps?: string[] | null;
  settings: CrispSettings;
}): CrispWorkspace[] => {
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
  const workspaces: CrispWorkspace[] = [];
  const seenWebsiteIds = new Set<string>();

  const pushWorkspace = (workspace: CrispWorkspace | undefined): void => {
    if (
      workspace !== undefined &&
      isCompleteWorkspace(workspace) &&
      !seenWebsiteIds.has(workspace.websiteId)
    ) {
      seenWebsiteIds.add(workspace.websiteId);
      workspaces.push(workspace);
    }
  };

  for (const key of orderedKeys) {
    pushWorkspace(settings.workspacesByAppKey[key]);
  }

  pushWorkspace(settings.fallbackWorkspace);

  return workspaces;
};
