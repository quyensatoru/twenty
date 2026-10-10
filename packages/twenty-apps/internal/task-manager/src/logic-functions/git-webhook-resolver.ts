import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import {
  kv,
  Response,
  type ServerRouteResolverResult,
} from 'twenty-sdk/logic-function';

import { GIT_WEBHOOK_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { GIT_WEBHOOK_RESOLVER_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import {
  GIT_WEBHOOK_CONNECTION_PARAMETER,
  GIT_WEBHOOK_REPOSITORY_PARAMETER,
} from './utils/get-git-webhook-destination-url.util';
import { getGitConnectionClaimKey } from './utils/git-kv.util';

export const gitWebhookResolverHandler = async (
  routePayload: RoutePayload<unknown>,
): Promise<ServerRouteResolverResult> => {
  const connectedAccountId =
    routePayload.queryStringParameters?.[GIT_WEBHOOK_CONNECTION_PARAMETER];
  const repositoryId =
    routePayload.queryStringParameters?.[GIT_WEBHOOK_REPOSITORY_PARAMETER];

  if (
    typeof connectedAccountId !== 'string' ||
    connectedAccountId === '' ||
    typeof repositoryId !== 'string' ||
    repositoryId === ''
  ) {
    return new Response({ error: 'Unknown git webhook' }, { status: 404 });
  }

  const workspaceId = await kv.get<string>(
    getGitConnectionClaimKey(connectedAccountId),
    { scope: 'SERVER' },
  );

  if (typeof workspaceId !== 'string' || workspaceId === '') {
    return new Response({ error: 'Unknown git connection' }, { status: 404 });
  }

  return {
    workspaceId,
    targetLogicFunctionUniversalIdentifier: GIT_WEBHOOK_LOGIC_FUNCTION_UID,
    payload: routePayload,
  };
};

export default defineLogicFunction({
  universalIdentifier: GIT_WEBHOOK_RESOLVER_LOGIC_FUNCTION_UID,
  name: 'git-webhook-resolver',
  description:
    'Routes a GitHub/GitLab webhook delivery to the workspace owning its repository.',
  timeoutSeconds: 15,
  handler: gitWebhookResolverHandler,
  serverRouteTriggerSettings: {
    httpMethods: ['POST'],
    forwardedRequestHeaders: [
      'x-hub-signature-256',
      'x-github-event',
      'x-gitlab-event',
      'x-gitlab-token',
    ],
  },
});
