import { type ApiClient } from '../../types/api-client';
import { type CallerScope } from '../../types/caller-scope';
import { type Connection } from '../../types/connection';
import { fetchRecordColumn } from '../utils/fetch-record-column.util';
import { AppScopePermissionDeniedError } from './app-scope-error';
import { resolveEffectiveAppId } from './resolve-effective-app-id.util';

export type RelationTargetAppScopeEntry =
  | { fieldName: string; kind: 'merchant'; targetId: string }
  | { fieldName: string; kind: 'workspaceMember'; targetId: string };

// Validates that a relation TARGET (issue.assignee/reporter/merchants,
// epic.assignee, sprint.owner) belongs to the same app as the record being
// written, resolved through that record's project. Distinct from
// assertAppScopeWriteAccess, which only checks the ACTOR's own write
// permission into an app, not whether the selected target is itself in scope.
export const assertRelationTargetAppScope = async ({
  client,
  scope,
  objectNameSingular,
  projectId,
  targets,
}: {
  client: ApiClient;
  scope: CallerScope;
  objectNameSingular: string;
  projectId: string | null | undefined;
  targets: readonly RelationTargetAppScopeEntry[];
}): Promise<void> => {
  if (targets.length === 0) {
    return;
  }

  if (scope.canBypassAppScope) {
    return;
  }

  const resolvedAppId =
    projectId === null || projectId === undefined
      ? null
      : await resolveEffectiveAppId({
          client,
          objectNameSingular,
          immediateForeignKeyValue: projectId,
        });

  // No resolvable app (project not attached to one, or not found) — deny by
  // default, matching assertAppScopeWriteAccess.
  if (resolvedAppId === null) {
    throw new AppScopePermissionDeniedError();
  }

  for (const target of targets) {
    const isValid =
      target.kind === 'merchant'
        ? (await fetchRecordColumn(
            client,
            'merchants',
            target.targetId,
            'appId',
          )) === resolvedAppId
        : await hasAppAccessRow({
            client,
            memberId: target.targetId,
            appId: resolvedAppId,
          });

    if (!isValid) {
      throw new AppScopePermissionDeniedError();
    }
  }
};

// As in the fork: the existence of ANY appAccess row is treated as sufficient
// scope for a member target — the permissions it grants are not inspected.
const hasAppAccessRow = async ({
  client,
  memberId,
  appId,
}: {
  client: ApiClient;
  memberId: string;
  appId: string;
}): Promise<boolean> => {
  const result = await client.query({
    appAccesses: {
      __args: {
        filter: { memberId: { eq: memberId }, appId: { eq: appId } },
        first: 1,
      },
      edges: { node: { id: true } },
    },
  });

  const connection = result?.appAccesses as
    | Connection<{ id: string }>
    | undefined;

  return (connection?.edges?.length ?? 0) > 0;
};
