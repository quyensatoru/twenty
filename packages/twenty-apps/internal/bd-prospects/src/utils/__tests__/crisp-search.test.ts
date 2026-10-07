import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  buildCrispConversationUrl,
  pickCrispConversation,
  resolveCrispMatches,
  searchCrispConversations,
  type CrispConversation,
} from '../crisp-search';

const conversation = (
  overrides: Partial<CrispConversation> = {},
): CrispConversation => ({
  sessionId: 'session_1',
  email: null,
  nickname: null,
  ...overrides,
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('buildCrispConversationUrl', () => {
  it('points at the inbox conversation', () => {
    expect(
      buildCrispConversationUrl({
        websiteId: 'website-1',
        sessionId: 'session_1',
      }),
    ).toBe('https://app.crisp.chat/website/website-1/inbox/session_1/');
  });
});

describe('pickCrispConversation', () => {
  it('prefers the visitor email living on the shop domain', () => {
    const picked = pickCrispConversation({
      conversations: [
        conversation({ sessionId: 'session_other', email: 'hi@other.com' }),
        conversation({ sessionId: 'session_hit', email: 'Lan@ShopABC.com' }),
      ],
      domain: 'shopabc.com',
    });

    expect(picked?.sessionId).toBe('session_hit');
  });

  it('falls back to the nickname carrying the brand', () => {
    const picked = pickCrispConversation({
      conversations: [
        conversation({ sessionId: 'session_1', nickname: 'Visitor' }),
        conversation({ sessionId: 'session_2', nickname: 'Lan from ShopABC' }),
      ],
      domain: 'shopabc.com',
    });

    expect(picked?.sessionId).toBe('session_2');
  });

  it('uses the shop name over the domain brand', () => {
    const picked = pickCrispConversation({
      conversations: [
        conversation({ sessionId: 'session_1', nickname: 'Cool Store Team' }),
      ],
      domain: 'abc123.myshopify.com',
      shopName: 'Cool Store',
    });

    expect(picked?.sessionId).toBe('session_1');
  });

  it('returns nothing without name evidence', () => {
    expect(
      pickCrispConversation({
        conversations: [
          conversation({ sessionId: 'session_1', nickname: 'Visitor' }),
          conversation({
            sessionId: 'session_2',
            email: 'stranger@stranger.com',
          }),
        ],
        domain: 'shopabc.com',
      }),
    ).toBeUndefined();
  });

  it('ignores rows without a session and an empty domain', () => {
    expect(
      pickCrispConversation({
        conversations: [conversation({ sessionId: '' })],
        domain: 'shopabc.com',
      }),
    ).toBeUndefined();
    expect(
      pickCrispConversation({ conversations: [conversation()], domain: ' ' }),
    ).toBeUndefined();
  });
});

describe('searchCrispConversations', () => {
  it('sends a Basic-auth text search and maps the rows', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          {
            session_id: 'session_1',
            meta: { email: 'lan@shopabc.com', nickname: 'Lan' },
          },
          { session_id: '', meta: {} },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const found = await searchCrispConversations({
      workspace: {
        identifier: 'id-1',
        key: 'key-1',
        websiteId: 'website-1',
      },
      domain: 'shopabc.com',
    });

    expect(found).toEqual([
      { sessionId: 'session_1', email: 'lan@shopabc.com', nickname: 'Lan' },
    ]);

    const [calledUrl, calledInit] = fetchMock.mock.calls[0] as [
      string,
      { headers: Record<string, string> },
    ];
    expect(calledUrl).toContain(
      '/website/website-1/conversations/1?search_query=shopabc.com',
    );
    expect(calledInit.headers.Authorization).toBe(
      `Basic ${Buffer.from('id-1:key-1').toString('base64')}`,
    );
    expect(calledInit.headers['X-Crisp-Tier']).toBe('plugin');
  });

  it('retries with the user tier when the plugin tier is rejected', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 401 })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [{ session_id: 'session_1', meta: {} }] }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const found = await searchCrispConversations({
      workspace: { identifier: 'id-1', key: 'key-1', websiteId: 'website-1' },
      domain: 'shopabc.com',
    });

    expect(found.map((row) => row.sessionId)).toEqual(['session_1']);

    const tiers = fetchMock.mock.calls.map(
      ([, init]) =>
        (init as { headers: Record<string, string> }).headers['X-Crisp-Tier'],
    );
    expect(tiers).toEqual(['plugin', 'user']);
  });

  it('surfaces auth failures with the status and website', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 401 });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      searchCrispConversations({
        workspace: { identifier: 'bad', key: 'bad', websiteId: 'website-1' },
        domain: 'shopabc.com',
      }),
    ).rejects.toThrow(/website-1: HTTP 401/);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

