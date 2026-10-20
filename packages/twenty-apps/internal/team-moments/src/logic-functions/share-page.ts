import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { getPublicAssetUrl } from 'twenty-sdk/utils';

import { PUBLIC_BASE_URL_VARIABLE } from '../constants/application-variable-names';
import { findCardTemplate } from '../constants/card-templates';
import {
  CARD_IMAGE_ROUTE_PATH,
  SHARE_PAGE_ROUTE_PATH,
} from '../constants/route-paths';
import { SHARE_PAGE_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { buildSharePage } from '../utils/build-share-page.util';
import { describeCardSvg } from '../utils/describe-card.util';
import { readCardBackground } from '../utils/read-card-background.util';
import { resolveShareImageUrl } from '../utils/resolve-share-image-url.util';
import { findSharedCard } from './utils/find-shared-card.util';
import { httpResponse } from './utils/http-response.util';

const readHeader = (headers: Record<string, string | undefined>, name: string): string | undefined =>
  Object.entries(headers).find(([key]) => key.toLowerCase() === name)?.[1];

// Link previews need absolute image URLs. The configured public URL wins
// because the route does not always receive the Host header.
const readOrigin = (headers: Record<string, string | undefined>): string | null => {
  const configured = process.env[PUBLIC_BASE_URL_VARIABLE]?.trim().replace(/\/+$/, '');

  if (configured !== undefined && configured.length > 0) {
    return configured;
  }

  const host = readHeader(headers, 'x-forwarded-host') ?? readHeader(headers, 'host');

  if (host === undefined || host.length === 0) {
    return null;
  }

  return `${readHeader(headers, 'x-forwarded-proto')?.split(',')[0] ?? 'https'}://${host}`;
};

// Public on purpose: the link is meant for chat apps and people without a CRM
// login. Only the unguessable share token gates it, and the page shows the
// card and wish texts, never member names or anything else from the CRM.
const handler = async (event: RoutePayload) => {
  const token = event.queryStringParameters?.t;
  const shared = await findSharedCard(token);

  if (shared === null) {
    return httpResponse('Không tìm thấy thiệp.', { 'content-type': 'text/plain; charset=utf-8' }, 404);
  }

  const { card, event: storedEvent, messages } = shared;
  const origin = readOrigin(event.headers ?? {});
  const svgUrl = `${origin ?? ''}/s${CARD_IMAGE_ROUTE_PATH}?t=${card.shareToken}`;
  // The PNG thumbnail's URL is signed fresh on every read, so it is valid
  // when the chat app fetches it right after reading this page.
  const thumbnailUrl = resolveShareImageUrl(
    card.thumbnail?.[0]?.url,
    getPublicAssetUrl('team-moments-preview.png'),
    origin,
  );
  const signatureCount = (card.signatures ?? []).length;
  const backgroundImageDataUrl = await readCardBackground(card.backgroundImage?.[0]?.url);

  return httpResponse(
    buildSharePage({
      title: card.eventTitle,
      description:
        signatureCount > 0
          ? `${signatureCount} đồng đội đã ký thiệp. Mở để xem lời chúc.`
          : 'Mở để xem thiệp và lời chúc.',
      cardSvg: describeCardSvg(card, storedEvent ?? {}, backgroundImageDataUrl),
      imageUrl: thumbnailUrl,
      downloadUrl: `${svgUrl}&download=1`,
      eventDate: card.eventDate,
      wishes: messages.map((message) => message.body).filter((body) => body.trim().length > 0),
      accent: findCardTemplate(card.templateKey).ornament,
    }),
    {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=60',
    },
  );
};

export default defineLogicFunction({
  universalIdentifier: SHARE_PAGE_LOGIC_FUNCTION_UID,
  name: 'moments-share-page',
  description: 'Public route: the share page of a greeting card or invitation.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: SHARE_PAGE_ROUTE_PATH,
    httpMethod: 'GET',
    isAuthRequired: false,
  },
  handler,
});
