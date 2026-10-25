import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('twenty-client-sdk/metadata', () => ({
  MetadataApiClient: class {
    query = async () => ({
      getPageLayouts: [
        { id: 'other-page', universalIdentifier: 'other-layout' },
        {
          id: 'inbox-page',
          universalIdentifier: 'b996993c-8898-41b1-adaf-927c6e470f5a',
        },
      ],
    });
  },
}));

import {
  syncCrispConversations,
  refreshProspectOnConversationChanged,
  refreshProspectOnMerchantChanged,
} from '../../logic-functions/sync-crisp-conversations';
import { resetRequestPacing } from '../rate-limiter';

type Selection = Record<
  string,
  {
    __args?: {
      filter?: Record<string, unknown>;
      after?: string;
      first?: number;
      id?: string;
      data?: Record<string, unknown>;
    };
  }
>;

type Conversation = {
  id: string;
  visitorName: string | null;
  visitorEmail: string | null;
  appName: string | null;
  merchantId: string | null;
};

const makeClient = (
  conversations: Conversation[],
  merchantIds = ['merchant-1'],
) => {
  const prospect = {
    id: 'prospect-1',
    domain: 'shop.myshopify.com',
    shopName: 'Shop',
    ourApps: ['MIDA'],
    crispChat: { primaryLinkUrl: 'https://app.crisp.chat/old-session' },
    crispEmail: { primaryEmail: 'old@example.com' },
  };
  const displayedFields = new Map<string, Record<string, unknown>>([
    ['prospect-1', { ...prospect }],
    ['prospect-2', { ...prospect, id: 'prospect-2' }],
  ]);
  const merchantProspectIds = new Map(
    merchantIds.map((id) => [id, 'prospect-1']),
  );
  const pages = new Map<string, Conversation[]>();

  const client = {
    query: async (request: Record<string, unknown>) => {
      const selection = request as Selection;
      if (selection.prospects) {
        const argumentsValue = selection.prospects.__args;
        const filter = argumentsValue?.filter as
          { id?: { eq: string } } | undefined;
        const allRows = [prospect, { ...prospect, id: 'prospect-2' }].map(
          (node, index) => ({ node, cursor: `prospect-cursor-${index + 1}` }),
        );
        const filtered = allRows.filter(
          ({ node }) => !filter?.id || node.id === filter.id.eq,
        );
        const afterIndex =
          argumentsValue?.after === undefined
            ? -1
            : filtered.findIndex(
                ({ cursor }) => cursor === argumentsValue.after,
              );
        const remaining = filtered.slice(afterIndex + 1);
        const rows = remaining.slice(0, argumentsValue?.first);
        return {
          prospects: {
            edges: rows,
            pageInfo: {
              hasNextPage: remaining.length > rows.length,
              endCursor: rows[rows.length - 1]?.cursor ?? null,
            },
          },
        };
      }
      if (selection.merchants) {
        const filter = selection.merchants.__args?.filter as {
          id?: { in: string[] };
          prospectId?: { eq: string };
        };
        const rows = [...merchantProspectIds].filter(([id, prospectId]) =>
          filter.id
            ? filter.id.in.includes(id)
            : prospectId === filter.prospectId?.eq,
        );
        return {
          merchants: {
            edges: rows.map(([id, prospectId]) => ({
              node: { id, prospectId },
            })),
            pageInfo: { hasNextPage: false },
          },
        };
      }
      if (selection.crispConversations) {
        const filter = selection.crispConversations.__args?.filter as {
          merchantId: { in: string[] };
        };
        const after = selection.crispConversations.__args?.after;
        const rows = (
          after === undefined ? conversations : (pages.get(after) ?? [])
        ).filter(
          (row) =>
            row.merchantId !== null &&
            filter.merchantId.in.includes(row.merchantId),
        );
        const hasNextPage = after === undefined && pages.size > 0;
        return {
          crispConversations: {
            edges: rows.map((node) => ({ node })),
            pageInfo: { hasNextPage, endCursor: hasNextPage ? 'next' : null },
          },
        };
      }
      throw new Error('Unexpected query');
    },
    mutation: async (request: Record<string, unknown>) => {
      const selection = request as Selection;
      const prospectId = selection.updateProspect.__args?.id as string;
      displayedFields.set(prospectId, {
        ...displayedFields.get(prospectId),
        ...Object.fromEntries(
          Object.entries(selection.updateProspect.__args?.data ?? {}).filter(
            ([, value]) => value !== null,
          ),
        ),
      });
      return { updateProspect: { id: 'prospect-1' } };
    },
  };
  return {
    client,
    pages,
    merchantProspectIds,
    readFields: (prospectId = 'prospect-1') => displayedFields.get(prospectId)!,
  };
};

