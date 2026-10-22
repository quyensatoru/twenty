import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { POLL_THUMBNAIL_ROUTE_PATH } from '../constants/route-paths';
import { POLL_THUMBNAIL_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { describePollSvg } from '../utils/describe-poll-svg.util';
import { findPollById } from './utils/find-poll.util';
import { httpResponse } from './utils/http-response.util';

const handler = async (event: RoutePayload) => {
  const poll = await findPollById(event.queryStringParameters?.id);

  if (poll === null) {
    return httpResponse('Not found', { 'content-type': 'text/plain' }, 404);
  }

  return httpResponse(describePollSvg(poll), {
    'content-type': 'image/svg+xml; charset=utf-8',
    'cache-control': 'public, max-age=30',
  });
};

export default defineLogicFunction({
  universalIdentifier: POLL_THUMBNAIL_LOGIC_FUNCTION_UID,
  name: 'moments-poll-thumbnail',
  description: 'Public route: a poll rendered as an SVG bar chart, for Mattermost to fetch as the post thumbnail.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: POLL_THUMBNAIL_ROUTE_PATH,
    httpMethod: 'GET',
    isAuthRequired: false,
  },
  handler,
});
