import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  buildCrispConversationUrl,
  pickCrispConversation,
  resolveCrispMatch,
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

  it('surfaces auth failures with the status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 401 }),
    );

    await expect(
      searchCrispConversations({
        workspace: { identifier: 'bad', key: 'bad', websiteId: 'website-1' },
        domain: 'shopabc.com',
      }),
    ).rejects.toThrow(/HTTP 401/);
  });
});

describe('resolveCrispMatch', () => {
  it('links the picked conversation', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            {
              session_id: 'session_9',
              meta: { email: 'lan@shopabc.com', nickname: 'Lan' },
            },
          ],
        }),
      }),
    );

    await expect(
      resolveCrispMatch({
        workspaces: [
          { identifier: 'id-1', key: 'key-1', websiteId: 'website-1' },
        ],
        domain: 'shopabc.com',
      }),
    ).resolves.toEqual({
      sessionId: 'session_9',
      email: 'lan@shopabc.com',
      nickname: 'Lan',
      url: 'https://app.crisp.chat/website/website-1/inbox/session_9/',
    });
  });

  it('tries the next website when the first misses', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            {
              session_id: 'session_2',
              meta: { email: null, nickname: 'ShopABC' },
            },
          ],
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      resolveCrispMatch({
        workspaces: [
          { identifier: 'id-1', key: 'key-1', websiteId: 'website-bloy' },
          { identifier: 'id-2', key: 'key-2', websiteId: 'website-mida' },
        ],
        domain: 'shopabc.com',
      }),
    ).resolves.toMatchObject({
      sessionId: 'session_2',
      url: 'https://app.crisp.chat/website/website-mida/inbox/session_2/',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('resolves to nothing when every website misses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: [] }),
      }),
    );

    await expect(
      resolveCrispMatch({
        workspaces: [
          { identifier: 'id-1', key: 'key-1', websiteId: 'website-1' },
          { identifier: 'id-2', key: 'key-2', websiteId: 'website-2' },
        ],
        domain: 'quiet-shop.com',
      }),
    ).resolves.toBeUndefined();
  });
});
