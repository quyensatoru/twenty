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

export type AppCrispWorkspace = {
  appKey: string;
  workspace: CrispWorkspace;
};

export const hasAnyCrispWorkspace = (settings: CrispSettings): boolean =>
  Object.keys(settings.workspacesByAppKey).length > 0 ||
  isCompleteWorkspace(settings.fallbackWorkspace);

// A shop's conversations live in the Crisp workspace of the app it chatted
// about, so only the workspaces of its own apps are searched. Shops with no app
// of ours are not synced at all. An app without its own triple borrows the
// fallback one.
export const resolveCrispWorkspaces = ({
  ourApps,
  settings,
}: {
  ourApps?: string[] | null;
  settings: CrispSettings;
}): AppCrispWorkspace[] => {
  const normalizedApps = new Set(
    (ourApps ?? [])
      .filter((app): app is string => typeof app === 'string')
      .map((app) => app.trim().toUpperCase()),
  );
  const workspaces: AppCrispWorkspace[] = [];
  const seenWebsiteIds = new Set<string>();

  for (const { key: appKey } of SELLABLE_APPS) {
    if (!normalizedApps.has(appKey)) {
      continue;
    }

    const workspace =
      settings.workspacesByAppKey[appKey] ?? settings.fallbackWorkspace;

    if (
      isCompleteWorkspace(workspace) &&
      !seenWebsiteIds.has(workspace.websiteId)
    ) {
      seenWebsiteIds.add(workspace.websiteId);
      workspaces.push({ appKey, workspace });
    }
  }

  return workspaces;
};
