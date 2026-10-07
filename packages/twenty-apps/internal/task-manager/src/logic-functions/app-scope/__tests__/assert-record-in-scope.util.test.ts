import { describe, expect, it, vi } from 'vitest';

import { type CallerScope } from '../../../types/caller-scope';
import { AppScopePermissionDeniedError } from '../app-scope-error';
import { assertRecordInScope } from '../assert-record-in-scope.util';

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

describe('assertRecordInScope', () => {
  it('passes when the caller holds the operation on the record app', async () => {
    const client = buildClient({
      'project-1': { id: 'project-1', appId: 'app-1' },
    });

    await expect(
      assertRecordInScope({
        client,
        scope: buildScope({ grantsByAppId: { 'app-1': ['read', 'write'] } }),
        objectNameSingular: 'project',
        recordId: 'project-1',
        operation: 'write',
      }),
    ).resolves.toBeUndefined();
  });

  it('denies the operation the caller was not granted, on an app they can read', async () => {
    const client = buildClient({
      'project-1': { id: 'project-1', appId: 'app-1' },
    });

    await expect(
      assertRecordInScope({
        client,
        scope: buildScope({ grantsByAppId: { 'app-1': ['read', 'write'] } }),
        objectNameSingular: 'project',
        recordId: 'project-1',
        operation: 'softDelete',
      }),
    ).rejects.toBeInstanceOf(AppScopePermissionDeniedError);
  });

  it('walks issueComment -> issue -> project -> app', async () => {
    const client = buildClient({
      'comment-1': { id: 'comment-1', issueId: 'issue-1' },
      'issue-1': { id: 'issue-1', projectId: 'project-1' },
      'project-1': { id: 'project-1', appId: 'app-1' },
    });

    await expect(
      assertRecordInScope({
        client,
        scope: buildScope({ grantsByAppId: { 'app-1': ['softDelete'] } }),
        objectNameSingular: 'issueComment',
        recordId: 'comment-1',
        operation: 'softDelete',
      }),
    ).resolves.toBeUndefined();
  });

  it('denies when the chain lands on an app the caller holds nothing on', async () => {
    const client = buildClient({
      'comment-1': { id: 'comment-1', issueId: 'issue-1' },
      'issue-1': { id: 'issue-1', projectId: 'project-1' },
      'project-1': { id: 'project-1', appId: 'app-2' },
    });

    await expect(
      assertRecordInScope({
        client,
        scope: buildScope({ grantsByAppId: { 'app-1': ['read', 'write'] } }),
        objectNameSingular: 'issueComment',
        recordId: 'comment-1',
        operation: 'write',
      }),
    ).rejects.toBeInstanceOf(AppScopePermissionDeniedError);
  });

  // Fail closed: a broken chain is not an unscoped record.
  it('denies when a hop is missing', async () => {
    const client = buildClient({
      'comment-1': { id: 'comment-1', issueId: 'issue-1' },
    });

    await expect(
      assertRecordInScope({
        client,
        scope: buildScope({ grantsByAppId: { 'app-1': ['read'] } }),
        objectNameSingular: 'issueComment',
        recordId: 'comment-1',
        operation: 'read',
      }),
    ).rejects.toBeInstanceOf(AppScopePermissionDeniedError);
  });

  it('scopes `app` by its own id', async () => {
    const client = buildClient({});

    await expect(
      assertRecordInScope({
        client,
        scope: buildScope({ grantsByAppId: { 'app-1': ['read'] } }),
        objectNameSingular: 'app',
        recordId: 'app-1',
        operation: 'read',
      }),
    ).resolves.toBeUndefined();
    expect(client.query).not.toHaveBeenCalled();
  });

  it('denies an unscoped object rather than letting it through', async () => {
    await expect(
      assertRecordInScope({
        client: buildClient({}),
        scope: buildScope({ grantsByAppId: { 'app-1': ['read'] } }),
        objectNameSingular: 'appAccess',
        recordId: 'grant-1',
        operation: 'read',
      }),
    ).rejects.toBeInstanceOf(AppScopePermissionDeniedError);
  });

  it('denies a missing record id', async () => {
    await expect(
      assertRecordInScope({
        client: buildClient({}),
        scope: buildScope({ grantsByAppId: { 'app-1': ['read'] } }),
        objectNameSingular: 'issue',
        recordId: undefined,
        operation: 'read',
      }),
    ).rejects.toBeInstanceOf(AppScopePermissionDeniedError);
  });

  it('is a no-op for a bypassing caller', async () => {
    const client = buildClient({});

    await expect(
      assertRecordInScope({
        client,
        scope: buildScope({ canBypassAppScope: true }),
        objectNameSingular: 'issue',
        recordId: 'issue-1',
        operation: 'destroy',
      }),
    ).resolves.toBeUndefined();
    expect(client.query).not.toHaveBeenCalled();
  });
});
