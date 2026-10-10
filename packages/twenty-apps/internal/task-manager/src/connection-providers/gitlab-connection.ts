import { defineConnectionProvider } from 'twenty-sdk/define';

import { GITLAB_COM_BASE_URL, normalizeBaseUrl } from '../constants/git-hosts';
import {
  GIT_ON_CONNECTION_LOGIC_FUNCTION_UID,
  GIT_ON_DISCONNECT_LOGIC_FUNCTION_UID,
  GITLAB_CONNECTION_PROVIDER_UID,
} from '../constants/universal-identifiers';

// OAuth against a GitLab OAuth application the server administrator registers
// once, on gitlab.com or a self-hosted instance. The SDK embeds these
// endpoints into the manifest verbatim, so the host comes from the machine
// applying the app (GITLAB_BASE_URL env, no trailing slash) with gitlab.com
// as the default — the same variable name as the GITLAB_BASE_URL
// serverVariable the runtime reads, so fill the same URL in both places. The
// `api` scope covers projects, merge requests and project webhooks.
const INSTANCE_BASE_URL =
  typeof process.env.GITLAB_BASE_URL === 'string' &&
  process.env.GITLAB_BASE_URL.trim() !== ''
    ? normalizeBaseUrl(process.env.GITLAB_BASE_URL)
    : GITLAB_COM_BASE_URL;

export default defineConnectionProvider({
  universalIdentifier: GITLAB_CONNECTION_PROVIDER_UID,
  name: 'gitlab',
  displayName: 'GitLab',
  type: 'oauth',
  onConnectLogicFunction: {
    universalIdentifier: GIT_ON_CONNECTION_LOGIC_FUNCTION_UID,
  },
  onDisconnectLogicFunction: {
    universalIdentifier: GIT_ON_DISCONNECT_LOGIC_FUNCTION_UID,
  },
  oauth: {
    authorizationEndpoint: `${INSTANCE_BASE_URL}/oauth/authorize`,
    tokenEndpoint: `${INSTANCE_BASE_URL}/oauth/token`,
    scopes: ['api', 'read_user'],
    clientIdVariable: 'GITLAB_CLIENT_ID',
    clientSecretVariable: 'GITLAB_CLIENT_SECRET',
  },
});
