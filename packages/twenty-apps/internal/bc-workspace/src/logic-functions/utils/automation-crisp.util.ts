import { type ApiClient } from '../../types/api-client';
import { type VipClientRecord } from '../../types/bc-records';
import { matchBcOperator } from '../../utils/automation-operator.util';
import { mentionsUpsell } from '../../utils/automation-upsell.util';
import { recordActivity } from './activity-store.util';
import { endReplyWait } from './automation-no-reply.util';
import {
  findVipClientByShopDomain,
  listActiveBcMembers,
  readMerchant,
} from './automation-records.util';
import { readVipClient } from './client-store.util';
import { recomputeClientStatus } from './recompute-client-status.util';
import { findFirstRecord, updateRecord } from './record-store.util';

export type CrispMessageNode = {
  id: string;
  text: string | null;
  sender: 'USER' | 'OPERATOR' | null;
  senderName: string | null;
  messageType: string | null;
  sentAt: string | null;
  conversationId: string | null;
};

export type CrispConversationNode = {
  id: string;
  appName: string | null;
  shopDomain: string | null;
  sessionId: string | null;
  websiteId: string | null;
  merchantId: string | null;
};

export const CRISP_MESSAGE_SELECTION = {
  id: true,
  text: true,
  sender: true,
  senderName: true,
  messageType: true,
  sentAt: true,
  conversationId: true,
};

export const CRISP_CONVERSATION_SELECTION = {
  id: true,
  appName: true,
  shopDomain: true,
  sessionId: true,
  websiteId: true,
  merchantId: true,
};

const DAY_MS = 86_400_000;

// The Crisp sync imports whole histories; only recent messages may move a
// status or reach the AI, older ones just land on the timeline.
export const LIVE_STATUS_WINDOW_DAYS = 7;
export const LIVE_CLASSIFICATION_WINDOW_DAYS = 3;

export const isRecent = (sentAt: string | null, days: number, now = Date.now()): boolean =>
  sentAt !== null && now - Date.parse(sentAt) <= days * DAY_MS;

const IGNORED_MESSAGE_TYPES = new Set(['note', 'event']);

export const buildCrispConversationUrl = (
  conversation: CrispConversationNode,
): string | null =>
  conversation.websiteId !== null && conversation.sessionId !== null
    ? `https://app.crisp.chat/website/${conversation.websiteId}/inbox/${conversation.sessionId}/`
    : null;

export const readCrispMessage = (
  client: ApiClient,
  messageId: string,
): Promise<CrispMessageNode | null> =>
  findFirstRecord<CrispMessageNode>({
    client,
    objectNamePlural: 'crispMessages',
    filter: { id: { eq: messageId } },
    selection: CRISP_MESSAGE_SELECTION,
  });

export const readCrispConversation = (
  client: ApiClient,
  conversationId: string,
): Promise<CrispConversationNode | null> =>
  findFirstRecord<CrispConversationNode>({
    client,
    objectNamePlural: 'crispConversations',
    filter: { id: { eq: conversationId } },
    selection: CRISP_CONVERSATION_SELECTION,
  });

export const resolveConversationVipClient = async (
  client: ApiClient,
  conversation: CrispConversationNode,
): Promise<VipClientRecord | null> => {
  if (conversation.merchantId !== null) {
    const merchant = await readMerchant(client, conversation.merchantId);

    if (merchant?.vipClientId) {
      return readVipClient(client, merchant.vipClientId);
    }
  }

  return findVipClientByShopDomain(client, conversation.shopDomain);
};

const laterOf = (left: string | null, right: string): string =>
  left === null || Date.parse(right) > Date.parse(left) ? right : left;

export type CrispMessageOutcome =
  | { outcome: 'ignored'; reason: string }
  | { outcome: 'bc-message' | 'support-message'; vipClientId: string }
  | { outcome: 'client-message'; vipClientId: string; shouldClassify: boolean };

