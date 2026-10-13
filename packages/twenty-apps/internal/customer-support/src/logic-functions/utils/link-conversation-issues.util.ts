import { type ApiClient } from '../../types/api-client';
import { executeWithRetry } from './execute-with-retry.util';
import {
  extractIssueReferences,
  hasIssueReferences,
} from './extract-issue-references.util';

const readLinkedIssueIds = async (
  client: ApiClient,
  conversationId: string,
): Promise<Set<string>> => {
  const result = await executeWithRetry<{
    crispConversationIssues?: {
      edges?: { node: { issueId?: string | null } }[];
    };
  }>(() =>
    client.query({
      crispConversationIssues: {
        __args: {
          filter: { conversationId: { eq: conversationId } },
          first: 200,
        },
        edges: { node: { issueId: true } },
      },
    }),
  );

  return new Set(
    (result?.crispConversationIssues?.edges ?? [])
      .map((edge) => edge.node.issueId)
      .filter((issueId): issueId is string => typeof issueId === 'string'),
  );
};

// Creates the links that are missing; an existing link is left alone so a
// repeated delivery or a re-read thread never fails on the unique index.
export const linkConversationIssues = async ({
  client,
  conversationId,
  issueIds,
}: {
  client: ApiClient;
  conversationId: string;
  issueIds: string[];
}): Promise<number> => {
  if (issueIds.length === 0) {
    return 0;
  }

  const linkedIssueIds = await readLinkedIssueIds(client, conversationId);
  const missing = [...new Set(issueIds)].filter(
    (issueId) => !linkedIssueIds.has(issueId),
  );

  if (missing.length === 0) {
    return 0;
  }

  await executeWithRetry(() =>
    client.mutation({
      createCrispConversationIssues: {
        __args: {
          data: missing.map((issueId) => ({ conversationId, issueId })),
        },
        id: true,
      },
    }),
  );

  return missing.length;
};

// Support mentions the issue it filed in an internal note ("tracked in
// HEAT-4", or a pasted record link), so the note itself is the link. Only
// notes count: a customer typing something that looks like a key is not a
// decision to link.
export const linkIssuesMentionedInNotes = async ({
  client,
  conversationId,
  noteTexts,
}: {
  client: ApiClient;
  conversationId: string;
  noteTexts: string[];
}): Promise<number> => {
  const references = extractIssueReferences(noteTexts.join('\n'));

  if (!hasIssueReferences(references)) {
    return 0;
  }

  const filters: Record<string, unknown>[] = [];

  if (references.issueKeys.length > 0) {
    filters.push({ issueKey: { in: references.issueKeys } });
  }

  if (references.issueIds.length > 0) {
    filters.push({ id: { in: references.issueIds } });
  }

  const result = await executeWithRetry<{
    issues?: { edges?: { node: { id: string } }[] };
  }>(() =>
    client.query({
      issues: {
        __args: { filter: { or: filters }, first: 50 },
        edges: { node: { id: true } },
      },
    }),
  );

  return linkConversationIssues({
    client,
    conversationId,
    issueIds: (result?.issues?.edges ?? []).map((edge) => edge.node.id),
  });
};

const NOTE_PAGE_SIZE = 200;
// One run links at most this many notes; the cursor resumes the rest next run.
const MAX_NOTES_PER_SCAN = 5_000;

// Links the issues named in internal notes already stored in the CRM, from
// `since` on. Reads only the CRM: Crisp is never called, so it is cheap to run
// after every sync.
export const linkIssuesFromStoredNotes = async ({
  client,
  since,
}: {
  client: ApiClient;
  since: string | null;
}): Promise<{
  scanned: number;
  linked: number;
  scannedUntil: string | null;
}> => {
  const notesByConversation = new Map<string, string[]>();
  let scanned = 0;
  let scannedUntil: string | null = since;
  let after: string | undefined;

  while (scanned < MAX_NOTES_PER_SCAN) {
    const result = await executeWithRetry<{
      crispMessages?: {
        edges?: {
          node: {
            text?: string | null;
            conversationId?: string | null;
            updatedAt?: string | null;
          };
        }[];
        pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
      };
    }>(() =>
      client.query({
        crispMessages: {
          __args: {
            filter: {
              and: [
                { messageType: { eq: 'note' } },
                ...(since === null ? [] : [{ updatedAt: { gt: since } }]),
                {
                  or: [
                    { text: { like: '%-%' } },
                    { text: { ilike: '%issue%' } },
                  ],
                },
              ],
            },
            first: NOTE_PAGE_SIZE,
            orderBy: [{ updatedAt: 'AscNullsFirst' }],
            ...(after === undefined ? {} : { after }),
          },
          edges: {
            node: { text: true, conversationId: true, updatedAt: true },
          },
          pageInfo: { hasNextPage: true, endCursor: true },
        },
      }),
    );
    const edges = result?.crispMessages?.edges ?? [];

    for (const { node } of edges) {
      scanned += 1;
      scannedUntil = node.updatedAt ?? scannedUntil;

      if (
        typeof node.conversationId === 'string' &&
        typeof node.text === 'string'
      ) {
        const texts = notesByConversation.get(node.conversationId) ?? [];

        texts.push(node.text);
        notesByConversation.set(node.conversationId, texts);
      }
    }

    const pageInfo = result?.crispMessages?.pageInfo;

    if (
      pageInfo?.hasNextPage !== true ||
      typeof pageInfo.endCursor !== 'string'
    ) {
      break;
    }

    after = pageInfo.endCursor;
  }

  let linked = 0;

  for (const [conversationId, noteTexts] of notesByConversation) {
    linked += await linkIssuesMentionedInNotes({
      client,
      conversationId,
      noteTexts,
    });
  }

  return { scanned, linked, scannedUntil };
};
