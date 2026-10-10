import { getGitSyncHealth } from './utils/get-git-sync-health.util';
import { type DevelopmentDeliveryRow } from '../types/development-delivery';
import { getLatestDevelopmentDeliveries } from '../utils/summarize-development-deliveries.util';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { kv, listConnections } from 'twenty-sdk/logic-function';

import {
  DEVELOPMENT_LINK_SELECTION,
  DEVELOPMENT_DELIVERY_SELECTION,
  REPOSITORY_SELECTION,
} from '../constants/record-selections';
import { DEVELOPMENT_LINKS_ROUTE_PATH } from '../constants/route-paths';
import { DEVELOPMENT_LINKS_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { GIT_PROVIDER_NAMES } from '../constants/git-hosts';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { hasAppGrant } from './app-scope/has-app-grant.util';
import { fetchRecordColumn } from './utils/fetch-record-column.util';
import {
  getGitWebhookRegistrationKey,
  type GitWebhookRegistration,
} from './utils/git-kv.util';
import { listScopedRecords } from './utils/list-scoped-records.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type DevelopmentLinksBody = { issueId?: string };

// One issue's Development panel: its links grouped by the widget, the
// project's linked repositories, the git accounts available for linking, and
// whether the caller may manage either. Connection tokens never leave the
// server: accounts go out as id, provider and handle only.
const handler = async (event: RoutePayload<DevelopmentLinksBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const issueId = requireString(event.body?.issueId, 'issueId');

    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'issue',
      recordId: issueId,
      operation: 'read',
    });

    const issueKey = await fetchRecordColumn(
      client,
      'issues',
      issueId,
      'issueKey',
    );
    const projectId = await fetchRecordColumn(
      client,
      'issues',
      issueId,
      'projectId',
    );

    const [links, repositories, connections, deliveryEvents] =
      await Promise.all([
        listScopedRecords({
          client,
          pluralName: 'developmentLinks',
          filter: { issueId: { eq: issueId } },
          selection: DEVELOPMENT_LINK_SELECTION,
          orderBy: [{ createdAt: 'AscNullsLast' }],
        }),
        projectId === null
          ? Promise.resolve([])
          : listScopedRecords({
              client,
              pluralName: 'repositories',
              filter: { projectId: { eq: projectId } },
              selection: REPOSITORY_SELECTION,
              orderBy: [{ createdAt: 'AscNullsLast' }],
            }),
        listConnections().then((rows) =>
          rows
            .filter((row) =>
              (GIT_PROVIDER_NAMES as readonly string[]).includes(
                row.providerName,
              ),
            )
            .map((row) => ({
              id: row.id,
              provider: row.providerName,
              handle: row.handle,
            })),
        ),
        listScopedRecords<DevelopmentDeliveryRow>({
          client,
          pluralName: 'developmentDeliveries',
          filter: { issueId: { eq: issueId } },
          selection: DEVELOPMENT_DELIVERY_SELECTION,
        }),
      ]);

    const projectAppId =
      projectId === null
        ? null
        : await fetchRecordColumn(client, 'projects', projectId, 'appId');

    // Whether each repo feeds live webhook events. A repo linked while the
    // provider refused the hook (localhost destination, missing grant) has
    // none — the widget says so and offers a manual resync instead.
    const repositoriesWithWebhook = await Promise.all(
      (repositories as { id: string; isActive: boolean }[]).map(
        async (repository) => {
          const registration = await kv.get<GitWebhookRegistration>(
            getGitWebhookRegistrationKey(repository.id),
          );

          return {
            ...repository,
            hasWebhook:
              repository.isActive === true &&
              registration !== null &&
              registration.isActive === true,
            ...(await getGitSyncHealth(repository.id)),
          };
        },
      ),
    );

    return {
      issue: { id: issueId, issueKey, projectId },
      // The selection above omits every secret-bearing column on purpose.
      links,
      deliveries: getLatestDevelopmentDeliveries(deliveryEvents),
      repositories: repositoriesWithWebhook,
      connections,
      canWrite: hasAppGrant(scope, projectAppId, 'write'),
      // Injected into every logic-function execution: lets the widget deep-link
      // to this app's Settings page, where the Connections section lives.
      applicationId:
        typeof process.env.APPLICATION_ID === 'string'
          ? process.env.APPLICATION_ID
          : null,
    };
  });

export default defineLogicFunction({
  universalIdentifier: DEVELOPMENT_LINKS_LOGIC_FUNCTION_UID,
  name: 'development-links',
  description:
    'Route: one issue with its development links and project repositories.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: DEVELOPMENT_LINKS_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