// A BC's message starts the wait for the client's answer; the client's
// message ends it and may report a problem. Support agents' messages are not
// BC contact and change nothing.
export const handleCrispMessage = async (
  client: ApiClient,
  message: CrispMessageNode,
): Promise<CrispMessageOutcome> => {
  if (
    message.conversationId === null ||
    message.sentAt === null ||
    IGNORED_MESSAGE_TYPES.has((message.messageType ?? '').toLowerCase())
  ) {
    return { outcome: 'ignored', reason: 'not a conversation message' };
  }

  const conversation = await readCrispConversation(client, message.conversationId);

  if (conversation === null) {
    return { outcome: 'ignored', reason: 'conversation not found' };
  }

  const vipClient = await resolveConversationVipClient(client, conversation);

  if (vipClient === null) {
    return { outcome: 'ignored', reason: 'not a VIP client' };
  }

  const sourceUrl = buildCrispConversationUrl(conversation);
  const isLive = isRecent(message.sentAt, LIVE_STATUS_WINDOW_DAYS);
  const excerpt = (message.text ?? '').trim().slice(0, 500);

  if (message.sender === 'OPERATOR') {
    const bcMemberId = matchBcOperator(
      message.senderName,
      (await listActiveBcMembers(client)).map((member) => ({
        memberId: member.memberId,
        name: member.name,
        crispOperatorNames: member.crispOperatorNames,
        isActive: member.isActive,
      })),
    );

    if (bcMemberId === null) {
      return { outcome: 'support-message', vipClientId: vipClient.id };
    }

    await recordActivity(client, {
      vipClientId: vipClient.id,
      type: 'CRISP_MESSAGE',
      title: `Crisp message from ${message.senderName ?? 'BC'}`,
      summary: excerpt,
      direction: 'OUTBOUND',
      // Plan talk is what lets a later upgrade count as BC-influenced.
      topic: mentionsUpsell(message.text) ? 'UPSELL' : 'GENERAL',
      isBcAuthored: true,
      actorMemberId: bcMemberId,
      occurredAt: message.sentAt,
      appName: conversation.appName,
      externalId: `crisp:${message.id}`,
      sourceUrl,
      metadata: { conversationId: conversation.id, messageId: message.id },
    });

    const isNewest =
      vipClient.lastBcContactAt === null ||
      Date.parse(message.sentAt) >= Date.parse(vipClient.lastBcContactAt);

    await updateRecord({
      client,
      objectNameSingular: 'vipClient',
      id: vipClient.id,
      data: {
        lastBcContactAt: laterOf(vipClient.lastBcContactAt, message.sentAt),
        ...(isNewest ? { lastBcContactMemberId: bcMemberId } : {}),
        ...(isLive && vipClient.awaitingReplySince === null
          ? { awaitingReplySince: message.sentAt }
          : {}),
      },
    });

    if (isLive) {
      await recomputeClientStatus({ client, vipClientId: vipClient.id });
    }

    return { outcome: 'bc-message', vipClientId: vipClient.id };
  }

  await recordActivity(client, {
    vipClientId: vipClient.id,
    type: 'CRISP_MESSAGE',
    title: 'Crisp message from the client',
    summary: excerpt,
    direction: 'INBOUND',
    isBcAuthored: false,
    occurredAt: message.sentAt,
    appName: conversation.appName,
    externalId: `crisp:${message.id}`,
    sourceUrl,
    metadata: { conversationId: conversation.id, messageId: message.id },
  });

  const answersPendingMessage =
    vipClient.awaitingReplySince !== null &&
    Date.parse(message.sentAt) >= Date.parse(vipClient.awaitingReplySince);

  if (answersPendingMessage && vipClient.awaitingReplySince !== null) {
    await endReplyWait({
      client,
      vipClientId: vipClient.id,
      awaitingReplySince: vipClient.awaitingReplySince,
      reason: 'Client replied',
      at: message.sentAt,
    });
  }

  return {
    outcome: 'client-message',
    vipClientId: vipClient.id,
    shouldClassify:
      excerpt.length > 0 && isRecent(message.sentAt, LIVE_CLASSIFICATION_WINDOW_DAYS),
  };
};
