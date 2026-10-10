// One place for every git host this app talks to. Hosts resolve in two
// stages, because the SDK resolves them at two different times:
//
// - OAuth endpoints (authorize/token) are embedded into the connection
//   provider manifest at apply time, so each provider reads its base URL from
//   the machine applying the app (GITLAB_BASE_URL / GITHUB_BASE_URL env, no
//   trailing slash) with the public defaults below. Same variable names as
//   the serverVariables the runtime reads — fill the same URL in both places.
// - Every API call at runtime reads the GITLAB_BASE_URL / GITHUB_BASE_URL
//   serverVariables (injected as env into logic functions). Linked repository
//   rows additionally remember their own base URL, so old links survive host
//   changes. Empty means the public default.
export const GITLAB_COM_BASE_URL = 'https://gitlab.com';
export const GITHUB_COM_BASE_URL = 'https://github.com';
export const GITHUB_COM_API_BASE_URL = 'https://api.github.com';

export const normalizeBaseUrl = (url: string): string =>
  url.trim().replace(/\/+$/, '');

// Connection provider names this app declares. Anything else is some other
// app's provider sharing the workspace and is ignored by the sync.
export const GIT_PROVIDER_NAMES = ['github', 'gitlab'] as const;

export type GitConnectionProviderName = (typeof GIT_PROVIDER_NAMES)[number];

export const isGitProviderName = (
  value: unknown,
): value is GitConnectionProviderName =>
  typeof value === 'string' &&
  (GIT_PROVIDER_NAMES as readonly string[]).includes(value);

// Instance root for provider calls at runtime (the GitLab helpers append
// `/api/v4` themselves). Null means unconfigured — callers must refuse with
// an actionable error, never silently fall back to the wrong instance.
export const readGitInstanceBaseUrl = (providerName: string): string | null => {
  if (providerName === 'github') {
    const override = process.env.GITHUB_BASE_URL;

    return typeof override === 'string' &&
      override.trim() !== '' &&
      normalizeBaseUrl(override) !== GITHUB_COM_BASE_URL
      ? `${normalizeBaseUrl(override)}/api/v3`
      : GITHUB_COM_API_BASE_URL;
  }

  if (providerName === 'gitlab') {
    const override = process.env.GITLAB_BASE_URL;

    return typeof override === 'string' && override.trim() !== ''
      ? normalizeBaseUrl(override)
      : GITLAB_COM_BASE_URL;
  }

  return null;
};

// Same as above, but refuses instead of returning null: a misconfigured host
// must fail loudly at link time.
export const requireGitBaseUrl = (providerName: string): string => {
  const baseUrl = readGitInstanceBaseUrl(providerName);

  if (baseUrl === null) {
    throw new Error(
      'The git host URL is not configured. Fill it on the application registration.',
    );
  }

  return baseUrl;
};

export const gitDisplayProvider = (providerName: string): string =>
  providerName === 'github' ? 'GITHUB' : 'GITLAB';
