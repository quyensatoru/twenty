import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { PUBLIC_BASE_URL_VARIABLE } from '../constants/application-variable-names';
import { POLL_THUMBNAIL_ROUTE_PATH, REFRESH_POLL_ROUTE_PATH } from '../constants/route-paths';
import { REFRESH_POLL_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { buildPollAnchor } from '../utils/polls-anchor.util';
import { findPollById } from './utils/find-poll.util';
import { findPollsPagePath } from './utils/find-polls-page-path.util';
import { patchMattermostPost } from './utils/mattermost-client.util';
import { readErrorMessage } from './utils/read-error-message.util';

const readHeader = (headers: Record<string, string | undefined>, name: string): string | undefined =>
  Object.entries(headers).find(([key]) => key.toLowerCase() === name)?.[1];

const readOrigin = (headers: Record<string, string | undefined>): string | null => {
  const configured = process.env[PUBLIC_BASE_URL_VARIABLE]?.trim().replace(/\/+$/, '');

  if (configured !== undefined && configured.length > 0) {
    return configured;
  }

  const host = readHeader(headers, 'x-forwarded-host') ?? readHeader(headers, 'host');

  return host === undefined || host.length === 0
    ? null
    : `${readHeader(headers, 'x-forwarded-proto')?.split(',')[0] ?? 'https'}://${host}`;
};

type RefreshPollBody = { pollId?: string };

// Called from the Polls page right after a vote is written. Mattermost's
// thumbnail is a static image, not a live view, so the only way to keep the
// channel message in sync with Twenty is to re-render it and patch the post
// every time the tally changes.
const handler = async (event: RoutePayload<RefreshPollBody>) => {
  try {
    const poll = await findPollById(event.body?.pollId);

    if (poll === null) {
      return { success: false, error: 'Poll not found.' };
    }

    if (poll.mattermostPostId === null) {
      return { success: true, skipped: true };
    }

    const origin = readOrigin(event.headers ?? {});
    const pollsPagePath = await findPollsPagePath();
    const voteUrl = pollsPagePath === null ? null : `${origin ?? ''}${pollsPagePath}${buildPollAnchor(poll.id)}`;
    // Cache-busted so Mattermost's image proxy re-fetches instead of reusing
    // the thumbnail it cached from the original post.
    const thumbnailUrl = `${origin ?? ''}/s${POLL_THUMBNAIL_ROUTE_PATH}?id=${poll.id}&v=${Date.now()}`;

    const voteCount = (poll.votes ?? []).length;
    const optionLines = (poll.options ?? []).map((option) => `• ${option.emoji ?? ''} ${option.label}`.trim()).join('\n');
    const message = `**${poll.question}**\n${optionLines}\n\n👥 ${voteCount} người đã vote`;

    const result = await patchMattermostPost(poll.mattermostPostId, message, [
      {
        color: '#FF6353',
        text: voteUrl === null ? 'Vote trong Twenty để tham gia.' : `[Vote trong Twenty](${voteUrl})`,
        image_url: thumbnailUrl,
      },
    ]);

    if (!result.ok) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: readErrorMessage(error) };
  }
};

export default defineLogicFunction({
  universalIdentifier: REFRESH_POLL_LOGIC_FUNCTION_UID,
  name: 'moments-refresh-poll-mattermost-post',
  description: 'Route: re-renders a poll’s tally and patches its Mattermost post after a new vote.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: REFRESH_POLL_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
