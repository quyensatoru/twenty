import { parseDevelopmentDeliveries } from '../utils/parse-development-deliveries.util';
import { enrichDevelopmentDelivery } from './utils/git-delivery-api.util';
import { saveDevelopmentDeliveries } from './utils/save-development-deliveries.util';
import { getGitWebhookHealthKey } from './utils/git-kv.util';
import { getActiveGitRepository } from './utils/get-active-git-repository.util';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { getConnection, kv } from 'twenty-sdk/logic-function';

import { GIT_WEBHOOK_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { parseGitWebhook } from '../utils/parse-git-webhook.util';
import { verifyGitWebhookSignature } from '../utils/verify-git-signature.util';
import {
  GIT_WEBHOOK_CONNECTION_PARAMETER,
  GIT_WEBHOOK_REPOSITORY_PARAMETER,
} from './utils/get-git-webhook-destination-url.util';
import {
  getGitWebhookRegistrationKey,
  type GitWebhookRegistration,
} from './utils/git-kv.util';
import { upsertDevelopmentReferences } from './utils/upsert-development-links.util';

type GitWebhookResult =
  | {
      success: true;
      created: number;
      updated: number;
      skipped: number;
      deliveries?: number;
    }
  | { success: true; skipped: true; reason: string }
  | { success: false; error: string };

// Runs for every push and pull/merge-request event on a linked repo: verifies
// the provider signature, extracts the issue keys, and upserts the
// development links. Reached only through the resolver, which already pinned
// the delivery to one repository registration.
export const gitWebhookHandler = async (
  event: RoutePayload<unknown>,
): Promise<GitWebhookResult> => {
  const repositoryId =
    event.queryStringParameters?.[GIT_WEBHOOK_REPOSITORY_PARAMETER];
  const connectedAccountId =
    event.queryStringParameters?.[GIT_WEBHOOK_CONNECTION_PARAMETER];

  if (
    typeof repositoryId !== 'string' ||
    repositoryId === '' ||
    typeof connectedAccountId !== 'string' ||
    connectedAccountId === ''
  ) {
    return { success: false, error: 'Unknown git webhook.' };
  }

  const registration = await kv.get<GitWebhookRegistration>(
    getGitWebhookRegistrationKey(repositoryId),
  );

  if (
    registration === null ||
    registration.connectionId !== connectedAccountId ||
    !registration.isActive
  ) {
    return { success: false, error: 'Unknown git webhook.' };
  }

  const provider = registration.provider;
  const signatureOk = verifyGitWebhookSignature({
    provider,
    rawBody: typeof event.rawBody === 'string' ? event.rawBody : null,
    secret: registration.secret,
    signatureHeader: event.headers['x-hub-signature-256'],
    tokenHeader: event.headers['x-gitlab-token'],
  });

  if (!signatureOk) {
    return { success: false, error: 'Invalid git webhook signature.' };
  }

  const client = new CoreApiClient({ runAs: 'application' });
  const repository = await getActiveGitRepository(client, repositoryId);
  if (repository === null) {
    return {
      success: true,
      skipped: true,
      reason: 'Repository is paused or unlinked.',
    };
  }

  const body =
    typeof event.body === 'object' && event.body !== null ? event.body : {};

  const parsed = parseGitWebhook({
    provider,
    eventName:
      provider === 'github' ? (event.headers['x-github-event'] ?? null) : null,
    headers: event.headers,
    payload: body,
  });

  if (repository.externalId !== parsed.repoExternalId) {
    return {
      success: false,
      error: 'Repository does not match the webhook registration.',
    };
  }

  const deliveries = parseDevelopmentDeliveries({
    provider,
    eventName: event.headers['x-github-event'] ?? null,
    payload: body,
  });

  if (parsed.references.length === 0 && deliveries.length === 0) {
    return {
      success: true,
      skipped: true,
      reason: parsed.ignoredEvent ?? 'No issue key in the delivery.',
    };
  }

  try {
    const enriched = [];
    if (deliveries.length > 0) {
      const connection = await getConnection(connectedAccountId);
      for (const delivery of deliveries)
        enriched.push(
          await enrichDevelopmentDelivery({
            repository,
            accessToken: connection.accessToken,
            delivery,
          }),
        );
    }
    if ((await getActiveGitRepository(client, repositoryId)) === null)
      return {
        success: true,
        skipped: true,
        reason: 'Repository is paused or unlinked.',
      };
    const outcome = await upsertDevelopmentReferences({
      client,
      references: parsed.references,
      repositoryId,
      defaultRepositorySlug: parsed.repoSlug,
    });
    const saved = await saveDevelopmentDeliveries({
      client,
      repositoryId,
      deliveries: enriched,
    });
    await kv.set(getGitWebhookHealthKey(repositoryId), {
      lastSyncedAt: new Date().toISOString(),
      error: null,
      unknownIssueKeys: outcome.unknownIssueKeys,
    });
    return {
      success: true,
      created: outcome.created,
      updated: outcome.updated,
      skipped: outcome.skipped,
      deliveries: saved,
    };
  } catch (error) {
    const previousHealth = await kv.get<{ lastSyncedAt: string | null }>(
      getGitWebhookHealthKey(repositoryId),
    );
    await kv.set(getGitWebhookHealthKey(repositoryId), {
      lastSyncedAt: previousHealth?.lastSyncedAt ?? null,
      error: error instanceof Error ? error.message : 'Git webhook failed.',
    });
    throw error;
  }
};

export default defineLogicFunction({
  universalIdentifier: GIT_WEBHOOK_LOGIC_FUNCTION_UID,
  name: 'git-webhook',
  description:
    'Handles GitHub/GitLab push and pull-request events into development links.',
  timeoutSeconds: 120,
  handler: gitWebhookHandler,
});
