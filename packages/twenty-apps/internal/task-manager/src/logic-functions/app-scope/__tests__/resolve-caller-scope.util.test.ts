import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveCallerScope } from '../resolve-caller-scope.util';

const { queryMetadata } = vi.hoisted(() => ({ queryMetadata: vi.fn() }));

vi.mock('twenty-client-sdk/metadata', () => ({
  MetadataApiClient: class {
    query = queryMetadata;
  },
}));

const answerCurrentUser = ({
  workspaceMemberId = 'member-1',
  permissionFlags = [] as unknown,
}: {
  workspaceMemberId?: string | null;
  permissionFlags?: unknown;
} = {}) => {
  queryMetadata.mockResolvedValue({
    currentUser: {
      id: 'user-1',
      workspaceMember:
        workspaceMemberId === null ? null : { id: workspaceMemberId },
      currentUserWorkspace: { permissionFlags },
    },
  });
};

// Answers the appAccesses query from fixed pages, one per call.
const buildClient = (pages: { appId: string; permissions: string[] }[][]) => {
  let pageIndex = 0;

  return {
    query: vi.fn(async () => {
      const page = pages[pageIndex] ?? [];

      pageIndex += 1;

      return {
        appAccesses: {
          edges: page.map((node, index) => ({
            cursor: `cursor-${pageIndex}-${index}`,
            node,
          })),
        },
      };
    }),
  };
};

const buildGrantPage = (size: number, appIdPrefix: string) =>
  Array.from({ length: size }, (_unused, index) => ({
    appId: `${appIdPrefix}-${index}`,
    permissions: ['READ'],
  }));

describe('resolveCallerScope', () => {
  beforeEach(() => {
    queryMetadata.mockReset();
  });

  it('builds the caller grants from their appAccess rows', async () => {
    answerCurrentUser();
    const client = buildClient([
      [
        { appId: 'app-1', permissions: ['READ', 'WRITE'] },
        { appId: 'app-2', permissions: ['READ'] },
      ],
    ]);

    await expect(resolveCallerScope(client)).resolves.toEqual({
      workspaceMemberId: 'member-1',
      grantsByAppId: { 'app-1': ['read', 'write'], 'app-2': ['read'] },
      canBypassAppScope: false,
    });
  });

  // The regression a single capped page caused: the grants past the page
  // boundary read as a revoked grant, with nothing to chase.
  it('keeps the grants that fall past the first page', async () => {
    answerCurrentUser();
    const client = buildClient([
      buildGrantPage(200, 'first'),
      [{ appId: 'last-app', permissions: ['WRITE'] }],
    ]);

    const scope = await resolveCallerScope(client);

    expect(client.query).toHaveBeenCalledTimes(2);
    expect(Object.keys(scope.grantsByAppId)).toHaveLength(201);
    expect(scope.grantsByAppId['last-app']).toEqual(['write']);
  });

  it('bypasses app-scope for a machine caller and never reads grants', async () => {
    answerCurrentUser({ workspaceMemberId: null });
    const client = buildClient([]);

    await expect(resolveCallerScope(client)).resolves.toEqual({
      workspaceMemberId: null,
      grantsByAppId: {},
      canBypassAppScope: true,
    });
    expect(client.query).not.toHaveBeenCalled();
  });

  it.each(['WORKSPACE', 'ROLES'])(
    'bypasses app-scope for a caller holding %s',
    async (permissionFlag) => {
      answerCurrentUser({ permissionFlags: [permissionFlag] });

      const scope = await resolveCallerScope(buildClient([[]]));

      expect(scope.canBypassAppScope).toBe(true);
    },
  );

  it('does not bypass app-scope for an unrelated settings flag', async () => {
    answerCurrentUser({ permissionFlags: ['DATA_MODEL', 'WORKSPACE_MEMBERS'] });

    const scope = await resolveCallerScope(buildClient([[]]));

    expect(scope.canBypassAppScope).toBe(false);
  });

  it('treats absent permission flags as none rather than failing', async () => {
    answerCurrentUser({ permissionFlags: undefined });

    await expect(resolveCallerScope(buildClient([[]]))).resolves.toMatchObject({
      canBypassAppScope: false,
    });
  });
});
