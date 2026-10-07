import { describe, expect, it, vi } from 'vitest';

import { type CallerScope } from '../../../types/caller-scope';
import { AppScopePermissionDeniedError } from '../app-scope-error';
import { assertAppScopeWriteAccess } from '../assert-app-scope-write-access.util';

const buildScope = (overrides: Partial<CallerScope> = {}): CallerScope => ({
  workspaceMemberId: 'member-1',
  grantsByAppId: {},
  canBypassAppScope: false,
  canManageViews: false,
  ...overrides,
});

// Answers `fetchRecordColumn`-shaped queries out of a fixture graph.
const buildClient = (rows: Record<string, Record<string, unknown>>) => ({
  query: vi.fn(async (selection: Record<string, any>) => {
    const [pluralName] = Object.keys(selection);
    const id = selection[pluralName].__args.filter.id.eq;
    const node = rows[id];

    return {
      [pluralName]: { edges: node === undefined ? [] : [{ node }] },
    };
  }),
});

describe('assertAppScopeWriteAccess', () => {
  it('passes when the caller holds write on the project app', async () => {
    const client = buildClient({});

    await expect(
      assertAppScopeWriteAccess({
        client,
        scope: buildScope({ grantsByAppId: { 'app-1': ['read', 'write'] } }),
        objectNameSingular: 'project',
        foreignKeyValue: 'app-1',
      }),
    ).resolves.toBeUndefined();
  });

  it('denies when the caller only holds read', async () => {
    await expect(
      assertAppScopeWriteAccess({
        client: buildClient({}),
        scope: buildScope({ grantsByAppId: { 'app-1': ['read'] } }),
        objectNameSingular: 'project',
        foreignKeyValue: 'app-1',
      }),
    ).rejects.toBeInstanceOf(AppScopePermissionDeniedError);
  });

  it('walks issue -> project -> app for a two-hop object', async () => {
    const client = buildClient({
      'issue-1': { id: 'issue-1', projectId: 'project-1' },
      'project-1': { id: 'project-1', appId: 'app-1' },
    });

    await expect(
      assertAppScopeWriteAccess({
        client,
        scope: buildScope({ grantsByAppId: { 'app-1': ['write'] } }),
        objectNameSingular: 'issueComment',
        foreignKeyValue: 'issue-1',
      }),
    ).resolves.toBeUndefined();
  });

  it('denies when the chain reaches an app the caller has no grant on', async () => {
    const client = buildClient({
      'issue-1': { id: 'issue-1', projectId: 'project-1' },
      'project-1': { id: 'project-1', appId: 'app-2' },
    });

    await expect(
      assertAppScopeWriteAccess({
        client,
        scope: buildScope({ grantsByAppId: { 'app-1': ['write'] } }),
        objectNameSingular: 'worklog',
        foreignKeyValue: 'issue-1',
      }),
    ).rejects.toBeInstanceOf(AppScopePermissionDeniedError);
  });

  // Fail closed: a project with no app must not become writable by everyone.
  it('denies when the chain resolves to no app at all', async () => {
    const client = buildClient({
      'issue-1': { id: 'issue-1', projectId: 'project-1' },
      'project-1': { id: 'project-1', appId: null },
    });

    await expect(
      assertAppScopeWriteAccess({
        client,
        scope: buildScope({ grantsByAppId: { 'app-1': ['write'] } }),
        objectNameSingular: 'issue',
        foreignKeyValue: 'project-1',
      }),
    ).rejects.toBeInstanceOf(AppScopePermissionDeniedError);
  });

  it('is a no-op for a bypassing caller', async () => {
    const client = buildClient({});

    await expect(
      assertAppScopeWriteAccess({
        client,
        scope: buildScope({ canBypassAppScope: true }),
        objectNameSingular: 'issue',
        foreignKeyValue: 'project-1',
      }),
    ).resolves.toBeUndefined();
    expect(client.query).not.toHaveBeenCalled();
  });

  it('is a no-op when the foreign key is absent', async () => {
    await expect(
      assertAppScopeWriteAccess({
        client: buildClient({}),
        scope: buildScope(),
        objectNameSingular: 'project',
        foreignKeyValue: undefined,
      }),
    ).resolves.toBeUndefined();
  });

  it('leaves appAccess unguarded', async () => {
    await expect(
      assertAppScopeWriteAccess({
        client: buildClient({}),
        scope: buildScope(),
        objectNameSingular: 'appAccess',
        foreignKeyValue: 'app-1',
      }),
    ).resolves.toBeUndefined();
  });
});
