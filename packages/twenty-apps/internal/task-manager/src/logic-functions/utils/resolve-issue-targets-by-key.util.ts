import { type ApiClient } from '../../types/api-client';
import { resolveEffectiveAppId } from '../app-scope/resolve-effective-app-id.util';
import { listScopedRecords } from './list-scoped-records.util';

// Bounds the `in` filter so a large backfill does not build one huge query.
export const ISSUE_KEY_LOOKUP_BATCH_SIZE = 100;

export type IssueTarget = {
  issueId: string;
  appId: string | null;
};

export const chunkItems = <TItem>(items: TItem[], size: number): TItem[][] => {
  const chunks: TItem[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};

// Every API call counts against one per-application rate limit shared by all
// task-manager functions, so git syncs resolve all their keys in a few reads
// instead of one per reference. Records hanging off an issue take the app of
// the issue's project, resolved once per project.
export const resolveIssueTargetsByKey = async ({
  client,
  issueKeys,
}: {
  client: ApiClient;
  issueKeys: string[];
}): Promise<Map<string, IssueTarget>> => {
  const uniqueKeys = [...new Set(issueKeys)];
  const issues: { id: string; issueKey: string; projectId: string | null }[] =
    [];

  for (const keys of chunkItems(uniqueKeys, ISSUE_KEY_LOOKUP_BATCH_SIZE)) {
    issues.push(
      ...(await listScopedRecords<{
        id: string;
        issueKey: string;
        projectId: string | null;
      }>({
        client,
        pluralName: 'issues',
        filter: { issueKey: { in: keys } },
        selection: { id: true, issueKey: true, projectId: true },
      })),
    );
  }

  const appIdByProjectId = new Map<string, string | null>();

  for (const projectId of new Set(issues.map((issue) => issue.projectId))) {
    if (projectId === null) {
      continue;
    }

    appIdByProjectId.set(
      projectId,
      await resolveEffectiveAppId({
        client,
        objectNameSingular: 'issue',
        immediateForeignKeyValue: projectId,
      }),
    );
  }

  const targets = new Map<string, IssueTarget>();

  for (const issue of issues) {
    targets.set(issue.issueKey.toUpperCase(), {
      issueId: issue.id,
      appId:
        issue.projectId === null
          ? null
          : (appIdByProjectId.get(issue.projectId) ?? null),
    });
  }

  return targets;
};
