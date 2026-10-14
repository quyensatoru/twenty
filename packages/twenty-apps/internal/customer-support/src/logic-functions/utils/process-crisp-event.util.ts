import { HANDLED_CRISP_EVENTS } from '../../constants/crisp';
import { type ApiClient } from '../../types/api-client';
import {
  type CrispConversationMeta,
  type CrispMessagePayload,
} from '../../types/crisp-api';
import { applyMessageToConversation } from './apply-message-to-conversation.util';
import { toConversationStatus } from './build-conversation-record.util';
import {
  countConversationMessages,
  softDeleteRecord,
  type StoredConversation,
  updateConversation,
  upsertMessages,
} from './crisp-conversation-store.util';
import {
  computeCrispConversationId,
  computeCrispMessageId,
} from './crisp-record-id.util';
import { ensureConversation } from './ensure-conversation.util';
import {
  extractContactEmails,
  extractShopDomains,
} from './extract-shop-domains.util';
import {
  mapCrispMessage,
  readCrispMessageText,
} from './map-crisp-message.util';
import { matchMerchant } from './match-merchant.util';
import {
  type CrispSettings,
  type CrispWebsite,
} from './read-crisp-settings.util';
import { resolveConversationAppName } from './resolve-conversation-app-name.util';

export type CrispEventOutcome =
  | 'message-stored'
  | 'message-updated'
  | 'message-removed'
  | 'conversation-updated'
  | 'conversation-removed'
  | 'ignored';

const readText = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

// A profile field arriving late (email, shop data) is often what finally
// identifies the merchant, so an unmatched chat retries the match on it.
const rematchMerchant = async ({
  client,
  website,
  stored,
  meta,
}: {
  client: ApiClient;
  website: CrispWebsite;
  stored: StoredConversation;
  meta: CrispConversationMeta;
}): Promise<Record<string, unknown>> => {
  if (stored.merchantId !== null) {
    return {};
  }

  const combinedMeta: CrispConversationMeta = {
    nickname: meta.nickname ?? stored.visitorName ?? undefined,
    email: meta.email ?? stored.visitorEmail ?? undefined,
    segments: meta.segments ?? stored.segments ?? undefined,
    data:
      meta.data ??
      (stored.sessionData as CrispConversationMeta['data'] | null) ??
      undefined,
  };
  const shopDomains = extractShopDomains(combinedMeta);
  const match = await matchMerchant({
    client,
    appName: resolveConversationAppName(website.appName, combinedMeta.data),
    shopDomains,
    emails: extractContactEmails(combinedMeta),
  });

  if (match === undefined) {
    return shopDomains.length > 0 ? { shopDomain: shopDomains[0] } : {};
  }

  return { merchantId: match.merchantId, shopDomain: match.shopDomain };
};

export const processCrispEvent = async ({
  client,
  settings,
  website,
  event,
  data,
}: {
  client: ApiClient;
  settings: CrispSettings;
  website: CrispWebsite;
  event: string;
  data: Record<string, unknown>;
}): Promise<CrispEventOutcome> => {
  const sessionId = readText(data.session_id);

  if (sessionId === null || !HANDLED_CRISP_EVENTS.has(event)) {
    return 'ignored';
  }

  const conversationId = computeCrispConversationId({
    websiteId: website.websiteId,
    sessionId,
  });

  if (event === 'session:removed') {
    await softDeleteRecord(client, 'deleteCrispConversation', conversationId);

    return 'conversation-removed';
  }

  if (event === 'message:removed') {
    const fingerprint = data.fingerprint;

    if (fingerprint === undefined || fingerprint === null) {
      return 'ignored';
    }

    await softDeleteRecord(
      client,
      'deleteCrispMessage',
      computeCrispMessageId({
        websiteId: website.websiteId,
        sessionId,
        fingerprint: String(fingerprint),
      }),
    );
    await updateConversation(client, conversationId, {
      messageCount: await countConversationMessages(client, conversationId),
    });

    return 'message-removed';
  }

  const stored = await ensureConversation({
    client,
    settings,
    website,
    sessionId,
  });

  switch (event) {
    case 'message:send':
    case 'message:received': {
      const message = mapCrispMessage({
        payload: data as CrispMessagePayload,
        websiteId: website.websiteId,
        sessionId,
        conversationId,
      });

      if (message === undefined) {
        return 'ignored';
      }

      await upsertMessages(client, [message]);
      await updateConversation(client, conversationId, {
        ...applyMessageToConversation(stored, message),
        messageCount: await countConversationMessages(client, conversationId),
      });

      return 'message-stored';
    }
    case 'message:updated': {
      const fingerprint = data.fingerprint;

      if (fingerprint === undefined || fingerprint === null) {
        return 'ignored';
      }

      const content = data.content;

      try {
        await client.mutation({
          updateCrispMessage: {
            __args: {
              id: computeCrispMessageId({
                websiteId: website.websiteId,
                sessionId,
                fingerprint: String(fingerprint),
              }),
              data: {
                text: readCrispMessageText(
                  typeof data.type === 'string' ? data.type : undefined,
                  content,
                ),
                content:
                  typeof content === 'object' && content !== null
                    ? content
                    : null,
              },
            },
            id: true,
          },
        });
      } catch {
        // An edit of a message older than the sync window: nothing to edit.
        return 'ignored';
      }

      return 'message-updated';
    }
    case 'session:set_state': {
      const status = toConversationStatus(data.state);

      if (status === undefined) {
        return 'ignored';
      }

      await updateConversation(client, conversationId, {
        status,
        ...(status === 'RESOLVED' ? { waitingSince: null } : {}),
      });

      return 'conversation-updated';
    }
    case 'session:set_email': {
      const email = readText(data.email)?.toLowerCase() ?? null;

      await updateConversation(client, conversationId, {
        visitorEmail: email,
        ...(await rematchMerchant({
          client,
          website,
          stored,
          meta: { email: email ?? undefined },
        })),
      });

      return 'conversation-updated';
    }
    case 'session:set_nickname': {
      const nickname = readText(data.nickname);

      await updateConversation(client, conversationId, {
        visitorName: nickname,
        ...(await rematchMerchant({
          client,
          website,
          stored,
          meta: { nickname: nickname ?? undefined },
        })),
      });

      return 'conversation-updated';
    }
    case 'session:set_segments': {
      const segments = Array.isArray(data.segments)
        ? data.segments.filter(
            (segment): segment is string => typeof segment === 'string',
          )
        : [];

      await updateConversation(client, conversationId, {
        segments,
        ...(await rematchMerchant({
          client,
          website,
          stored,
          meta: { segments },
        })),
      });

      return 'conversation-updated';
    }
    case 'session:set_data': {
      const sessionData =
        typeof data.data === 'object' && data.data !== null
          ? (data.data as Record<string, string | number | boolean>)
          : null;

      await updateConversation(client, conversationId, {
        sessionData,
        ...(await rematchMerchant({
          client,
          website,
          stored,
          meta: { data: sessionData ?? undefined },
        })),
      });

      return 'conversation-updated';
    }
    default:
      return 'conversation-updated';
  }
};
