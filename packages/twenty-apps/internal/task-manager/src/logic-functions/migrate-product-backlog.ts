import { defineLogicFunction } from 'twenty-sdk/define';

import {
  MIGRATE_PRODUCT_BACKLOG_LOGIC_FUNCTION_UID,
  MIGRATE_PRODUCT_BACKLOG_ROUTE_PATH,
} from '../constants/product-backlog';
import { AppScopePermissionDeniedError } from './app-scope/app-scope-error';
import { listScopedRecords } from './utils/list-scoped-records.util';
import { migrateBacklogColumnToItems } from './utils/migrate-backlog-column-to-items.util';
import { migrateProjectToProductBacklog } from './utils/migrate-project-to-product-backlog.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

// Sorts every project's existing issues into items and issues at once, for a
// deploy that should not wait for each project to be opened. Answers with the
// keys the Backlog column gave up, the log a rollback starts from. Each project is
// done only once, so running it again is harmless.
const handler = async () =>
  runScopedRoute(async ({ client, scope }) => {
    if (!scope.canBypassAppScope) {
      throw new AppScopePermissionDeniedError();
    }

    const projects = await listScopedRecords<{ id: string }>({
      client,
      pluralName: 'projects',
      filter: {},
      selection: { id: true },
    });
    let migratedItemCount = 0;
    const backlogColumnIssueKeys: string[] = [];

    for (const project of projects) {
      migratedItemCount += (
        await migrateProjectToProductBacklog(client, project.id)
      ).migratedItemCount;
      backlogColumnIssueKeys.push(
        ...(await migrateBacklogColumnToItems(client, project.id))
          .migratedIssueKeys,
      );
    }

    return {
      projectCount: projects.length,
      migratedItemCount,
      backlogColumnIssueKeys,
    };
  });

export default defineLogicFunction({
  universalIdentifier: MIGRATE_PRODUCT_BACKLOG_LOGIC_FUNCTION_UID,
  name: 'migrate-product-backlog',
  description:
    "Route: moves every project's unstarted, unplanned issues, then its Board's Backlog column, into its Product Backlog, once per project.",
  timeoutSeconds: 300,
  httpRouteTriggerSettings: {
    path: MIGRATE_PRODUCT_BACKLOG_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
