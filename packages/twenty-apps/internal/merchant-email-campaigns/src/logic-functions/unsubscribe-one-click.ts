import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { Response } from 'twenty-sdk/logic-function';

import { UNSUBSCRIBE_ROUTE_PATH } from '../constants/route-paths';
import { UNSUBSCRIBE_ONE_CLICK_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { pickUnsubscribePageCopy } from '../utils/pick-unsubscribe-page-copy.util';
import { renderUnsubscribePage } from '../utils/render-unsubscribe-page.util';
import { unsubscribeMerchant } from './utils/unsubscribe-merchant.util';
import { createAppClient } from './utils/create-app-client.util';

// Serves both the confirm button of the page and the RFC 8058 one-click POST
// that Gmail and Yahoo send straight from their own unsubscribe button.
const handler = async (event: RoutePayload) => {
  const isUnsubscribed = await unsubscribeMerchant(
    createAppClient(),
    event.queryStringParameters?.token,
  );

  const copy = pickUnsubscribePageCopy(event.headers?.['accept-language']);

  return new Response(
    renderUnsubscribePage(
      isUnsubscribed
        ? { lang: copy.lang, title: copy.doneTitle, message: copy.doneMessage }
        : {
            lang: copy.lang,
            title: copy.invalidTitle,
            message: copy.invalidMessage,
          },
    ),
    {
      status: isUnsubscribed ? 200 : 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    },
  );
};

export default defineLogicFunction({
  universalIdentifier: UNSUBSCRIBE_ONE_CLICK_LOGIC_FUNCTION_UID,
  name: 'unsubscribe-one-click',
  description: 'Public route: marks the merchant as unsubscribed.',
  timeoutSeconds: 15,
  httpRouteTriggerSettings: {
    path: UNSUBSCRIBE_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: false,
    forwardedRequestHeaders: ['accept-language'],
  },
  handler,
});
