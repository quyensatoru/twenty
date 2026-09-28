import { type MerchantEmailBuildResult } from '../types/merchant-email-build-result';
import { type MerchantRow } from '../types/merchant-row';
import { type TemplateRow } from '../types/template-row';
import { buildTemplateVariables } from './build-template-variables.util';
import { interpolateTemplate } from './interpolate-template.util';
import { isValidEmail } from './is-valid-email.util';
import { parseEmailDesign } from './parse-email-design.util';
import { readMerchantEmail } from './read-merchant-email.util';
import { renderEmailHtml } from './render-email-html.util';
import { renderEmailText } from './render-email-text.util';

export const buildMerchantEmail = ({
  template,
  merchant,
  appName,
  unsubscribeUrl,
  from,
  replyTo,
  headers,
  tags,
  context,
  eventProperties,
}: {
  template: TemplateRow;
  merchant: MerchantRow;
  appName: string;
  unsubscribeUrl: string;
  from: string;
  replyTo?: string;
  headers?: Record<string, string>;
  tags?: { name: string; value: string }[];
  context?: Record<string, string>;
  eventProperties?: Record<string, string>;
}): MerchantEmailBuildResult => {
  const to = readMerchantEmail(merchant);

  if (to === null || !isValidEmail(to)) {
    return {
      kind: 'SKIPPED',
      reason: 'Merchant has no valid email',
      to: to ?? '',
    };
  }

  if (merchant.emailUnsubscribed === true) {
    return { kind: 'SKIPPED', reason: 'Merchant unsubscribed', to };
  }

  const variables = {
    ...buildTemplateVariables({ merchant, appName, unsubscribeUrl }),
    eventProperties,
  };
  const design = parseEmailDesign(template.design);
  const subjectTemplate = template.subject?.trim() ?? '';

  if (subjectTemplate === '') {
    return { kind: 'SKIPPED', reason: 'Template has no subject', to };
  }

  const subject = interpolateTemplate(subjectTemplate, variables).trim();

  return {
    kind: 'READY',
    to,
    subject,
    email: {
      from,
      to,
      subject,
      html: renderEmailHtml({
        design,
        subject: subjectTemplate,
        previewText: template.previewText ?? '',
        variables,
      }),
      text: renderEmailText(design, variables),
      ...(replyTo === undefined ? {} : { replyTo }),
      ...(headers === undefined ? {} : { headers }),
      ...(tags === undefined ? {} : { tags }),
      context: {
        ...context,
        shopDomain: variables.shopDomain,
        merchantId: merchant.id,
        unsubscribeUrl,
      },
    },
  };
};
