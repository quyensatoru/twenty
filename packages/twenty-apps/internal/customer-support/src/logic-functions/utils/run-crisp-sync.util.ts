import { type ApiClient } from '../../types/api-client';
import { buildConversationRecord } from './build-conversation-record.util';
import {
  CRISP_CONVERSATIONS_PER_PAGE,
  isCrispRateLimitError,
  listCrispConversations,
} from './crisp-api.util';
import {
  findStoredConversations,
  updateConversation,
  upsertConversations,
} from './crisp-conversation-store.util';
import { importConversationMessages } from './import-conversation-messages.util';
import { type CrispSettings } from './read-crisp-settings.util';
import { resolveConversationMerchant } from './resolve-conversation-merchant.util';

export type CrispSyncCursor = {
  websiteIndex: number;
  pageNumber: number;
};

export type CrispSyncSummary = {
  conversations: number;
  threadsImported: number;
  merchantsMatched: number;
  completed: boolean;
  isRateLimited?: boolean;
  next?: CrispSyncCursor;
};

// Walks every configured Crisp website's conversations updated since
// `updatedSince`, page by page, and stops at `deadline` with a cursor the
// caller re-enqueues. Threads are only re-read when Crisp's latest message
// differs from the one already stored, so a quiet chat costs one list row.
const runCrispSyncPages = async ({
  client,
  settings,
  updatedSince,
  cursor,
  deadline,
  summary,
  position,
}: {
  client: ApiClient;
  settings: CrispSettings;
  updatedSince: string;
  cursor: CrispSyncCursor;
  deadline: number;
  summary: CrispSyncSummary;
  position: CrispSyncCursor;
}): Promise<CrispSyncSummary> => {
  for (
    let websiteIndex = cursor.websiteIndex;
    websiteIndex < settings.websites.length;
    websiteIndex += 1
  ) {
    const website = settings.websites[websiteIndex];
    let pageNumber =
      websiteIndex === cursor.websiteIndex ? cursor.pageNumber : 1;

    for (;;) {
      position.websiteIndex = websiteIndex;
      position.pageNumber = pageNumber;

      if (Date.now() > deadline) {
        return {
          ...summary,
          completed: false,
          next: { websiteIndex, pageNumber },
        };
      }

      const conversations = await listCrispConversations(
        settings,
        website.websiteId,
        { pageNumber, updatedSince },
      );
      const withSession = conversations.filter(
        (conversation) =>
          typeof conversation.session_id === 'string' &&
          conversation.session_id.length > 0,
      );
      const records = withSession.map((conversation) =>
        buildConversationRecord({
          conversation,
          website,
          sessionId: conversation.session_id as string,
        }),
      );
      const stored = await findStoredConversations(
        client,
        records.map((record) => record.id),
      );
      const rows: (Record<string, unknown> & { id: string })[] = [];

      // Matched again on every pass, not only while unlinked, so a link an
      // older rule got wrong is corrected the next time the chat moves.
      for (const [index, record] of records.entries()) {
        const merchantFields = await resolveConversationMerchant({
          client,
          appName: record.appName,
          meta: withSession[index].meta,
        });

        if (merchantFields.merchantId !== null) {
          summary.merchantsMatched += 1;
        }

        rows.push({ ...record, ...merchantFields });
      }

      await upsertConversations(client, rows);
      summary.conversations += records.length;

      for (const [index, record] of records.entries()) {
        const existing = stored.get(record.id);
        const previewFingerprint =
          withSession[index].preview_message?.fingerprint;

        if (
          existing !== undefined &&
          previewFingerprint !== undefined &&
          String(previewFingerprint) === existing.lastMessageFingerprint
        ) {
          continue;
        }

        const threadPatch = await importConversationMessages({
          client,
          settings,
          website,
          sessionId: record.sessionId,
          conversationId: record.id,
          since: existing?.lastMessageAt ?? null,
        });

        await updateConversation(client, record.id, threadPatch);
        summary.threadsImported += 1;

        if (Date.now() > deadline) {
          return {
            ...summary,
            completed: false,
            // The page is re-read on resume; already-imported threads now
            // match their fingerprint and are skipped.
            next: { websiteIndex, pageNumber },
          };
        }
      }

      if (conversations.length < CRISP_CONVERSATIONS_PER_PAGE) {
        break;
      }

      pageNumber += 1;
    }
  }

  return summary;
};

// A rate limit is not a failure of the sync, only of this run: the work done
// so far is kept and the caller resumes from the page that was cut short.
export const runCrispSync = async (args: {
  client: ApiClient;
  settings: CrispSettings;
  updatedSince: string;
  cursor: CrispSyncCursor;
  deadline: number;
}): Promise<CrispSyncSummary> => {
  const summary: CrispSyncSummary = {
    conversations: 0,
    threadsImported: 0,
    merchantsMatched: 0,
    completed: true,
  };
  const position: CrispSyncCursor = { ...args.cursor };

  try {
    return await runCrispSyncPages({ ...args, summary, position });
  } catch (error) {
    if (!isCrispRateLimitError(error)) {
      throw error;
    }

    return {
      ...summary,
      completed: false,
      isRateLimited: true,
      next: { ...position },
    };
  }
};
