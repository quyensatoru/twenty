import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { Response } from 'twenty-sdk/logic-function';

import { UNSUBSCRIBE_ROUTE_PATH } from '../constants/route-paths';
import { UNSUBSCRIBE_PAGE_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { pickUnsubscribePageCopy } from '../utils/pick-unsubscribe-page-copy.util';
import { renderUnsubscribePage } from '../utils/render-unsubscribe-page.util';

// GET only shows a confirm button. Corporate link scanners open every URL in a
// mail, and unsubscribing on GET would silently opt those merchants out.
const handler = async (event: RoutePayload) => {
  const token = event.queryStringParameters?.token ?? '';
  const copy = pickUnsubscribePageCopy(event.headers?.['accept-language']);

  return new Response(
    renderUnsubscribePage({
      lang: copy.lang,
      title: copy.confirmTitle,
      message: copy.confirmMessage,
      buttonLabel: copy.confirmButton,
      formAction: `?token=${encodeURIComponent(token)}`,
    }),
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
};

export default defineLogicFunction({
  universalIdentifier: UNSUBSCRIBE_PAGE_LOGIC_FUNCTION_UID,
  name: 'unsubscribe-page',
  description: 'Public route: shows the unsubscribe confirmation page.',
  timeoutSeconds: 15,
  httpRouteTriggerSettings: {
    path: UNSUBSCRIBE_ROUTE_PATH,
    httpMethod: 'GET',
    isAuthRequired: false,
    forwardedRequestHeaders: ['accept-language'],
  },
  handler,
});
