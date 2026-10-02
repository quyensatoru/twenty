import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { SYNC_APP_SCOPE_MIRROR_ROUTE_PATH } from '../constants/route-paths';
import { SYNC_APP_SCOPE_MIRROR_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type ApiClient } from '../types/api-client';
import { createAppClient } from './utils/create-app-client.util';
import { listScopedRecords } from './utils/list-scoped-records.util';
import { readErrorMessage } from './utils/read-error-message.util';
import { syncMemberScopedAppIds } from './utils/sync-member-scoped-app-ids.util';

type ScopedRow = {
  id: string;
  appId?: string | null;
  projectId?: string | null;
  issueId?: string | null;
  merchantId?: string | null;
};
type ProjectRow = { id: string; appId?: string | null };

// Each scoped collection, the foreign key that leads to its parent, and the
// mutation that writes its mirror. Order matters: issues take their app from
// projects, and comments, worklogs take theirs from issues.
const MIRROR_STEPS = [
  { pluralName: 'issues', parentKey: 'projectId', parent: 'project', mutation: 'updateIssue' },
  { pluralName: 'sprints', parentKey: 'projectId', parent: 'project', mutation: 'updateSprint' },
  { pluralName: 'epics', parentKey: 'projectId', parent: 'project', mutation: 'updateEpic' },
  { pluralName: 'issueStatuses', parentKey: 'projectId', parent: 'project', mutation: 'updateIssueStatus' },
  { pluralName: 'issueComments', parentKey: 'issueId', parent: 'issue', mutation: 'updateIssueComment' },
  { pluralName: 'worklogs', parentKey: 'issueId', parent: 'issue', mutation: 'updateWorklog' },
  { pluralName: 'issueHistories', parentKey: 'issueId', parent: 'issue', mutation: 'updateIssueHistory' },
  { pluralName: 'issueMerchants', parentKey: 'merchantId', parent: 'merchant', mutation: 'updateIssueMerchant' },
] as const;
type MemberRow = { id: string; scopedAppIds?: string[] | null };

// Fills the two mirrors the row-level predicate reads: `issue.app`, and
// `workspaceMember.scopedAppIds`. Run after install and after any change to
// App Access; a database event trigger is what this becomes if the prototype
// survives.
//
// Runs as the application, so it sees every row regardless of who called it.
// That is the point — it is a backfill, not a user-facing read.
type SyncAppScopeMirrorBody = { only?: 'issues' | 'members' };

const handler = async (event: RoutePayload<SyncAppScopeMirrorBody>) => {
  const only = event.body?.only;
  const client = createAppClient();
  // Reported per mirror: the two write different objects, and when one is
  // refused the other still says whether the refusal is about that object or
  // about the caller.
  const result: Record<string, unknown> = { success: true };

  if (only !== 'members') {
    try {
      result.issuesUpdated = await mirrorIssueApps(client);
    } catch (error) {
      result.success = false;
      result.issuesError = readErrorMessage(error);
    }
  }

  if (only !== 'issues') {
    try {
      result.membersUpdated = await mirrorMemberScopedAppIds(client);
    } catch (error) {
      result.success = false;
      result.membersError = readErrorMessage(error);
    }
  }

  return result;
};

const mirrorIssueApps = async (client: ApiClient): Promise<number> => {
  const appIdByParentId: Record<string, Map<string, string | null>> = {
    project: await buildAppIdByRecordId(client, 'projects', 'appId'),
    merchant: await buildAppIdByRecordId(client, 'merchants', 'appId'),
    issue: new Map(),
  };

  let updatedCount = 0;

  for (const step of MIRROR_STEPS) {
    const rows = await listScopedRecords<ScopedRow>({
      client,
      pluralName: step.pluralName,
      filter: {},
      selection: { id: true, appId: true, [step.parentKey]: true },
    });

    for (const row of rows) {
      const parentId = row[step.parentKey] ?? null;
      const expectedAppId =
        parentId === null
          ? null
          : (appIdByParentId[step.parent].get(parentId) ?? null);

      if (step.pluralName === 'issues') {
        appIdByParentId.issue.set(row.id, expectedAppId);
      }

      if ((row.appId ?? null) === expectedAppId) {
        continue;
      }

      await client.mutation({
        [step.mutation]: {
          __args: { id: row.id, data: { appId: expectedAppId } },
          id: true,
        },
      });
      updatedCount++;
    }
  }

  return updatedCount;
};

const buildAppIdByRecordId = async (
  client: ApiClient,
  pluralName: string,
  appIdFieldName: string,
): Promise<Map<string, string | null>> => {
  const rows = await listScopedRecords<ProjectRow>({
    client,
    pluralName,
    filter: {},
    selection: { id: true, [appIdFieldName]: true },
  });

  return new Map(rows.map((row) => [row.id, row.appId ?? null]));
};

const mirrorMemberScopedAppIds = async (client: ApiClient): Promise<number> => {
  const members = await listScopedRecords<MemberRow>({
    client,
    pluralName: 'workspaceMembers',
    filter: {},
    selection: { id: true, scopedAppIds: true },
  });

  let updatedCount = 0;

  for (const member of members) {
    // Same path the appAccess trigger takes, so a backfill and a live grant
    // change cannot disagree about what a member may see.
    if (await syncMemberScopedAppIds({ client, memberId: member.id })) {
      updatedCount++;
    }
  }

  return updatedCount;
};

export default defineLogicFunction({
  universalIdentifier: SYNC_APP_SCOPE_MIRROR_LOGIC_FUNCTION_UID,
  name: 'sync-app-scope-mirror',
  description:
    'Route: backfills issue.app and workspaceMember.scopedAppIds, the two mirrors the row-level app-scope predicate reads.',
  timeoutSeconds: 300,
  httpRouteTriggerSettings: {
    path: SYNC_APP_SCOPE_MIRROR_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
