import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { NOTIFY_EVENT_MESSAGE_MENTION_ROUTE_PATH } from '../constants/route-paths';
import { NOTIFY_EVENT_MESSAGE_MENTION_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { buildMentionEmail } from './utils/build-mention-email.util';
import { createAppClient } from './utils/create-app-client.util';
import {
  formatMemberName,
  listMembersById,
} from './utils/list-event-message-members.util';
import { readErrorMessage } from './utils/read-error-message.util';
import { sendNotificationEmail } from './utils/send-notification-email.util';

type NotifyMentionBody = {
  actorMemberId?: string;
  eventTitle?: string;
  excerpt?: string;
  mentionMemberIds?: string[];
};

// A generous ceiling, not a realistic count: it exists so a malformed
// request can't make the route iterate forever, not to cap real chat usage.
const MAX_MENTIONS = 50;

// Best-effort by design: the chat message itself is already saved by the time
// this route runs (see chat-panel.tsx), so a mail provider outage must never
// read back to the sender as a failed send.
const handler = async (event: RoutePayload<NotifyMentionBody>) => {
  try {
    const actorMemberId = event.body?.actorMemberId;
    const eventTitle = event.body?.eventTitle;
    const excerpt = event.body?.excerpt;
    const mentionMemberIds = event.body?.mentionMemberIds ?? [];

    if (typeof actorMemberId !== 'string' || actorMemberId.length === 0) {
      return { success: false, error: 'actorMemberId is required.' };
    }
    if (typeof eventTitle !== 'string' || eventTitle.length === 0) {
      return { success: false, error: 'eventTitle is required.' };
    }
    if (typeof excerpt !== 'string') {
      return { success: false, error: 'excerpt is required.' };
    }
    if (
      !Array.isArray(mentionMemberIds) ||
      mentionMemberIds.length === 0 ||
      mentionMemberIds.length > MAX_MENTIONS ||
      mentionMemberIds.some((id) => typeof id !== 'string')
    ) {
      return { success: false, error: 'Invalid mentionMemberIds.' };
    }

    const client = createAppClient();
    const members = await listMembersById(client, [
      actorMemberId,
      ...mentionMemberIds,
    ]);
    const actorName = formatMemberName(members.get(actorMemberId));
    const commentExcerpt = excerpt.slice(0, 300);
    const email = buildMentionEmail({ actorName, eventTitle, commentExcerpt });

    const recipients = [...new Set(mentionMemberIds)].filter(
      (memberId) => memberId !== actorMemberId,
    );

    await Promise.allSettled(
      recipients.map(async (memberId) => {
        const to = members.get(memberId)?.userEmail;
        if (to === null || to === undefined || to.length === 0) return;

        const result = await sendNotificationEmail(to, email);
        if (!result.ok) {
          console.error('Mention notification email failed', result.error);
        }
      }),
    );

    return { success: true };
  } catch (error) {
    return { success: false, error: readErrorMessage(error) };
  }
};

export default defineLogicFunction({
  universalIdentifier: NOTIFY_EVENT_MESSAGE_MENTION_LOGIC_FUNCTION_UID,
  name: 'notify-event-message-mention',
  description:
    'Route: emails each @mentioned member about a new chat message.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: NOTIFY_EVENT_MESSAGE_MENTION_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
