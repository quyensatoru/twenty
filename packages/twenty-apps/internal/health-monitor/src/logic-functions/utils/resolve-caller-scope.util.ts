import { MetadataApiClient } from 'twenty-client-sdk/metadata';

import { type ApiClient } from '../../types/api-client';
import { type CallerScope } from '../../types/caller-scope';
import { listAllRecords } from './list-all-records.util';

// Members holding workspace-settings access see every app, as in Task
// Manager; everyone else sees the apps their App access rows grant.
const BYPASS_PERMISSION_FLAGS = ['WORKSPACE', 'ROLES'];

type AppAccessNode = { appId?: string | null; permissions?: unknown[] | null };

export const resolveCallerScope = async (
  client: ApiClient,
): Promise<CallerScope> => {
  const { currentUser } = (await new MetadataApiClient().query({
    currentUser: {
      id: true,
      workspaceMember: { id: true },
      currentUserWorkspace: { permissionFlags: true },
    },
  })) as {
    currentUser?: {
      workspaceMember?: { id?: string } | null;
      currentUserWorkspace?: { permissionFlags?: string[] | null } | null;
    } | null;
  };

  const workspaceMemberId = currentUser?.workspaceMember?.id ?? null;
  const permissionFlags =
    currentUser?.currentUserWorkspace?.permissionFlags ?? [];

  if (workspaceMemberId === null) {
    return {
      workspaceMemberId: null,
      canBypassAppScope: true,
      readableAppIds: new Set(),
      writableAppIds: new Set(),
    };
  }

  const grants = await listAllRecords<AppAccessNode>({
    client,
    pluralName: 'appAccesses',
    filter: { memberId: { eq: workspaceMemberId } },
    selection: { id: true, appId: true, permissions: true },
  });
  const readableAppIds = new Set<string>();
  const writableAppIds = new Set<string>();

  for (const grant of grants) {
    if (typeof grant.appId !== 'string') {
      continue;
    }

    const permissions = Array.isArray(grant.permissions)
      ? grant.permissions
      : [];

    if (permissions.includes('READ') || permissions.includes('WRITE')) {
      readableAppIds.add(grant.appId);
    }

    if (permissions.includes('WRITE')) {
      writableAppIds.add(grant.appId);
    }
  }

  return {
    workspaceMemberId,
    canBypassAppScope: permissionFlags.some((flag) =>
      BYPASS_PERMISSION_FLAGS.includes(flag),
    ),
    readableAppIds,
    writableAppIds,
  };
};

export const canReadApp = (scope: CallerScope, appId: string | null): boolean =>
  scope.canBypassAppScope ||
  (appId !== null && scope.readableAppIds.has(appId));

export const canWriteApp = (
  scope: CallerScope,
  appId: string | null,
): boolean =>
  scope.canBypassAppScope ||
  (appId !== null && scope.writableAppIds.has(appId));

// Monitor settings hold the endpoint secret and who gets paged, so only
// workspace admins (WORKSPACE or ROLES permission) may read or change them.
export const canConfigureMonitors = (scope: CallerScope): boolean =>
  scope.canBypassAppScope;

export const assertCanConfigureMonitors = (scope: CallerScope): void => {
  if (!canConfigureMonitors(scope)) {
    throw new Error(
      'Only workspace admins can view or change health settings.',
    );
  }
};