const conversation = (overrides: Partial<Conversation> = {}): Conversation => ({
  id: 'conversation-1',
  visitorName: 'Customer',
  visitorEmail: 'pic@example.com',
  appName: 'MIDA',
  merchantId: 'merchant-1',
  ...overrides,
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubEnv('TWENTY_API_URL', 'https://api.example.com/');
  vi.stubEnv('RECORD_PAGE_BASE_URL', 'https://crm.example.com/');
  vi.stubEnv('TWENTY_APP_APPLICATION_ACCESS_TOKEN', 'test-token');
  resetRequestPacing();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  resetRequestPacing();
});

const sync = async (client: ReturnType<typeof makeClient>['client']) => {
  const result = syncCrispConversations({ client, prospectId: 'prospect-1' });
  await vi.runAllTimersAsync();
  return result;
};

describe('BD conversation columns', () => {
  it('uses the API origin when the frontend shares its origin and no override is configured', async () => {
    vi.stubEnv('RECORD_PAGE_BASE_URL', '');
    const { client, readFields } = makeClient([conversation()]);
    await sync(client);
    expect(readFields().crispChat).toMatchObject({
      primaryLinkUrl:
        'https://api.example.com/page/inbox-page#conversation-conversation-1',
    });
  });

  it('opens the stored CRM conversation and gets Email PIC from its visitor email', async () => {
    const { client, readFields } = makeClient([conversation()]);
    await sync(client);
    expect(readFields().crispChat).toEqual({
      primaryLinkUrl:
        'https://crm.example.com/page/inbox-page#conversation-conversation-1',
      primaryLinkLabel: 'MIDA: Customer',
      secondaryLinks: [],
    });
    expect(readFields().crispEmail).toEqual({
      primaryEmail: 'pic@example.com',
      additionalEmails: [],
    });
  });

  it('includes conversations from every linked merchant and deduplicates visitor emails', async () => {
    const { client, readFields } = makeClient(
      [
        conversation(),
        conversation({
          id: 'conversation-2',
          merchantId: 'merchant-2',
          appName: 'BLOY',
          visitorEmail: ' PIC@example.com ',
        }),
        conversation({
          id: 'conversation-3',
          merchantId: 'merchant-2',
          visitorEmail: 'other@example.com',
        }),
      ],
      ['merchant-1', 'merchant-2'],
    );
    await sync(client);
    expect(readFields().crispEmail).toEqual({
      primaryEmail: 'pic@example.com',
      additionalEmails: ['other@example.com'],
    });
    expect(readFields().crispChat).toMatchObject({
      secondaryLinks: [
        {
          url: 'https://crm.example.com/page/inbox-page#conversation-conversation-2',
          label: 'BLOY: Customer',
        },
        {
          url: 'https://crm.example.com/page/inbox-page#conversation-conversation-3',
          label: 'MIDA: Customer',
        },
      ],
    });
  });

  it('keeps the chat link and clears stale Email PIC when a visitor no longer has an email', async () => {
    const { client, readFields } = makeClient([
      conversation({ visitorEmail: '   ' }),
    ]);
    await sync(client);
    expect(readFields().crispEmail).toEqual({
      primaryEmail: '',
      additionalEmails: [],
    });
    expect(readFields().crispChat).toMatchObject({
      primaryLinkUrl:
        'https://crm.example.com/page/inbox-page#conversation-conversation-1',
    });
  });

  it.each([{ merchantIds: [] }, { merchantIds: ['merchant-1'] }])(
    'clears both old columns when no conversation remains for merchants $merchantIds',
    async ({ merchantIds }) => {
      const { client, readFields } = makeClient([], merchantIds);
      await sync(client);
      expect(readFields().crispChat).toEqual({
        primaryLinkUrl: '',
        primaryLinkLabel: '',
        secondaryLinks: [],
      });
      expect(readFields().crispEmail).toEqual({
        primaryEmail: '',
        additionalEmails: [],
      });
    },
  );

  it('reads later pages instead of dropping conversations and emails after the first page', async () => {
    const { client, pages, readFields } = makeClient([conversation()]);
    pages.set('next', [
      conversation({
        id: 'conversation-2',
        visitorEmail: 'second@example.com',
      }),
    ]);
    await sync(client);
    expect(readFields().crispEmail).toEqual({
      primaryEmail: 'pic@example.com',
      additionalEmails: ['second@example.com'],
    });
  });
});

