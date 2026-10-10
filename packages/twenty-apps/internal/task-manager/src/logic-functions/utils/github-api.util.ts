import { GITHUB_WEBHOOK_EVENTS } from './repair-git-webhook.util';
import {
  readGitApiJson,
  readGitApiPages,
  type GitBranchSummary,
  type GitCommitSummary,
  type GitPullRequestSummary,
  type GitRepoSummary,
} from './git-api.util';

import { requireGitBaseUrl } from '../../constants/git-hosts';
const PAGE_SIZE = 100;
const MAX_PAGES = 5;

type GitHubRepo = {
  id: number;
  full_name: string;
  name: string;
  html_url: string;
  private: boolean;
  permissions?: { admin?: boolean; maintain?: boolean; push?: boolean };
};

type GitHubBranch = { name: string };

type GitHubPull = {
  number: number;
  title: string;
  html_url: string;
  state: string;
  draft?: boolean;
  merged_at?: string | null;
  head: { ref: string };
  user?: { login?: string } | null;
};

type GitHubCommit = {
  sha: string;
  html_url: string;
  commit?: { message?: string; author?: { name?: string } | null } | null;
  author?: { login?: string } | null;
};

const headers = { 'X-GitHub-Api-Version': '2022-11-28' };

const toRepo = (repo: GitHubRepo): GitRepoSummary => ({
  externalId: String(repo.id),
  slug: repo.full_name.toLowerCase(),
  name: repo.name,
  url: repo.html_url,
  isPrivate: repo.private,
});

const toPullStatus = (pull: GitHubPull): string => {
  if (pull.merged_at !== null && pull.merged_at !== undefined) {
    return 'MERGED';
  }

  if (pull.state === 'open') {
    return pull.draft === true ? 'DRAFT' : 'OPEN';
  }

  return 'CLOSED';
};

export const getGitHubUser = ({
  accessToken,
  connectionId,
  baseUrl = requireGitBaseUrl('github'),
}: {
  accessToken: string;
  connectionId: string;
  baseUrl?: string;
}) =>
  readGitApiJson<{ login: string; id: number }>({
    url: `${baseUrl}/user`,
    accessToken,
    connectionId,
    init: { headers },
  });

export const listGitHubRepos = ({
  accessToken,
  connectionId,
  baseUrl = requireGitBaseUrl('github'),
}: {
  accessToken: string;
  connectionId: string;
  baseUrl?: string;
}) =>
  readGitApiPages({
    maxPages: MAX_PAGES,
    listPage: (page) =>
      readGitApiJson<GitHubRepo[]>({
        url: `${baseUrl}/user/repos?per_page=${PAGE_SIZE}&page=${page}&sort=updated`,
        accessToken,
        connectionId,
        init: { headers },
      }).then((repos) => repos.map(toRepo)),
  });

export const getGitHubRepo = ({
  accessToken,
  connectionId,
  baseUrl = requireGitBaseUrl('github'),
  slug,
}: {
  accessToken: string;
  connectionId: string;
  baseUrl?: string;
  slug: string;
}) =>
  readGitApiJson<GitHubRepo>({
    url: `${baseUrl}/repos/${slug}`,
    accessToken,
    connectionId,
    init: { headers },
  }).then(toRepo);

export const createGitHubRepoHook = ({
  accessToken,
  connectionId,
  baseUrl = requireGitBaseUrl('github'),
  slug,
  destinationUrl,
  secret,
}: {
  accessToken: string;
  connectionId: string;
  baseUrl?: string;
  slug: string;
  destinationUrl: string;
  secret: string;
}) =>
  readGitApiJson<{ id: number }>({
    url: `${baseUrl}/repos/${slug}/hooks`,
    accessToken,
    connectionId,
    init: {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'web',
        active: true,
        events: GITHUB_WEBHOOK_EVENTS,
        config: {
          url: destinationUrl,
          content_type: 'json',
          secret,
          insecure_ssl: '0',
        },
      }),
    },
  });

export const deleteGitHubRepoHook = ({
  accessToken,
  connectionId,
  baseUrl = requireGitBaseUrl('github'),
  slug,
  hookId,
}: {
  accessToken: string;
  connectionId: string;
  baseUrl?: string;
  slug: string;
  hookId: string;
}) =>
  readGitApiJson<unknown>({
    url: `${baseUrl}/repos/${slug}/hooks/${hookId}`,
    accessToken,
    connectionId,
    init: { method: 'DELETE', headers },
  }).catch((error: unknown) => {
    // Deleting the repo-side hook is hygiene, not the unlink itself: a hook
    // already gone on GitHub must not fail the unlink.
    if (error instanceof Error && error.message.includes('(404)') === true) {
      return undefined;
    }

    throw error;
  });

export const listGitHubBranches = ({
  accessToken,
  connectionId,
  baseUrl = requireGitBaseUrl('github'),
  slug,
}: {
  accessToken: string;
  connectionId: string;
  baseUrl?: string;
  slug: string;
}): Promise<GitBranchSummary[]> =>
  readGitApiPages({
    maxPages: 2,
    listPage: (page) =>
      readGitApiJson<GitHubBranch[]>({
        url: `${baseUrl}/repos/${slug}/branches?per_page=${PAGE_SIZE}&page=${page}`,
        accessToken,
        connectionId,
        init: { headers },
      }),
  });

export const listGitHubPulls = ({
  accessToken,
  connectionId,
  baseUrl = requireGitBaseUrl('github'),
  slug,
}: {
  accessToken: string;
  connectionId: string;
  baseUrl?: string;
  slug: string;
}): Promise<GitPullRequestSummary[]> =>
  readGitApiPages({
    maxPages: MAX_PAGES,
    listPage: (page) =>
      readGitApiJson<GitHubPull[]>({
        url: `${baseUrl}/repos/${slug}/pulls?state=all&per_page=${PAGE_SIZE}&page=${page}`,
        accessToken,
        connectionId,
        init: { headers },
      }).then((pulls) =>
        pulls.map((pull) => ({
          externalId: String(pull.number),
          title: pull.title,
          url: pull.html_url,
          status: toPullStatus(pull),
          branchName: pull.head.ref,
          authorName: pull.user?.login ?? null,
        })),
      ),
  });

// Recent commits on the default branch only: walking every branch's history
// would burn the rate limit for rows the push webhook delivers anyway.
export const listGitHubCommits = ({
  accessToken,
  connectionId,
  baseUrl = requireGitBaseUrl('github'),
  slug,
}: {
  accessToken: string;
  connectionId: string;
  baseUrl?: string;
  slug: string;
}): Promise<GitCommitSummary[]> =>
  readGitApiJson<GitHubCommit[]>({
    url: `${baseUrl}/repos/${slug}/commits?per_page=${PAGE_SIZE}`,
    accessToken,
    connectionId,
    init: { headers },
  }).then((commits) =>
    commits.map((commit) => ({
      sha: commit.sha,
      message: commit.commit?.message ?? null,
      url: commit.html_url,
      authorName: commit.commit?.author?.name ?? commit.author?.login ?? null,
    })),
  );
