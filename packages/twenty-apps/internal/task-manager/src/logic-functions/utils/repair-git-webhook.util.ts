import { kv } from 'twenty-sdk/logic-function';
import { type GitRepository } from './get-active-git-repository.util';
import { getGitWebhookDestinationUrl } from './get-git-webhook-destination-url.util';
import { GitApiError, readGitApiJson } from './git-api.util';
import {
  getGitWebhookRegistrationKey,
  type GitWebhookRegistration,
} from './git-kv.util';

export const GITHUB_WEBHOOK_EVENTS = [
  'push',
  'pull_request',
  'create',
  'delete',
  'workflow_run',
  'deployment_status',
];

export const repairGitWebhook = async ({
  repository,
  accessToken,
}: {
  repository: GitRepository;
  accessToken: string;
}): Promise<void> => {
  const apiUrl = process.env.TWENTY_API_URL;
  if (typeof apiUrl !== 'string' || apiUrl === '')
    throw new Error('TWENTY_API_URL is required to register the git webhook.');
  if (
    repository.connectionId === null ||
    repository.slug === null ||
    repository.externalId === null
  )
    throw new Error('Incomplete repository link.');
  const previous = await kv.get<GitWebhookRegistration>(
    getGitWebhookRegistrationKey(repository.id),
  );
  const secret = previous?.secret ?? crypto.randomUUID();
  const isGitHub = repository.provider === 'GITHUB';
  const root = isGitHub
    ? `${repository.baseUrl ?? 'https://api.github.com'}/repos/${repository.slug}/hooks`
    : `${repository.baseUrl ?? 'https://gitlab.com'}/api/v4/projects/${repository.externalId}/hooks`;
  const destinationUrl = getGitWebhookDestinationUrl({
    apiUrl,
    repositoryId: repository.id,
    connectedAccountId: repository.connectionId,
  });
  const payload = isGitHub
    ? {
        name: 'web',
        active: true,
        events: GITHUB_WEBHOOK_EVENTS,
        config: {
          url: destinationUrl,
          content_type: 'json',
          secret,
          insecure_ssl: '0',
        },
      }
    : {
        url: destinationUrl,
        token: secret,
        push_events: true,
        merge_requests_events: true,
        pipeline_events: true,
        deployment_events: true,
        enable_ssl_verification: true,
      };
  const send = (hookId?: string) =>
    readGitApiJson<{ id: number }>({
      accessToken,
      connectionId: repository.connectionId!,
      url: hookId === undefined ? root : `${root}/${hookId}`,
      init: {
        method: hookId === undefined ? 'POST' : isGitHub ? 'PATCH' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(isGitHub ? { 'X-GitHub-Api-Version': '2022-11-28' } : {}),
        },
        body: JSON.stringify(payload),
      },
    });
  let hook: { id: number };
  try {
    hook = await send(previous?.hookId);
  } catch (error) {
    if (
      !(error instanceof GitApiError) ||
      error.status !== 404 ||
      previous === null
    )
      throw error;
    hook = await send();
  }
  await kv.set(getGitWebhookRegistrationKey(repository.id), {
    provider: isGitHub ? 'github' : 'gitlab',
    connectionId: repository.connectionId,
    hookId: String(hook.id),
    secret,
    isActive: true,
  } satisfies GitWebhookRegistration);
};