describe('conversation changes', () => {
  it('refreshes both prospects when a conversation moves to a different merchant', async () => {
    const { client, merchantProspectIds, readFields } = makeClient(
      [conversation({ merchantId: 'merchant-2' })],
      ['merchant-1', 'merchant-2'],
    );
    merchantProspectIds.set('merchant-2', 'prospect-2');
    const result = refreshProspectOnConversationChanged(client, [
      {
        recordId: 'conversation-1',
        properties: {
          before: { merchantId: 'merchant-1' },
          after: { merchantId: 'merchant-2' },
        },
      },
    ]);
    await vi.runAllTimersAsync();
    await result;
    expect(readFields('prospect-1').crispChat).toEqual({
      primaryLinkUrl: '',
      primaryLinkLabel: '',
      secondaryLinks: [],
    });
    expect(readFields('prospect-1').crispEmail).toEqual({
      primaryEmail: '',
      additionalEmails: [],
    });
    expect(readFields('prospect-2').crispEmail).toEqual({
      primaryEmail: 'pic@example.com',
      additionalEmails: [],
    });
  });

  it('clears the projection after the last linked conversation is deleted', async () => {
    const { client, readFields } = makeClient([]);
    const result = refreshProspectOnConversationChanged(client, [
      {
        recordId: 'conversation-1',
        properties: { before: { merchantId: 'merchant-1' } },
      },
    ]);
    await vi.runAllTimersAsync();
    await result;
    expect(readFields().crispChat).toEqual({
      primaryLinkUrl: '',
      primaryLinkLabel: '',
      secondaryLinks: [],
    });
    expect(readFields().crispEmail).toEqual({
      primaryEmail: '',
      additionalEmails: [],
    });
  });

  it('populates both columns when an existing conversation merchant is linked to a prospect later', async () => {
    const { client, readFields } = makeClient([conversation()]);
    const result = refreshProspectOnMerchantChanged(client, [
      {
        recordId: 'merchant-1',
        properties: {
          before: { prospectId: null },
          after: { prospectId: 'prospect-1' },
        },
      },
    ]);
    await vi.runAllTimersAsync();
    await result;
    expect(readFields().crispEmail).toEqual({
      primaryEmail: 'pic@example.com',
      additionalEmails: [],
    });
    expect(readFields().crispChat).toMatchObject({
      primaryLinkUrl:
        'https://crm.example.com/page/inbox-page#conversation-conversation-1',
    });
  });
});

describe('conversation backfill', () => {
  it('resumes after the previous batch instead of repeatedly updating the first prospects', async () => {
    const { client, readFields } = makeClient([conversation()]);
    const firstResult = syncCrispConversations({ client, writeLimit: 1 });
    await vi.runAllTimersAsync();
    const first = await firstResult;
    expect(first).toMatchObject({
      checked: 1,
      completed: false,
      nextCursor: 'prospect-cursor-1',
    });
    const secondResult = syncCrispConversations({
      client,
      writeLimit: 1,
      after: first.nextCursor ?? undefined,
    });
    await vi.runAllTimersAsync();
    expect(await secondResult).toMatchObject({
      checked: 1,
      completed: true,
      nextCursor: null,
    });
    expect(readFields('prospect-1').crispEmail).toEqual({
      primaryEmail: 'pic@example.com',
      additionalEmails: [],
    });
    expect(readFields('prospect-2').crispEmail).toEqual({
      primaryEmail: '',
      additionalEmails: [],
    });
  });

  it('returns the last processed cursor when its time budget expires inside a page', async () => {
    const { client, readFields } = makeClient([conversation()]);
    const result = syncCrispConversations({
      client,
      shouldStop: () =>
        typeof readFields('prospect-1').crispCheckedAt === 'string',
    });
    await vi.runAllTimersAsync();
    expect(await result).toMatchObject({
      checked: 1,
      completed: false,
      nextCursor: 'prospect-cursor-1',
    });
    expect(readFields('prospect-2').crispEmail).toEqual({
      primaryEmail: 'old@example.com',
    });
  });
});