const okResponse = (data: unknown[]) => ({
  ok: true,
  status: 200,
  json: async () => ({ data }),
});

const bloy = {
  appKey: 'BLOY',
  workspace: { identifier: 'id-1', key: 'key-1', websiteId: 'website-bloy' },
};
const mida = {
  appKey: 'MIDA',
  workspace: { identifier: 'id-2', key: 'key-2', websiteId: 'website-mida' },
};

describe('resolveCrispMatches', () => {
  it('links one conversation per app from its own website', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          okResponse([
            {
              session_id: 'session_1',
              meta: { email: 'lan@shopabc.com', nickname: 'Lan' },
            },
          ]),
        )
        .mockResolvedValueOnce(
          okResponse([
            { session_id: 'session_2', meta: { nickname: 'ShopABC' } },
          ]),
        ),
    );

    await expect(
      resolveCrispMatches({
        workspaces: [bloy, mida],
        domain: 'shopabc.com',
      }),
    ).resolves.toEqual({
      matches: [
        {
          appKey: 'BLOY',
          sessionId: 'session_1',
          email: 'lan@shopabc.com',
          nickname: 'Lan',
          url: 'https://app.crisp.chat/website/website-bloy/inbox/session_1/',
        },
        {
          appKey: 'MIDA',
          sessionId: 'session_2',
          email: null,
          nickname: 'ShopABC',
          url: 'https://app.crisp.chat/website/website-mida/inbox/session_2/',
        },
      ],
      blockedAppKeys: [],
    });
  });

  it('resolves to no match when every website misses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse([])));

    await expect(
      resolveCrispMatches({
        workspaces: [bloy, mida],
        domain: 'quiet-shop.com',
      }),
    ).resolves.toEqual({ matches: [], blockedAppKeys: [] });
  });

  it('keeps going past a website that rejects its credentials and stops calling it', async () => {
    const fetchMock = vi.fn((url: string) =>
      Promise.resolve(
        url.includes('website-bloy')
          ? { ok: false, status: 401 }
          : okResponse([
              { session_id: 'session_2', meta: { nickname: 'ShopABC' } },
            ]),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const brokenWebsiteIds = new Set<string>();
    const failedApps: string[] = [];

    const first = await resolveCrispMatches({
      workspaces: [bloy, mida],
      domain: 'shopabc.com',
      brokenWebsiteIds,
      onAuthFailure: (appKey) => failedApps.push(appKey),
    });

    expect(first.blockedAppKeys).toEqual(['BLOY']);
    expect(first.matches.map((match) => match.appKey)).toEqual(['MIDA']);
    expect(failedApps).toEqual(['BLOY']);

    const callsAfterFirst = fetchMock.mock.calls.length;
    const second = await resolveCrispMatches({
      workspaces: [bloy],
      domain: 'other-shop.com',
      brokenWebsiteIds,
    });

    expect(second).toEqual({ matches: [], blockedAppKeys: ['BLOY'] });
    expect(fetchMock.mock.calls.length).toBe(callsAfterFirst);
  });
});
