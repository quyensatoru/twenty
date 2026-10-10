import { reportConnectionAuthFailure } from 'twenty-sdk/logic-function';

export type GitProviderName = 'github' | 'gitlab';

export type GitRepoSummary = {
  externalId: string;
  slug: string;
  name: string;
  url: string;
  isPrivate: boolean;
};

export type GitBranchSummary = { name: string };

export type GitCommitSummary = {
  sha: string;
  message: string | null;
  url: string | null;
  authorName: string | null;
};

export type GitPullRequestSummary = {
  externalId: string;
  title: string | null;
  url: string | null;
  status: string | null;
  branchName: string | null;
  authorName: string | null;
};

export class GitApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'GitApiError';
    this.status = status;
  }
}

// Every provider call funnels through here: a 401 means the OAuth grant died,
// so the connection is reported failed (the host surfaces reconnect) and the
// sync stops instead of burning rate limit on a dead token.
export const readGitApiJson = async <TData>({
  url,
  accessToken,
  connectionId,
  init,
}: {
  url: string;
  accessToken: string;
  connectionId: string;
  init?: RequestInit;
}): Promise<TData> => {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401) {
    await reportConnectionAuthFailure({
      connectionId,
      reason: 'The git provider rejected the access token.',
    });

    throw new GitApiError('The git connection expired. Reconnect it.', 401);
  }

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);

    throw new GitApiError(
      `Git API call failed (${response.status}): ${detail}`,
      response.status,
    );
  }

  if (response.status === 204) {
    return undefined as TData;
  }

  return (await response.json()) as TData;
};

export const readGitApiPages = async <TItem>({
  listPage,
  maxPages,
}: {
  listPage: (page: number) => Promise<TItem[]>;
  maxPages: number;
}): Promise<TItem[]> => {
  const items: TItem[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const rows = await listPage(page);

    items.push(...rows);

    if (rows.length === 0) {
      break;
    }
  }

  return items;
};
