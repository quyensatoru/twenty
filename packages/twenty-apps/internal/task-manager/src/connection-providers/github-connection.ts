import { defineConnectionProvider } from 'twenty-sdk/define';

import { GITHUB_COM_BASE_URL, normalizeBaseUrl } from '../constants/git-hosts';
import {
  GIT_ON_CONNECTION_LOGIC_FUNCTION_UID,
  GIT_ON_DISCONNECT_LOGIC_FUNCTION_UID,
  GITHUB_CONNECTION_PROVIDER_UID,
} from '../constants/universal-identifiers';

// OAuth against a GitHub OAuth App the server administrator registers once,
// on github.com or a GitHub Enterprise Server instance. Same build-time rule
// as GitLab: GITHUB_BASE_URL env on the applying machine, default
// github.com, mirrored into the GITHUB_BASE_URL serverVariable for runtime.
// Users connect their own account under Settings → Applications →
// Task Manager → Connections; every Development sync then acts with that
// account's token. The `repo` scope covers code, pull requests and repository
// webhooks on the account's repos.
const INSTANCE_BASE_URL =
  typeof process.env.GITHUB_BASE_URL === 'string' &&
  process.env.GITHUB_BASE_URL.trim() !== ''
    ? normalizeBaseUrl(process.env.GITHUB_BASE_URL)
    : GITHUB_COM_BASE_URL;

export default defineConnectionProvider({
  universalIdentifier: GITHUB_CONNECTION_PROVIDER_UID,
  name: 'github',
  displayName: 'GitHub',
  type: 'oauth',
  onConnectLogicFunction: {
    universalIdentifier: GIT_ON_CONNECTION_LOGIC_FUNCTION_UID,
  },
  onDisconnectLogicFunction: {
    universalIdentifier: GIT_ON_DISCONNECT_LOGIC_FUNCTION_UID,
  },
  oauth: {
    authorizationEndpoint: `${INSTANCE_BASE_URL}/login/oauth/authorize`,
    tokenEndpoint: `${INSTANCE_BASE_URL}/login/oauth/access_token`,
    scopes: ['repo', 'read:user', 'user:email'],
    clientIdVariable: 'GITHUB_CLIENT_ID',
    clientSecretVariable: 'GITHUB_CLIENT_SECRET',
  },
});
