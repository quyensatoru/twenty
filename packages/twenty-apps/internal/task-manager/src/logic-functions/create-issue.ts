import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { ISSUE_SELECTION } from '../constants/record-selections';
import { CREATE_ISSUE_ROUTE_PATH } from '../constants/route-paths';
import { CREATE_ISSUE_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { assertAppScopeWriteAccess } from './app-scope/assert-app-scope-write-access.util';
import { assertRelationTargetAppScope } from './app-scope/assert-relation-target-app-scope.util';
import { resolveEffectiveAppId } from './app-scope/resolve-effective-app-id.util';
import { buildIssueRelationTargets } from './utils/build-issue-relation-targets.util';
import { createIssueWithReservedKey } from './utils/create-issue-with-reserved-key.util';
import { linkIssueMerchants } from './utils/link-issue-merchants.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type CreateIssueBody = {
  projectId?: string;
  merchantIds?: string[];
  data?: Record<string, unknown>;
};

const handler = async (event: RoutePayload<CreateIssueBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const projectId = requireString(event.body?.projectId, 'projectId');
    const data: Record<string, unknown> = {
      ...(event.body?.data ?? {}),
      projectId,
    };
    const merchantIds = event.body?.merchantIds ?? [];

    await assertAppScopeWriteAccess({
      client,
      scope,
      objectNameSingular: 'issue',
      foreignKeyValue: projectId,
    });

    await assertRelationTargetAppScope({
      client,
      scope,
      objectNameSingular: 'issue',
      projectId,
      targets: buildIssueRelationTargets({ ...data, merchantIds }),
    });

    // An issue reports itself to whoever filed it unless the payload says
    // otherwise. Applied AFTER the relation-target guard so the implicit
    // default can never be what turns a legitimate create into a denial.
    if (data.reporterId === undefined && scope.workspaceMemberId !== null) {
      data.reporterId = scope.workspaceMemberId;
    }

    // The app-scope mirror has to be set in the same write that creates the
    // row: a row-level predicate reads `issue.app`, so an issue that lands
    // without it is invisible to every scoped member until a backfill runs.
    data.appId = await resolveEffectiveAppId({
      client,
      objectNameSingular: 'issue',
      immediateForeignKeyValue: projectId,
    });

    const issue = await createIssueWithReservedKey({
      client,
      projectId,
      data,
      selection: ISSUE_SELECTION,
    });

    if (typeof issue?.id === 'string' && merchantIds.length > 0) {
      await linkIssueMerchants({
        client,
        issueId: issue.id,
        merchantIds,
      });
    }

    return { issue };
  });

export default defineLogicFunction({
  universalIdentifier: CREATE_ISSUE_LOGIC_FUNCTION_UID,
  name: 'create-issue',
  description:
    'Route: creates an issue, allocates its project-scoped key and links its merchants.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: CREATE_ISSUE_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
