import { describe, expect, it, vi } from 'vitest';

import { type CallerScope } from '../../../types/caller-scope';
import { AppScopePermissionDeniedError } from '../app-scope-error';
import { assertRelationTargetAppScope } from '../assert-relation-target-app-scope.util';

const scope: CallerScope = {
  workspaceMemberId: 'member-1',
  grantsByAppId: { 'app-1': ['read', 'write'] },
  canBypassAppScope: false,
};

const buildClient = ({
  rows = {},
  appAccessRows = [],
}: {
  rows?: Record<string, Record<string, unknown>>;
  appAccessRows?: { memberId: string; appId: string }[];
}) => ({
  query: vi.fn(async (selection: Record<string, any>) => {
    const [pluralName] = Object.keys(selection);
    const filter = selection[pluralName].__args.filter;

    if (pluralName === 'appAccesses') {
      const matches = appAccessRows.filter(
        (row) =>
          row.memberId === filter.memberId.eq && row.appId === filter.appId.eq,
      );

      return {
        appAccesses: { edges: matches.map((row) => ({ node: { id: 'x', ...row } })) },
      };
    }

    const node = rows[filter.id.eq];

    return { [pluralName]: { edges: node === undefined ? [] : [{ node }] } };
  }),
});

describe('assertRelationTargetAppScope', () => {
  it('accepts a member who holds a grant on the same app', async () => {
    const client = buildClient({
      rows: { 'project-1': { id: 'project-1', appId: 'app-1' } },
      appAccessRows: [{ memberId: 'member-2', appId: 'app-1' }],
    });

    await expect(
      assertRelationTargetAppScope({
        client,
        scope,
        objectNameSingular: 'issue',
        projectId: 'project-1',
        targets: [
          {
            fieldName: 'assigneeId',
            kind: 'workspaceMember',
            targetId: 'member-2',
          },
        ],
      }),
    ).resolves.toBeUndefined();
  });

  it('refuses a member with no grant on that app', async () => {
    const client = buildClient({
      rows: { 'project-1': { id: 'project-1', appId: 'app-1' } },
      appAccessRows: [],
    });

    await expect(
      assertRelationTargetAppScope({
        client,
        scope,
        objectNameSingular: 'issue',
        projectId: 'project-1',
        targets: [
          {
            fieldName: 'assigneeId',
            kind: 'workspaceMember',
            targetId: 'member-2',
          },
        ],
      }),
    ).rejects.toBeInstanceOf(AppScopePermissionDeniedError);
  });

  it('accepts a merchant of the same app and refuses one of another', async () => {
    const client = buildClient({
      rows: {
        'project-1': { id: 'project-1', appId: 'app-1' },
        'merchant-ok': { id: 'merchant-ok', appId: 'app-1' },
        'merchant-other': { id: 'merchant-other', appId: 'app-2' },
      },
    });

    await expect(
      assertRelationTargetAppScope({
        client,
        scope,
        objectNameSingular: 'issue',
        projectId: 'project-1',
        targets: [
          { fieldName: 'merchantIds', kind: 'merchant', targetId: 'merchant-ok' },
        ],
      }),
    ).resolves.toBeUndefined();

    await expect(
      assertRelationTargetAppScope({
        client,
        scope,
        objectNameSingular: 'issue',
        projectId: 'project-1',
        targets: [
          {
            fieldName: 'merchantIds',
            kind: 'merchant',
            targetId: 'merchant-other',
          },
        ],
      }),
    ).rejects.toBeInstanceOf(AppScopePermissionDeniedError);
  });

  // Same default-deny as the write guard: an unresolvable app is not a pass.
  it('refuses when the project has no app', async () => {
    const client = buildClient({
      rows: { 'project-1': { id: 'project-1', appId: null } },
    });

    await expect(
      assertRelationTargetAppScope({
        client,
        scope,
        objectNameSingular: 'issue',
        projectId: 'project-1',
        targets: [
          { fieldName: 'assigneeId', kind: 'workspaceMember', targetId: 'm' },
        ],
      }),
    ).rejects.toBeInstanceOf(AppScopePermissionDeniedError);
  });

  it('does nothing when there is no target to check', async () => {
    const client = buildClient({});

    await expect(
      assertRelationTargetAppScope({
        client,
        scope,
        objectNameSingular: 'issue',
        projectId: 'project-1',
        targets: [],
      }),
    ).resolves.toBeUndefined();
    expect(client.query).not.toHaveBeenCalled();
  });
});
