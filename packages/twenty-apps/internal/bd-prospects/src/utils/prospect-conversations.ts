import { RECORD_PAGE_BASE_URL_VARIABLE } from '../constants/application-variable-names';
import { SUPPORT_INBOX_PAGE_LAYOUT_UID } from '../constants/universal-identifiers';
import { type Connection } from './api-types';
import { createConversationAppMetadataClient } from './create-conversation-app-client';
import { executeWithRetry } from './execute-with-retry';

export type ProspectConversationClient = {
  query: (selection: Record<string, unknown>) => Promise<unknown>;
  mutation: (selection: Record<string, unknown>) => Promise<unknown>;
};

type ConversationRow = {
  id: string;
  visitorName: string | null;
  visitorEmail: string | null;
  appName: string | null;
};

const PAGE_SIZE = 200;

export const readConversationRecords = async <TData>(
  client: ProspectConversationClient,
  objectName: 'prospects' | 'merchants' | 'crispConversations',
  queryArguments: Record<string, unknown>,
  selection: Record<string, unknown>,
): Promise<TData[]> => {
  const rows: TData[] = [];
  let after: string | undefined;

  do {
    const result = (await executeWithRetry(() =>
      client.query({
        [objectName]: {
          __args: { ...queryArguments, first: PAGE_SIZE, after },
          edges: { node: selection },
          pageInfo: { hasNextPage: true, endCursor: true },
        },
      }),
    )) as Record<string, Connection<TData>>;
    const connection = result[objectName];

    rows.push(...connection.edges.map(({ node }) => node));
    after = connection.pageInfo.hasNextPage
      ? (connection.pageInfo.endCursor ?? undefined)
      : undefined;
  } while (after !== undefined);

  return rows;
};

export const refreshProspectConversations = async (
  client: ProspectConversationClient,
  prospectId: string,
): Promise<boolean> => {
  const merchants = await readConversationRecords<{ id: string }>(
    client,
    'merchants',
    { filter: { prospectId: { eq: prospectId } } },
    { id: true },
  );
  const conversations =
    merchants.length === 0
      ? []
      : await readConversationRecords<ConversationRow>(
          client,
          'crispConversations',
          {
            filter: { merchantId: { in: merchants.map(({ id }) => id) } },
            orderBy: [
              { lastMessageAt: 'DescNullsLast' },
              { createdAt: 'DescNullsLast' },
              { id: 'AscNullsLast' },
            ],
          },
          { id: true, visitorName: true, visitorEmail: true, appName: true },
        );
  // The frontend and API can have different origins in a split deployment.
  const recordPageBaseUrl =
    process.env[RECORD_PAGE_BASE_URL_VARIABLE]?.trim() ||
    process.env.TWENTY_API_URL?.trim();

  if (conversations.length > 0 && !recordPageBaseUrl) {
    throw new Error('Missing record page base URL for conversation links.');
  }

  let inboxPath = '';
  if (conversations.length > 0) {
    const { getPageLayouts } = await executeWithRetry(() =>
      createConversationAppMetadataClient().query({
        getPageLayouts: { id: true, universalIdentifier: true },
      }),
    );
    const pageLayout = getPageLayouts.find(
      (pageLayout) =>
        pageLayout.universalIdentifier === SUPPORT_INBOX_PAGE_LAYOUT_UID,
    );
    if (pageLayout === undefined) {
      throw new Error('Support inbox is not available.');
    }
    inboxPath = `/page/${pageLayout.id}`;
  }

  const links = conversations.map((conversation) => ({
    url: `${recordPageBaseUrl?.replace(/\/+$/, '')}${inboxPath}#conversation-${encodeURIComponent(conversation.id)}`,
    label: [
      conversation.appName,
      conversation.visitorName || conversation.visitorEmail || 'Conversation',
    ]
      .filter(Boolean)
      .join(': '),
  }));
  const emailByAddress = new Map<string, string>();

  for (const conversation of conversations) {
    const email = conversation.visitorEmail?.trim();

    if (email && !emailByAddress.has(email.toLowerCase())) {
      emailByAddress.set(email.toLowerCase(), email);
    }
  }

  const [primaryLink, ...secondaryLinks] = links;
  const [primaryEmail, ...additionalEmails] = emailByAddress.values();

  await executeWithRetry(() =>
    client.mutation({
      updateProspect: {
        __args: {
          id: prospectId,
          data: {
            // The ORM omits null composite values, so clear their subfields.
            crispChat:
              primaryLink === undefined
                ? {
                    primaryLinkUrl: '',
                    primaryLinkLabel: '',
                    secondaryLinks: [],
                  }
                : {
                    primaryLinkUrl: primaryLink.url,
                    primaryLinkLabel: primaryLink.label,
                    secondaryLinks,
                  },
            crispEmail:
              primaryEmail === undefined
                ? { primaryEmail: '', additionalEmails: [] }
                : { primaryEmail, additionalEmails },
            crispCheckedAt: new Date().toISOString(),
          },
        },
        id: true,
      },
    }),
  );

  return conversations.length > 0;
};

export const refreshConversationProspects = async (
  client: ProspectConversationClient,
  merchantIds: string[],
): Promise<string[]> => {
  if (merchantIds.length === 0) {
    return [];
  }

  const merchants = await readConversationRecords<{
    prospectId: string | null;
  }>(
    client,
    'merchants',
    { filter: { id: { in: [...new Set(merchantIds)] } } },
    { prospectId: true },
  );
  const prospectIds = [
    ...new Set(
      merchants.flatMap(({ prospectId }) =>
        prospectId === null ? [] : [prospectId],
      ),
    ),
  ];

  for (const prospectId of prospectIds) {
    await refreshProspectConversations(client, prospectId);
  }

  return prospectIds;
};
