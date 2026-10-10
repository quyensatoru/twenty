import {
  readGitApiJson,
  readGitApiPages,
  type GitBranchSummary,
  type GitCommitSummary,
  type GitPullRequestSummary,
  type GitRepoSummary,
} from './git-api.util';

const toApi = (baseUrl: string): string =>
  `${baseUrl.replace(/\/+$/, '')}/api/v4`;
const PAGE_SIZE = 100;
const MAX_PAGES = 5;

type GitLabProject = {
  id: number;
  path_with_namespace: string;
  name: string;
  web_url: string;
};

type GitLabBranch = { name: string };

type GitLabMergeRequest = {
  iid: number;
  title: string;
  web_url: string;
  state: string;
  draft?: boolean;
  source_branch: string;
  author?: { username?: string } | null;
};

type GitLabCommit = {
  id: string;
  message: string;
  web_url: string;
  author_name: string;
};

type GitLabHook = { id: number };

const toRepo = (project: GitLabProject): GitRepoSummary => ({
  externalId: String(project.id),
  slug: project.path_with_namespace.toLowerCase(),
  name: project.name,
  url: project.web_url,
  isPrivate: true,
});

const toMrStatus = (mr: GitLabMergeRequest): string => {
  if (mr.state === 'merged') {
    return 'MERGED';
  }

  if (mr.state === 'opened') {
    return mr.draft === true ? 'DRAFT' : 'OPEN';
  }

  return 'CLOSED';
};

export const getGitLabUser = ({
  accessToken,
  connectionId,
  baseUrl,
}: {
  accessToken: string;
  connectionId: string;
  baseUrl: string;
}) =>
  readGitApiJson<{ username: string; id: number }>({
    url: `${toApi(baseUrl)}/user`,
    accessToken,
    connectionId,
  });

export const listGitLabProjects = ({
  accessToken,
  connectionId,
  baseUrl,
}: {
  accessToken: string;
  connectionId: string;
  baseUrl: string;
}) =>
  readGitApiPages({
    maxPages: MAX_PAGES,
    listPage: (page) =>
      readGitApiJson<GitLabProject[]>({
        url: `${toApi(baseUrl)}/projects?membership=true&per_page=${PAGE_SIZE}&page=${page}&order_by=last_activity_at`,
        accessToken,
        connectionId,
      }).then((projects) => projects.map(toRepo)),
  });

export const getGitLabProject = ({
  accessToken,
  connectionId,
  baseUrl,
  slug,
}: {
  accessToken: string;
  connectionId: string;
  baseUrl: string;
  slug: string;
}) =>
  readGitApiJson<GitLabProject>({
    url: `${toApi(baseUrl)}/projects/${encodeURIComponent(slug)}`,
    accessToken,
    connectionId,
  }).then(toRepo);

export const createGitLabProjectHook = ({
  accessToken,
  connectionId,
  baseUrl,
  projectId,
  destinationUrl,
  secret,
}: {
  accessToken: string;
  connectionId: string;
  baseUrl: string;
  projectId: string;
  destinationUrl: string;
  secret: string;
}) =>
  readGitApiJson<GitLabHook>({
    url: `${toApi(baseUrl)}/projects/${projectId}/hooks`,
    accessToken,
    connectionId,
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: destinationUrl,
        token: secret,
        push_events: true,
        merge_requests_events: true,
        pipeline_events: true,
        deployment_events: true,
        enable_ssl_verification: true,
      }),
    },
  });

export const deleteGitLabProjectHook = ({
  accessToken,
  connectionId,
  baseUrl,
  projectId,
  hookId,
}: {
  accessToken: string;
  connectionId: string;
  baseUrl: string;
  projectId: string;
  hookId: string;
}) =>
  readGitApiJson<unknown>({
    url: `${toApi(baseUrl)}/projects/${projectId}/hooks/${hookId}`,
    accessToken,
    connectionId,
    init: { method: 'DELETE' },
  }).catch((error: unknown) => {
    // Same hygiene rule as GitHub: a hook already gone must not fail unlink.
    if (error instanceof Error && error.message.includes('(404)') === true) {
      return undefined;
    }

    throw error;
  });

export const listGitLabBranches = ({
  accessToken,
  connectionId,
  baseUrl,
  projectId,
}: {
  accessToken: string;
  connectionId: string;
  baseUrl: string;
  projectId: string;
}): Promise<GitBranchSummary[]> =>
  readGitApiPages({
    maxPages: 2,
    listPage: (page) =>
      readGitApiJson<GitLabBranch[]>({
        url: `${toApi(baseUrl)}/projects/${projectId}/repository/branches?per_page=${PAGE_SIZE}&page=${page}`,
        accessToken,
        connectionId,
      }),
  });

export const listGitLabMergeRequests = ({
  accessToken,
  connectionId,
  baseUrl,
  projectId,
}: {
  accessToken: string;
  connectionId: string;
  baseUrl: string;
  projectId: string;
}): Promise<GitPullRequestSummary[]> =>
  readGitApiPages({
    maxPages: MAX_PAGES,
    listPage: (page) =>
      readGitApiJson<GitLabMergeRequest[]>({
        url: `${toApi(baseUrl)}/projects/${projectId}/merge_requests?state=all&scope=all&per_page=${PAGE_SIZE}&page=${page}`,
        accessToken,
        connectionId,
      }).then((mrs) =>
        mrs.map((mr) => ({
          externalId: String(mr.iid),
          title: mr.title,
          url: mr.web_url,
          status: toMrStatus(mr),
          branchName: mr.source_branch,
          authorName: mr.author?.username ?? null,
        })),
      ),
  });

// Recent commits on the default branch only, same rate-limit reasoning as
// GitHub: history beyond this arrives through the push webhook.
export const listGitLabCommits = ({
  accessToken,
  connectionId,
  baseUrl,
  projectId,
}: {
  accessToken: string;
  connectionId: string;
  baseUrl: string;
  projectId: string;
}): Promise<GitCommitSummary[]> =>
  readGitApiJson<GitLabCommit[]>({
    url: `${toApi(baseUrl)}/projects/${projectId}/repository/commits?per_page=${PAGE_SIZE}`,
    accessToken,
    connectionId,
  }).then((commits) =>
    commits.map((commit) => ({
      sha: commit.id,
      message: commit.message,
      url: commit.web_url,
      authorName: commit.author_name,
    })),
  );
