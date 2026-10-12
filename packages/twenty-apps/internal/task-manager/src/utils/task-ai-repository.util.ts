import { getConnection } from 'twenty-sdk/logic-function';
import { requireGitBaseUrl } from '../constants/git-hosts';
import { readGitApiJson } from '../logic-functions/utils/git-api.util';
import { createTaskAiBudget, requireTaskAiPath } from './task-ai-budget.util';

export type TaskAiRepository = {
  id: string;
  name: string | null;
  provider: string;
  slug: string;
  connectionId: string;
  externalId: string;
  baseUrl: string | null;
  remoteUrl: string | null;
};

type TreeEntry = { path: string; type: string; size?: number };

export const openTaskAiRepository = async (
  repository: TaskAiRepository,
  reference: string,
  budget = createTaskAiBudget(),
) => {
  const connection = await getConnection(repository.connectionId);
  const provider =
    repository.provider === 'GITHUB'
      ? 'github'
      : repository.provider === 'GITLAB'
        ? 'gitlab'
        : null;
  if (provider === null || connection.providerName !== provider)
    throw new Error(
      'The repository connection is unavailable. Reconnect it in Development.',
    );
  const baseUrl = requireGitBaseUrl(provider).replace(/\/+$/, '');
  if (
    repository.baseUrl !== null &&
    repository.baseUrl.replace(/\/+$/, '') !== baseUrl
  ) {
    throw new Error(
      'Repository host no longer matches its trusted connection configuration. Reconnect the repository in Development.',
    );
  }
  if (
    typeof repository.slug !== 'string' ||
    repository.slug.split('/').length < 2 ||
    (provider === 'github' && repository.slug.split('/').length !== 2) ||
    !repository.slug
      .split('/')
      .every(
        (part) => /^[a-z0-9_.-]+$/i.test(part) && part !== '.' && part !== '..',
      ) ||
    typeof repository.externalId !== 'string' ||
    !/^\d+$/.test(repository.externalId)
  ) {
    throw new Error(
      'Repository identity is invalid. Reconnect it in Development.',
    );
  }
  const root =
    provider === 'github'
      ? `${baseUrl}/repos/${repository.slug.split('/').map(encodeURIComponent).join('/')}`
      : `${baseUrl}/api/v4/projects/${encodeURIComponent(repository.externalId)}`;
  const read = <TData>(suffix: string) =>
    readGitApiJson<TData>({
      url: `${root}${suffix}`,
      accessToken: connection.accessToken,
      connectionId: repository.connectionId,
    });
  const remote = await read<{
    id: number;
    full_name?: string;
    path_with_namespace?: string;
    default_branch?: string;
  }>('');
  if (
    String(remote.id) !== repository.externalId ||
    (provider === 'github'
      ? remote.full_name
      : remote.path_with_namespace
    )?.toLowerCase() !== repository.slug.toLowerCase()
  ) {
    throw new Error(
      'Repository identity does not match its OAuth link. Reconnect it in Development.',
    );
  }
  if (!reference) {
    reference = remote.default_branch ?? '';
    if (!reference) throw new Error('The repository has no default branch.');
  }
  const commit =
    provider === 'github'
      ? await read<{ sha: string }>(
          `/commits/${encodeURIComponent(reference)}`,
        ).then((result) => result.sha)
      : await read<{ id: string }>(
          `/repository/commits/${encodeURIComponent(reference)}`,
        ).then((result) => result.id);
  if (!/^[a-f0-9]{40,64}$/i.test(commit))
    throw new Error('Could not resolve the repository reference.');
  const loadedFiles = new Map<string, string>();
  let tree: TreeEntry[] | null = null;
  const readTree = async () => {
    if (tree !== null) return tree;
    if (provider === 'github') {
      const result = await read<{ tree: TreeEntry[]; truncated?: boolean }>(
        `/git/trees/${commit}?recursive=1`,
      );
      if (result.truncated)
        throw new Error(
          'Repository tree is too large. Choose a smaller repository.',
        );
      tree = result.tree.filter((entry) => entry.type === 'blob');
    } else {
      const entries: TreeEntry[] = [];
      for (let page = 1; page <= 20; page++) {
        const result = await read<TreeEntry[]>(
          `/repository/tree?ref=${commit}&recursive=true&per_page=100&page=${page}`,
        );
        entries.push(...result.filter((entry) => entry.type === 'blob'));
        if (result.length < 100) {
          tree = entries;
          break;
        }
      }
      if (tree === null)
        throw new Error('Repository tree exceeds the bounded read limit.');
    }
    return tree;
  };
  const readFile = async (rawPath: string) => {
    const path = requireTaskAiPath(rawPath);
    if (loadedFiles.has(path)) return loadedFiles.get(path)!;
    const entry = (await readTree()).find(
      (candidate) => candidate.path === path,
    );
    if (!entry || (entry.size !== undefined && entry.size > 100 * 1024))
      throw new Error('File is missing or exceeds 100 KB.');
    const result =
      provider === 'github'
        ? await read<{ content: string; encoding: string; size: number }>(
            `/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${commit}`,
          )
        : await read<{ content: string; encoding: string; size: number }>(
            `/repository/files/${encodeURIComponent(path)}?ref=${commit}`,
          );
    if (result.encoding !== 'base64' || result.size > 100 * 1024)
      throw new Error('File is unavailable or exceeds 100 KB.');
    const buffer = Buffer.from(result.content, 'base64');
    if (buffer.includes(0))
      throw new Error('Binary files cannot be inspected.');
    const content = buffer.toString('utf8');
    budget.consume(`${repository.id}:${path}`, content);
    loadedFiles.set(path, content);
    return content;
  };
  return {
    commit,
    execute: async (operation: string, argument: string): Promise<string> => {
      if (operation === 'tree') {
        if (argument) requireTaskAiPath(argument);
        const paths = (await readTree())
          .filter((entry) => entry.path.startsWith(argument))
          .map((entry) => entry.path);
        return JSON.stringify({
          paths: paths.slice(0, 400),
          omitted: Math.max(0, paths.length - 400),
        });
      }
      if (operation === 'file') {
        const content = await readFile(argument);
        return JSON.stringify({
          path: argument,
          sha: commit,
          lines: content
            .split('\n')
            .map((line, index) => `${index + 1}: ${line}`)
            .join('\n'),
        });
      }
      if (operation === 'search') {
        // Models often send the bare search text instead of the JSON request.
        let request: { query?: unknown; prefix?: unknown; offset?: unknown };
        try {
          const parsed: unknown = JSON.parse(argument);
          request =
            typeof parsed === 'object' && parsed !== null
              ? parsed
              : { query: String(parsed) };
        } catch {
          request = { query: argument };
        }
        if (
          typeof request.query !== 'string' ||
          !request.query.trim() ||
          request.query.length > 200
        )
          throw new Error(
            'Search requires a literal query of 1–200 characters.',
          );
        const query = request.query;
        const prefix = typeof request.prefix === 'string' ? request.prefix : '';
        if (prefix) requireTaskAiPath(prefix);
        const offset =
          typeof request.offset === 'number' &&
          Number.isInteger(request.offset) &&
          request.offset >= 0
            ? request.offset
            : 0;
        const candidates = (await readTree()).filter(
          (entry) =>
            entry.path.startsWith(prefix) &&
            (entry.size === undefined || entry.size <= 100 * 1024),
        );
        const matches: { path: string; line: number; text: string }[] = [];
        const skipped: string[] = [];
        for (const entry of candidates.slice(offset, offset + 5)) {
          let content: string;
          try {
            content = await readFile(entry.path);
          } catch (error) {
            if (
              error instanceof Error &&
              error.message === 'Binary files cannot be inspected.'
            ) {
              skipped.push(entry.path);
              continue;
            }
            throw error;
          }
          content.split('\n').forEach((line, index) => {
            if (line.includes(query))
              matches.push({
                path: entry.path,
                line: index + 1,
                text: line.slice(0, 500),
              });
          });
        }
        return JSON.stringify({
          sha: commit,
          matches: matches.slice(0, 100),
          skipped,
          inspected: candidates
            .slice(offset, offset + 5)
            .map((entry) => entry.path),
          nextOffset: offset + 5 < candidates.length ? offset + 5 : null,
          totalFiles: candidates.length,
        });
      }
      if (operation === 'diff') {
        if (!argument || argument.length > 200)
          throw new Error('Supply a base reference.');
        const diff =
          provider === 'github'
            ? await read<{ files?: { filename: string; patch?: string }[] }>(
                `/compare/${encodeURIComponent(argument)}...${commit}`,
              ).then((result) =>
                (result.files ?? []).map((file) => ({
                  path: file.filename,
                  patch: file.patch ?? 'Patch unavailable',
                })),
              )
            : await read<{ diffs?: { new_path: string; diff: string }[] }>(
                `/repository/compare?from=${encodeURIComponent(argument)}&to=${commit}`,
              ).then((result) =>
                (result.diffs ?? []).map((file) => ({
                  path: file.new_path,
                  patch: file.diff,
                })),
              );
        for (const file of diff)
          budget.consume(`${repository.id}:${file.path}`, file.patch);
        return JSON.stringify({ sha: commit, files: diff });
      }
      throw new Error('Unsupported read operation.');
    },
  };
};
