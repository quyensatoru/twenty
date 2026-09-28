import { describe, expect, it } from 'vitest';

import { DEFAULT_EMAIL_DESIGN } from '../../constants/default-email-design';
import { buildSampleTemplateVariables } from '../build-sample-template-variables.util';
import { renderEmailHtml } from '../render-email-html.util';
import { renderEmailText } from '../render-email-text.util';

const variables = {
  ...buildSampleTemplateVariables(),
  storeName: 'Tom & <Jerry>',
  unsubscribeUrl:
    'https://crm.example.com/s/email-campaigns/unsubscribe?token=abc',
};

describe('renderEmailHtml', () => {
  const html = renderEmailHtml({
    design: DEFAULT_EMAIL_DESIGN,
    subject: 'Welcome {{storeName}}',
    previewText: 'Hello {{storeName}}',
    variables,
  });

  it('escapes merchant data', () => {
    expect(html).toContain('Tom &amp; &lt;Jerry&gt;');
    expect(html).not.toContain('<Jerry>');
  });

  it('always includes the unsubscribe link', () => {
    expect(html).toContain(
      'href="https://crm.example.com/s/email-campaigns/unsubscribe?token=abc"',
    );
  });

  it('interpolates variables inside button links', () => {
    expect(html).toContain(
      'href="https://demo-store.myshopify.com/admin/apps"',
    );
  });

  it('skips images without a source', () => {
    const withImage = renderEmailHtml({
      design: {
        ...DEFAULT_EMAIL_DESIGN,
        blocks: [
          {
            id: 'i',
            type: 'image',
            src: '',
            alt: '',
            href: '',
            widthPercent: 100,
            align: 'center',
          },
        ],
      },
      subject: 's',
      previewText: '',
      variables,
    });

    expect(withImage).not.toContain('<img');
  });
});

describe('renderEmailText', () => {
  it('strips markup and ends with the unsubscribe url', () => {
    const text = renderEmailText(DEFAULT_EMAIL_DESIGN, variables);

    expect(text).toContain('Thanks for installing MIDA');
    expect(text).not.toContain('**');
    expect(text.endsWith(`Unsubscribe: ${variables.unsubscribeUrl}`)).toBe(
      true,
    );
  });
});
