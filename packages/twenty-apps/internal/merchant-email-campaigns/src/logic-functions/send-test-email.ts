import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { SEND_TEST_EMAIL_ROUTE_PATH } from '../constants/route-paths';
import { SEND_TEST_EMAIL_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { sendOneEmail } from '../email-provider/send-one-email';
import { type TemplateVariables } from '../types/template-variables';
import { buildSampleTemplateVariables } from '../utils/build-sample-template-variables.util';
import { buildTemplateVariables } from '../utils/build-template-variables.util';
import { interpolateTemplate } from '../utils/interpolate-template.util';
import { isValidEmail } from '../utils/is-valid-email.util';
import { parseEmailDesign } from '../utils/parse-email-design.util';
import { readErrorMessage } from '../utils/read-error-message.util';
import { renderEmailHtml } from '../utils/render-email-html.util';
import { renderEmailText } from '../utils/render-email-text.util';
import { buildUnsubscribeUrl } from './utils/build-unsubscribe-url.util';
import { fetchMerchant } from './utils/fetch-merchant.util';
import { resolveSender } from './utils/resolve-sender.util';
import { createAppClient } from './utils/create-app-client.util';

type SendTestEmailBody = {
  to?: string;
  subject?: string;
  previewText?: string;
  design?: unknown;
  merchantId?: string;
  fromEmail?: string;
  replyTo?: string;
};

// Takes the design from the request rather than from the saved template, so
// the author can check an unsaved draft in a real inbox.
const handler = async (event: RoutePayload<SendTestEmailBody>) => {
  try {
    const body = event.body ?? {};
    const to = body.to?.trim() ?? '';

    if (!isValidEmail(to)) {
      return { success: false, error: 'Enter a valid recipient address.' };
    }

    if (!body.subject?.trim()) {
      return { success: false, error: 'The template needs a subject.' };
    }

    let variables: TemplateVariables = buildSampleTemplateVariables();

    if (body.merchantId) {
      const merchant = await fetchMerchant(createAppClient(), body.merchantId);

      if (merchant !== null) {
        variables = buildTemplateVariables({
          merchant,
          appName: merchant.app?.name ?? '',
          unsubscribeUrl: buildUnsubscribeUrl(merchant.id),
        });
      }
    }

    const design = parseEmailDesign(body.design);
    const { from, replyTo } = resolveSender({
      fromEmail: body.fromEmail,
      replyTo: body.replyTo,
    });
    const result = await sendOneEmail({
      from,
      to,
      replyTo,
      subject: `[Test] ${interpolateTemplate(body.subject, variables)}`,
      html: renderEmailHtml({
        design,
        subject: body.subject,
        previewText: body.previewText ?? '',
        variables,
      }),
      text: renderEmailText(design, variables),
      context: {
        shopDomain: variables.shopDomain,
        campaignName: 'Test send',
        unsubscribeUrl: variables.unsubscribeUrl,
      },
    });

    return result.ok
      ? { success: true, providerMessageId: result.id }
      : { success: false, error: result.error };
  } catch (error) {
    return { success: false, error: readErrorMessage(error) };
  }
};

export default defineLogicFunction({
  universalIdentifier: SEND_TEST_EMAIL_LOGIC_FUNCTION_UID,
  name: 'send-test-email',
  description:
    'Route: sends the current editor draft to one address, marked [Test].',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: SEND_TEST_EMAIL_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
