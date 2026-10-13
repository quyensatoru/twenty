import { beforeEach, describe, expect, it, vi } from 'vitest';
const runtime = vi.hoisted(() => ({ read: vi.fn(), connection: vi.fn() }));
vi.mock('twenty-sdk/logic-function', () => ({
  getConnection: runtime.connection,
}));
vi.mock('../../logic-functions/utils/git-api.util', () => ({
  readGitApiJson: runtime.read,
}));
import { createTaskAiBudget } from '../task-ai-budget.util';
import {
  openTaskAiRepository,
  type TaskAiRepository,
} from '../task-ai-repository.util';
const repository: TaskAiRepository = {
  id: 'repository-a',
  name: 'Example',
  provider: 'GITHUB',
  slug: 'org/repo',
  connectionId: 'connection-a',
  externalId: '12',
  baseUrl: 'https://api.github.com',
  remoteUrl: 'https://github.com/org/repo',
};
const commit = 'a'.repeat(40);
beforeEach(() => {
  vi.clearAllMocks();
  runtime.connection.mockResolvedValue({
    providerName: 'github',
    accessToken: 'server-only-token',
  });
  runtime.read.mockImplementation(async ({ url }: { url: string }) => {
    if (url.endsWith('/repos/org/repo'))
      return { id: 12, full_name: 'org/repo', default_branch: 'main' };
    if (url.includes('/commits/')) return { sha: commit };
    if (url.includes('/git/trees/'))
      return {
        tree: [{ path: 'src/a.ts', type: 'blob', size: 12 }],
        truncated: false,
      };
    return {
      content: Buffer.from('const foo = 1;').toString('base64'),
      encoding: 'base64',
      size: 14,
    };
  });
});
describe('bounded repository reader', () => {
  it('counts the same file path in different repositories against the shared file limit', async () => {
    const budget = createTaskAiBudget();
    for (let index = 0; index < 19; index++)
      budget.consume(`existing:${index}`, 'code');
    const first = await openTaskAiRepository(repository, 'main', budget);
    const second = await openTaskAiRepository(
      { ...repository, id: 'repository-b' },
      'main',
      budget,
    );
    await first.execute('file', 'src/a.ts');
    await expect(second.execute('file', 'src/a.ts')).rejects.toThrow(
      '20 files',
    );
  });
  it('uses the resolved SHA for file reads and omits credentials from results', async () => {
    const reader = await openTaskAiRepository(repository, 'main');
    const output = await reader.execute('file', 'src/a.ts');
    expect(JSON.parse(output)).toMatchObject({
      sha: commit,
      path: 'src/a.ts',
      lines: '1: const foo = 1;',
    });
    expect(output).not.toContain('server-only-token');
    expect(
      runtime.read.mock.calls[runtime.read.mock.calls.length - 1]?.[0].url,
    ).toContain(`?ref=${commit}`);
  });
  it('searches literal code on the pinned snapshot with bounded pagination', async () => {
    const reader = await openTaskAiRepository(repository, 'main');
    const result = JSON.parse(
      await reader.execute(
        'search',
        JSON.stringify({ query: 'foo', prefix: 'src/', offset: 0 }),
      ),
    );
    expect(result).toMatchObject({
      sha: commit,
      matches: [{ path: 'src/a.ts', line: 1, text: 'const foo = 1;' }],
      nextOffset: null,
    });
  });
  it('searches with the bare text when the model skips the JSON request', async () => {
    const reader = await openTaskAiRepository(repository, 'main');
    const result = JSON.parse(await reader.execute('search', 'foo'));
    expect(result).toMatchObject({
      matches: [{ path: 'src/a.ts', line: 1, text: 'const foo = 1;' }],
    });
  });
  it('lists paths containing a guessed directory name when no path starts with it', async () => {
    const reader = await openTaskAiRepository(repository, 'main');
    const result = JSON.parse(await reader.execute('tree', 'a.ts'));
    expect(result).toMatchObject({
      note: expect.stringContaining('No path starts with'),
      paths: ['src/a.ts'],
      topLevelDirectories: ['src'],
    });
  });
  it('refuses a different connection provider before making git requests', async () => {
    runtime.connection.mockResolvedValue({
      providerName: 'gitlab',
      accessToken: 'secret',
    });
    await expect(openTaskAiRepository(repository, 'main')).rejects.toThrow(
      'connection',
    );
    expect(runtime.read).not.toHaveBeenCalled();
  });
  it('rejects write operations and traversal before file requests', async () => {
    const reader = await openTaskAiRepository(repository, 'main');
    await expect(reader.execute('write', 'src/a.ts')).rejects.toThrow(
      'Unsupported',
    );
    await expect(reader.execute('file', '../secret')).rejects.toThrow(
      'traversal',
    );
    expect(runtime.read.mock.calls).toHaveLength(2);
  });
});

