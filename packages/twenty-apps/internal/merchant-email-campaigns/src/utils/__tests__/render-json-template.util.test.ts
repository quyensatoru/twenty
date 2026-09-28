import { describe, expect, it } from 'vitest';

import { DEFAULT_CUSTOM_EMAIL_BODY_TEMPLATE } from '../../constants/default-custom-email-body-template';
import { buildCustomEmailTemplateValues } from '../build-custom-email-template-values.util';
import { renderJsonTemplate } from '../render-json-template.util';

describe('renderJsonTemplate', () => {
  it('builds the in-house service body from an email', () => {
    const body = renderJsonTemplate(
      DEFAULT_CUSTOM_EMAIL_BODY_TEMPLATE,
      buildCustomEmailTemplateValues({
        from: 'MIDA Team <hello@mida.so>',
        to: 'owner@shop.io',
        subject: 'Hi',
        html: '<p class="x">"quoted" & more</p>',
        text: 'Hi',
        context: { shopDomain: 'shop.myshopify.com', campaignName: 'Win-back' },
      }),
    );

    expect(body).toEqual({
      toAddress: 'owner@shop.io',
      htmlData: '<p class="x">"quoted" & more</p>',
      subject: 'Hi',
      sourceEmail: 'hello@mida.so',
      replyToAddress: null,
      domain: 'shop.myshopify.com',
      oTag: 'Win-back',
    });
  });

  it('interpolates tokens inside longer strings and walks arrays', () => {
    expect(
      renderJsonTemplate(
        { tags: ['c-{{campaignId}}'], note: 'to {{to}}!', n: 3 },
        { campaignId: '7', to: 'a@b.io' },
      ),
    ).toEqual({ tags: ['c-7'], note: 'to a@b.io!', n: 3 });
  });
});
