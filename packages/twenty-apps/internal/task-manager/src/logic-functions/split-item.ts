import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  SPLIT_ITEM_LOGIC_FUNCTION_UID,
  SPLIT_ITEM_ROUTE_PATH,
} from '../constants/product-backlog';
import { type Connection } from '../types/connection';
import { type ProductItem } from '../types/product-backlog';
import { pickNextEpicColor } from '../utils/epic-color.util';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { resolveEffectiveAppId } from './app-scope/resolve-effective-app-id.util';
import { createProductItem } from './utils/create-product-item.util';
import { listScopedRecords } from './utils/list-scoped-records.util';
import { moveIssueFamiliesToStage } from './utils/product-backlog-stage.util';
import { requireString } from './utils/require-string.util';
import { assertProductBacklogEditor } from './utils/resolve-product-backlog-access.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type SplitItemBody = {
  issueId?: string;
  // One per new story, most valuable first.
  titles?: unknown;
  // The item was an epic in disguise: it becomes one and is archived.
  shouldConvertToEpic?: boolean;
};

type SourceRow = ProductItem & { projectId?: string | null };

// Refinement's "split story": new items land right under the one they came
// from, keeping its epic, goal and labels.
const handler = async (event: RoutePayload<SplitItemBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    assertProductBacklogEditor(scope);

    const issueId = requireString(event.body?.issueId, 'issueId');
    const titles = Array.isArray(event.body?.titles)
      ? event.body.titles
          .filter((title): title is string => typeof title === 'string')
          .map((title) => title.trim())
          .filter((title) => title !== '')
      : [];

    if (titles.length === 0) {
      throw new Error('Give at least one story title.');
    }

    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'issue',
      recordId: issueId,
      operation: 'write',
    });

    const [source] = await listScopedRecords<SourceRow>({
      client,
      pluralName: 'issues',
      filter: { id: { eq: issueId } },
      selection: {
        id: true,
        title: true,
        projectId: true,
        epicId: true,
        strategicGoalId: true,
        labels: true,
        sprintId: true,
        position: true,
        parentId: true,
      },
      maxRecords: 1,
    });

    if (source === undefined || typeof source.projectId !== 'string') {
      throw new Error(`Issue ${issueId} not found`);
    }

    if (typeof source.parentId === 'string') {
      throw new Error('A subtask cannot be split.');
    }

    const projectId = source.projectId;
    let epicId = source.epicId ?? null;

    if (event.body?.shouldConvertToEpic === true) {
      const [epics, appId] = await Promise.all([
        listScopedRecords<{ color?: string | null }>({
          client,
          pluralName: 'epics',
          filter: { projectId: { eq: projectId } },
          selection: { id: true, color: true },
        }),
        resolveEffectiveAppId({
          client,
          objectNameSingular: 'epic',
          immediateForeignKeyValue: projectId,
        }),
      ]);
      const result = await client.mutation({
        createEpic: {
          __args: {
            data: {
              name: source.title ?? '',
              projectId,
              appId,
              color: pickNextEpicColor(epics.map((epic) => epic.color)),
              strategicGoalId: source.strategicGoalId ?? null,
              position: 'last',
            },
          },
          id: true,
        },
      });

      epicId = (result?.createEpic as { id?: string } | undefined)?.id ?? null;
    }

    const sourcePosition = source.position ?? 0;
    const nextResult = await client.query({
      issues: {
        __args: {
          filter: {
            projectId: { eq: projectId },
            parentId: { is: 'NULL' },
            position: { gt: sourcePosition },
          },
          orderBy: [{ position: 'AscNullsLast' }],
          first: 1,
        },
        edges: { node: { id: true, position: true } },
      },
    });
    const nextPosition =
      (
        nextResult?.issues as
          Connection<{ position?: number | null }> | undefined
      )?.edges?.[0]?.node?.position ?? sourcePosition + titles.length + 1;
    const step = (nextPosition - sourcePosition) / (titles.length + 1);

    const items: ProductItem[] = [];

    for (const [index, title] of titles.entries()) {
      items.push(
        await createProductItem({
          client,
          scope,
          projectId,
          data: {
            title,
            epicId,
            strategicGoalId: source.strategicGoalId ?? null,
            labels: source.labels ?? [],
            sprintId: source.sprintId ?? null,
            position: sourcePosition + step * (index + 1),
          },
        }),
      );
    }

    if (event.body?.shouldConvertToEpic === true) {
      await moveIssueFamiliesToStage({
        client,
        issueIds: [issueId],
        stage: 'ARCHIVED',
        extraData: { sprintId: null },
      });
    }

    return { items, epicId };
  });

export default defineLogicFunction({
  universalIdentifier: SPLIT_ITEM_LOGIC_FUNCTION_UID,
  name: 'split-item',
  description:
    'Route: splits a backlog item into smaller stories, optionally turning it into an epic.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: SPLIT_ITEM_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