describe('OAuth repository host and default reference', () => {
  it('refuses mutable attacker hosts before any credential-bearing fetch', async () => {
    await expect(
      openTaskAiRepository(
        { ...repository, baseUrl: 'https://attacker.example' },
        'main',
      ),
    ).rejects.toThrow('trusted');
    expect(runtime.read).not.toHaveBeenCalled();
  });
  it('resolves an empty reference through the actual provider default branch', async () => {
    await openTaskAiRepository(repository, '');
    expect(runtime.read.mock.calls[1][0].url).toContain('/commits/main');
  });
  it('checks remote repository identity before requesting code', async () => {
    runtime.read.mockResolvedValue({
      id: 999,
      full_name: 'org/repo',
      default_branch: 'main',
    });
    await expect(openTaskAiRepository(repository, 'main')).rejects.toThrow(
      'identity',
    );
    expect(runtime.read.mock.calls).toHaveLength(1);
  });
  it('uses the GitLab default branch rather than assuming HEAD', async () => {
    runtime.connection.mockResolvedValue({
      providerName: 'gitlab',
      accessToken: 'server-token',
    });
    runtime.read.mockImplementation(async ({ url }: { url: string }) =>
      url.endsWith('/projects/12')
        ? {
            id: 12,
            path_with_namespace: 'org/repo',
            default_branch: 'development',
          }
        : { id: commit },
    );
    await openTaskAiRepository(
      { ...repository, provider: 'GITLAB', baseUrl: 'https://gitlab.com' },
      '',
    );
    expect(runtime.read.mock.calls[1][0].url).toContain(
      '/repository/commits/development',
    );
  });
});

describe('configured enterprise hosts', () => {
  it('accepts the configured GitHub enterprise API host', async () => {
    vi.stubEnv('GITHUB_BASE_URL', 'https://git.example.com');
    try {
      await openTaskAiRepository(
        { ...repository, baseUrl: 'https://git.example.com/api/v3' },
        'main',
      );
      expect(runtime.read.mock.calls[0][0].url).toBe(
        'https://git.example.com/api/v3/repos/org/repo',
      );
    } finally {
      vi.unstubAllEnvs();
    }
  });
  it('preserves GitLab subgroup repository identities', async () => {
    runtime.connection.mockResolvedValue({
      providerName: 'gitlab',
      accessToken: 'server-token',
    });
    runtime.read.mockImplementation(async ({ url }: { url: string }) =>
      url.endsWith('/projects/12')
        ? {
            id: 12,
            path_with_namespace: 'org/group/repo',
            default_branch: 'main',
          }
        : { id: commit },
    );
    await expect(
      openTaskAiRepository(
        {
          ...repository,
          provider: 'GITLAB',
          slug: 'org/group/repo',
          baseUrl: 'https://gitlab.com',
        },
        '',
      ),
    ).resolves.toMatchObject({ commit });
  });
  it('matches GitLab paths with uppercase groups against the stored lowercase slug', async () => {
    runtime.connection.mockResolvedValue({
      providerName: 'gitlab',
      accessToken: 'server-token',
    });
    runtime.read.mockImplementation(async ({ url }: { url: string }) =>
      url.endsWith('/projects/12')
        ? {
            id: 12,
            path_with_namespace: 'org/GROUP/repo',
            default_branch: 'main',
          }
        : { id: commit },
    );
    await expect(
      openTaskAiRepository(
        {
          ...repository,
          provider: 'GITLAB',
          slug: 'org/group/repo',
          baseUrl: 'https://gitlab.com',
        },
        '',
      ),
    ).resolves.toMatchObject({ commit });
  });
});
