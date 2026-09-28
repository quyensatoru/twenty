import { describe, expect, it, vi } from 'vitest';

import { type CallerScope } from '../../../types/caller-scope';
import { buildProjectScopeFilter } from '../build-project-scope-filter.util';
import { listVisibleProjectIds } from '../list-visible-project-ids.util';

const buildClient = (projectIdsByAppId: Record<string, string[]>) => ({
  query: vi.fn(async (selection: Record<string, any>) => {
    const grantedAppIds: string[] = selection.projects.__args.filter.appId.in;
    const edges = grantedAppIds
      .flatMap((appId) => projectIdsByAppId[appId] ?? [])
      .map((id) => ({ cursor: id, node: { id } }));

    return { projects: { edges } };
  }),
});

describe('listVisibleProjectIds', () => {
  it('returns null — meaning unrestricted — for a bypassing caller', async () => {
    const client = buildClient({});

    await expect(
      listVisibleProjectIds({
        client,
        scope: {
          workspaceMemberId: null,
          grantsByAppId: {},
          canBypassAppScope: true,
        },
        operation: 'read',
      }),
    ).resolves.toBeNull();
    expect(client.query).not.toHaveBeenCalled();
  });

  // Fail closed: no grant means no project, never "every project".
  it('returns an empty set when nothing is granted', async () => {
    await expect(
      listVisibleProjectIds({
        client: buildClient({ 'app-1': ['project-1'] }),
        scope: {
          workspaceMemberId: 'member-1',
          grantsByAppId: {},
          canBypassAppScope: false,
        },
        operation: 'read',
      }),
    ).resolves.toEqual([]);
  });

  it('only counts grants carrying the requested operation', async () => {
    const scope: CallerScope = {
      workspaceMemberId: 'member-1',
      grantsByAppId: { 'app-1': ['read'], 'app-2': ['read', 'write'] },
      canBypassAppScope: false,
    };
    const client = buildClient({
      'app-1': ['project-1'],
      'app-2': ['project-2'],
    });

    await expect(
      listVisibleProjectIds({ client, scope, operation: 'read' }),
    ).resolves.toEqual(['project-1', 'project-2']);
    await expect(
      listVisibleProjectIds({ client, scope, operation: 'write' }),
    ).resolves.toEqual(['project-2']);
  });
});

describe('buildProjectScopeFilter', () => {
  it('contributes nothing for an unrestricted caller', () => {
    expect(buildProjectScopeFilter(null)).toEqual({});
  });

  it('produces an impossible filter rather than none when nothing is visible', () => {
    expect(buildProjectScopeFilter([])).toEqual({ projectId: { in: [] } });
  });

  it('can narrow a different field, for querying projects themselves', () => {
    expect(buildProjectScopeFilter(['project-1'], 'id')).toEqual({
      id: { in: ['project-1'] },
    });
  });
});
