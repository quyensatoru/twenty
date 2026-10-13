import { type ApiClient } from '../../types/api-client';
import { type CrispConversationRecord } from './build-conversation-record.util';
import { executeWithRetry } from './execute-with-retry.util';
import { type CrispMessageRecord } from './map-crisp-message.util';

const UPSERT_BATCH_SIZE = 100;

export type StoredConversation = {
  id: string;
  status: string | null;
  lastMessageAt: string | null;
  lastMessageFingerprint: string | null;
  waitingSince: string | null;
  merchantId: string | null;
  visitorEmail: string | null;
  sessionData: Record<string, unknown> | null;
  segments: string[] | null;
  visitorName: string | null;
};

const STORED_CONVERSATION_SELECTION = {
  id: true,
  status: true,
  lastMessageAt: true,
  lastMessageFingerprint: true,
  waitingSince: true,
  merchantId: true,
  visitorEmail: true,
  visitorName: true,
  sessionData: true,
  segments: true,
} as const;

const chunk = <TItem>(items: TItem[], size: number): TItem[][] => {
  const chunks: TItem[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};

export const findStoredConversations = async (
  client: ApiClient,
  ids: string[],
): Promise<Map<string, StoredConversation>> => {
  const stored = new Map<string, StoredConversation>();

  for (const batch of chunk(ids, UPSERT_BATCH_SIZE)) {
    const result = await executeWithRetry<{
      crispConversations?: { edges?: { node: StoredConversation }[] };
    }>(() =>
      client.query({
        crispConversations: {
          __args: { filter: { id: { in: batch } }, first: batch.length },
          edges: { node: STORED_CONVERSATION_SELECTION },
        },
      }),
    );

    for (const edge of result?.crispConversations?.edges ?? []) {
      stored.set(edge.node.id, edge.node);
    }
  }

  return stored;
};

export const findStoredConversation = async (
  client: ApiClient,
  id: string,
): Promise<StoredConversation | undefined> =>
  (await findStoredConversations(client, [id])).get(id);

// `upsert` matches on the derived id and writes only the columns passed, so a
// partial row never blanks what another writer already filled in.
export const upsertConversations = async (
  client: ApiClient,
  rows: (Partial<CrispConversationRecord> & { id: string } & Record<
      string,
      unknown
    >)[],
): Promise<void> => {
  for (const batch of chunk(rows, UPSERT_BATCH_SIZE)) {
    await executeWithRetry(() =>
      client.mutation({
        createCrispConversations: {
          __args: { data: batch, upsert: true },
          id: true,
        },
      }),
    );
  }
};

export const upsertMessages = async (
  client: ApiClient,
  rows: CrispMessageRecord[],
): Promise<void> => {
  for (const batch of chunk(rows, UPSERT_BATCH_SIZE)) {
    await executeWithRetry(() =>
      client.mutation({
        createCrispMessages: {
          __args: { data: batch, upsert: true },
          id: true,
        },
      }),
    );
  }
};

export const updateConversation = async (
  client: ApiClient,
  id: string,
  data: Record<string, unknown>,
): Promise<void> => {
  if (Object.keys(data).length === 0) {
    return;
  }

  await executeWithRetry(() =>
    client.mutation({
      updateCrispConversation: { __args: { id, data }, id: true },
    }),
  );
};

export const countConversationMessages = async (
  client: ApiClient,
  conversationId: string,
): Promise<number> => {
  const result = await executeWithRetry<{
    crispMessages?: { totalCount?: number };
  }>(() =>
    client.query({
      crispMessages: {
        __args: {
          filter: { conversationId: { eq: conversationId } },
          first: 1,
        },
        totalCount: true,
      },
    }),
  );

  return result?.crispMessages?.totalCount ?? 0;
};

const isMissingRecordError = (error: unknown): boolean =>
  /not found|does not exist/i.test(
    error instanceof Error ? error.message : String(error),
  );

export const softDeleteRecord = async (
  client: ApiClient,
  mutationName: 'deleteCrispMessage' | 'deleteCrispConversation',
  id: string,
): Promise<void> => {
  try {
    await client.mutation({ [mutationName]: { __args: { id }, id: true } });
  } catch (error) {
    if (!isMissingRecordError(error)) {
      throw error;
    }
  }
};
