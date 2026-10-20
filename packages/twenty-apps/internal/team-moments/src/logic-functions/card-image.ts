import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { CARD_IMAGE_ROUTE_PATH } from '../constants/route-paths';
import { CARD_IMAGE_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { describeCardSvg } from '../utils/describe-card.util';
import { readCardBackground } from '../utils/read-card-background.util';
import { findSharedCard } from './utils/find-shared-card.util';
import { httpResponse } from './utils/http-response.util';

// The card as an SVG file: the share page's thumbnail and the download.
const handler = async (event: RoutePayload) => {
  const shared = await findSharedCard(event.queryStringParameters?.t);

  if (shared === null) {
    return httpResponse('Not found', { 'content-type': 'text/plain' }, 404);
  }

  const headers: Record<string, string> = {
    'content-type': 'image/svg+xml; charset=utf-8',
    'cache-control': 'public, max-age=60',
  };

  if (event.queryStringParameters?.download === '1') {
    headers['content-disposition'] = 'attachment; filename="thiep.svg"';
  }

  const backgroundImageDataUrl = await readCardBackground(shared.card.backgroundImage?.[0]?.url);

  return httpResponse(describeCardSvg(shared.card, shared.event ?? {}, backgroundImageDataUrl), headers);
};

export default defineLogicFunction({
  universalIdentifier: CARD_IMAGE_LOGIC_FUNCTION_UID,
  name: 'moments-card-image',
  description: 'Public route: a shared card rendered as SVG.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: CARD_IMAGE_ROUTE_PATH,
    httpMethod: 'GET',
    isAuthRequired: false,
  },
  handler,
});
