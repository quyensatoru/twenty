import { type ApiClient } from '../../types/api-client';
import { buildConversationRecord } from './build-conversation-record.util';
import { getCrispConversation, isCrispRateLimitError } from './crisp-api.util';
import {
  findStoredConversation,
  type StoredConversation,
  updateConversation,
  upsertConversations,
} from './crisp-conversation-store.util';
import { computeCrispConversationId } from './crisp-record-id.util';
import {
  extractContactEmails,
  extractShopDomains,
} from './extract-shop-domains.util';
import { importConversationMessages } from './import-conversation-messages.util';
import { matchMerchant } from './match-merchant.util';
import {
  type CrispSettings,
  type CrispWebsite,
} from './read-crisp-settings.util';

// The first event of a session the CRM has never seen: the profile and the
// history before that event only exist in Crisp, so both are read once here.
export const ensureConversation = async ({
  client,
  settings,
  website,
  sessionId,
}: {
  client: ApiClient;
  settings: CrispSettings;
  website: CrispWebsite;
  sessionId: string;
}): Promise<StoredConversation> => {
  const conversationId = computeCrispConversationId({
    websiteId: website.websiteId,
    sessionId,
  });
  const stored = await findStoredConversation(client, conversationId);

  if (stored !== undefined) {
    return stored;
  }

  // While Crisp rate limits the token, the chat is still stored from the
  // event alone; the hourly sync fills in the profile and history once the
  // limit lifts, because the stored thread will not match Crisp's.
  let isCrispAvailable = true;
  let conversation: Awaited<ReturnType<typeof getCrispConversation>> = {};

  try {
    conversation =
      (await getCrispConversation(settings, website.websiteId, sessionId)) ??
      {};
  } catch (error) {
    if (!isCrispRateLimitError(error)) {
      throw error;
    }

    isCrispAvailable = false;
  }

  const record = buildConversationRecord({ conversation, website, sessionId });
  const shopDomains = extractShopDomains(conversation.meta);
  const match = await matchMerchant({
    client,
    appName: record.appName,
    shopDomains,
    emails: extractContactEmails(conversation.meta),
  });

  await upsertConversations(client, [
    {
      ...record,
      shopDomain: match?.shopDomain ?? shopDomains[0] ?? null,
      ...(match === undefined ? {} : { merchantId: match.merchantId }),
    },
  ]);

  if (isCrispAvailable) {
    try {
      const threadPatch = await importConversationMessages({
        client,
        settings,
        website,
        sessionId,
        conversationId,
        since: null,
      });

      await updateConversation(client, conversationId, threadPatch);
    } catch (error) {
      if (!isCrispRateLimitError(error)) {
        throw error;
      }
    }
  }

  const created = await findStoredConversation(client, conversationId);

  if (created === undefined) {
    throw new Error(`Crisp conversation ${sessionId} could not be stored`);
  }

  return created;
};
