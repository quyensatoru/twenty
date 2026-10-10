import { describe, expect, it } from 'vitest';

import { parseGitWebhook } from '../parse-git-webhook.util';

describe('parseGitWebhook', () => {
  it('parses a GitHub push into commit references', () => {
    const parsed = parseGitWebhook({
      provider: 'github',
      eventName: 'push',
      headers: {},
      payload: {
        repository: { full_name: 'Acme/Webshop', id: 42 },
        commits: [
          {
            id: 'abc123',
            message: 'PROJ-7 fix totals',
            url: 'https://github.com/acme/webshop/commit/abc123',
            author: { name: 'Mai' },
          },
        ],
      },
    });

    expect(parsed.repoSlug).toBe('acme/webshop');
    expect(parsed.repoExternalId).toBe('42');
    expect(parsed.references).toEqual([
      {
        kind: 'commit',
        title: 'PROJ-7 fix totals',
        url: 'https://github.com/acme/webshop/commit/abc123',
        externalId: 'abc123',
        authorName: 'Mai',
      },
    ]);
  });

  it('parses a GitHub pull_request with merge state', () => {
    const parsed = parseGitWebhook({
      provider: 'github',
      eventName: 'pull_request',
      headers: {},
      payload: {
        repository: { full_name: 'acme/webshop', id: 42 },
        pull_request: {
          number: 9,
          title: 'Fix PROJ-9 checkout',
          html_url: 'https://github.com/acme/webshop/pull/9',
          state: 'closed',
          merged: true,
          head: { ref: 'PROJ-9-checkout' },
          user: { login: 'mai' },
        },
      },
    });

    expect(parsed.references[0]).toMatchObject({
      kind: 'pull-request',
      status: 'MERGED',
      externalId: '9',
      authorName: 'mai',
      text: 'PROJ-9-checkout',
    });
  });

  it('parses GitLab push and merge_request events', () => {
    const push = parseGitWebhook({
      provider: 'gitlab',
      eventName: null,
      headers: { 'x-gitlab-event': 'Push Hook' },
      payload: {
        object_kind: 'push',
        project: { path_with_namespace: 'Acme/Webshop', id: 7 },
        commits: [
          {
            id: 'def456',
            message: 'plain refactor',
            url: 'https://git.example/acme/webshop/-/commit/def456',
            author: { name: 'An' },
          },
        ],
      },
    });

    expect(push.repoSlug).toBe('acme/webshop');
    expect(push.references).toHaveLength(1);

    const mr = parseGitWebhook({
      provider: 'gitlab',
      eventName: null,
      headers: {},
      payload: {
        object_kind: 'merge_request',
        project: { path_with_namespace: 'acme/webshop', id: 7 },
        object_attributes: {
          iid: 3,
          title: 'PROJ-11 totals',
          url: 'https://git.example/acme/webshop/-/merge_requests/3',
          state: 'opened',
          source_branch: 'PROJ-11-totals',
        },
      },
    });

    expect(mr.references[0]).toMatchObject({
      kind: 'pull-request',
      status: 'OPEN',
      externalId: '3',
      text: 'PROJ-11-totals',
    });
  });

  it('ignores ping and unknown events without references', () => {
    const ping = parseGitWebhook({
      provider: 'github',
      eventName: 'ping',
      headers: {},
      payload: { repository: { full_name: 'a/b', id: 1 } },
    });

    expect(ping.references).toEqual([]);
    expect(ping.ignoredEvent).toBe('ping');

    const unknown = parseGitWebhook({
      provider: 'gitlab',
      eventName: null,
      headers: {},
      payload: { object_kind: 'pipeline', project: {} },
    });

    expect(unknown.references).toEqual([]);
    expect(unknown.ignoredEvent).toBe('pipeline');
  });
});

describe('live branches and draft requests', () => {
  it('links a pushed branch even if its commit messages contain no key', () => {
    const parsed = parseGitWebhook({
      provider: 'github',
      eventName: 'push',
      headers: {},
      payload: {
        repository: {
          full_name: 'acme/repo',
          html_url: 'https://github.com/acme/repo',
          id: 1,
        },
        ref: 'refs/heads/PROJ-7-fix',
        commits: [],
      },
    });
    expect(parsed.references).toContainEqual(
      expect.objectContaining({
        kind: 'branch',
        externalId: 'PROJ-7-fix',
        status: 'ACTIVE',
      }),
    );
  });
  it('marks a deleted GitLab branch as deleted', () => {
    const parsed = parseGitWebhook({
      provider: 'gitlab',
      eventName: null,
      headers: {},
      payload: {
        object_kind: 'push',
        project: {
          path_with_namespace: 'acme/repo',
          id: 1,
          web_url: 'https://gitlab.com/acme/repo',
        },
        ref: 'refs/heads/PROJ-7-fix',
        after: '0000000000000000000000000000000000000000',
        commits: [],
      },
    });
    expect(parsed.references).toContainEqual(
      expect.objectContaining({ kind: 'branch', status: 'DELETED' }),
    );
  });
  it.each(['github', 'gitlab'] as const)(
    'preserves draft status on %s webhooks',
    (provider) => {
      const parsed = parseGitWebhook({
        provider,
        eventName: 'pull_request',
        headers: {},
        payload:
          provider === 'github'
            ? {
                pull_request: {
                  number: 1,
                  title: 'PROJ-1',
                  state: 'open',
                  draft: true,
                },
              }
            : {
                object_kind: 'merge_request',
                object_attributes: {
                  iid: 1,
                  title: 'PROJ-1',
                  state: 'opened',
                  draft: true,
                },
              },
      });
      expect(parsed.references[0]?.status).toBe('DRAFT');
    },
  );
});
