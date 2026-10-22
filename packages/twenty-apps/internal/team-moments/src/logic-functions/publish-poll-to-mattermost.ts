import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { PUBLIC_BASE_URL_VARIABLE } from '../constants/application-variable-names';
import { POLL_THUMBNAIL_ROUTE_PATH, PUBLISH_POLL_ROUTE_PATH } from '../constants/route-paths';
import { PUBLISH_POLL_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { buildPollAnchor } from '../utils/polls-anchor.util';
import { findPollById } from './utils/find-poll.util';
import { findPollsPagePath } from './utils/find-polls-page-path.util';
import { postToMattermost } from './utils/mattermost-client.util';
import { readErrorMessage } from './utils/read-error-message.util';

const readHeader = (headers: Record<string, string | undefined>, name: string): string | undefined =>
  Object.entries(headers).find(([key]) => key.toLowerCase() === name)?.[1];

// Same origin resolution as the card share page: the configured public URL
// wins because a server-invoked route never receives a real Host header.
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

type PublishPollBody = { pollId?: string; channelId?: string | null };

// Posts a freshly created poll to Mattermost. Voting happens back in Twenty
// (authenticated, real member identity), not in Mattermost itself, so this
// route only ever needs to send a message with a thumbnail and a link.
const handler = async (event: RoutePayload<PublishPollBody>) => {
  try {
    const pollId = event.body?.pollId;
    const poll = await findPollById(pollId);

    if (poll === null) {
      return { success: false, error: 'Poll not found.' };
    }

    const origin = readOrigin(event.headers ?? {});
    const [pollsPagePath] = await Promise.all([findPollsPagePath()]);
    const voteUrl = pollsPagePath === null ? null : `${origin ?? ''}${pollsPagePath}${buildPollAnchor(poll.id)}`;
    const thumbnailUrl = `${origin ?? ''}/s${POLL_THUMBNAIL_ROUTE_PATH}?id=${poll.id}`;

    // The question only: the option list and live tally already live in the
    // thumbnail image, so repeating them as plain text just doubles the post.
    const message = `📊 **${poll.question}**`;

    // A linked image (`[![alt](src)](href)`), not the `image_url` attachment
    // field: Mattermost renders that field as a plain thumbnail that only
    // opens a lightbox on click, with no way to attach a URL to it.
    const result = await postToMattermost(event.body?.channelId ?? null, message, [
      {
        color: '#FF6353',
        text:
          voteUrl === null
            ? `![Kết quả poll](${thumbnailUrl})`
            : `[![Kết quả poll](${thumbnailUrl})](${voteUrl})`,
      },
    ]);

    if (!result.ok) {
      return { success: false, error: result.error };
    }

    return { success: true, mattermostPostId: result.postId, mattermostChannelId: result.channelId };
  } catch (error) {
    return { success: false, error: readErrorMessage(error) };
  }
};

export default defineLogicFunction({
  universalIdentifier: PUBLISH_POLL_LOGIC_FUNCTION_UID,
  name: 'moments-publish-poll-to-mattermost',
  description: 'Route: posts a poll to Mattermost with a thumbnail and a link back into Twenty.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: PUBLISH_POLL_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
