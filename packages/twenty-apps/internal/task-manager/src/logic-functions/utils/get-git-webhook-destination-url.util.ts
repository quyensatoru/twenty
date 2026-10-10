import { GIT_WEBHOOK_RESOLVER_LOGIC_FUNCTION_UID } from '../../constants/universal-identifiers';

export const GIT_WEBHOOK_CONNECTION_PARAMETER = 'connection';
export const GIT_WEBHOOK_REPOSITORY_PARAMETER = 'repository';

// Where a provider delivers: the resolver route fans out to the workspace
// that owns the repository named in the query string.
export const getGitWebhookDestinationUrl = ({
  apiUrl,
  connectedAccountId,
  repositoryId,
}: {
  apiUrl: string;
  connectedAccountId: string;
  repositoryId: string;
}): string => {
  const destinationUrl = new URL(apiUrl);
  const apiBasePath = destinationUrl.pathname.replace(/\/+$/, '');

  destinationUrl.pathname = `${apiBasePath}/webhooks/server/${GIT_WEBHOOK_RESOLVER_LOGIC_FUNCTION_UID}`;
  destinationUrl.searchParams.set(
    GIT_WEBHOOK_CONNECTION_PARAMETER,
    connectedAccountId,
  );
  destinationUrl.searchParams.set(
    GIT_WEBHOOK_REPOSITORY_PARAMETER,
    repositoryId,
  );

  return destinationUrl.toString();
};
