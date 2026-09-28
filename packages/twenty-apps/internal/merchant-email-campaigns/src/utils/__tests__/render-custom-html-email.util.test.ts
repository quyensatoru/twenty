import { describe, expect, it } from 'vitest';

import { DEFAULT_EMAIL_DESIGN } from '../../constants/default-email-design';
import { buildSampleTemplateVariables } from '../build-sample-template-variables.util';
import { convertBlocksToHtml } from '../convert-blocks-to-html.util';
import { htmlToText } from '../html-to-text.util';
import { renderEmailHtml } from '../render-email-html.util';
import { renderEmailText } from '../render-email-text.util';

const variables = {
  ...buildSampleTemplateVariables(),
  storeName: 'Tom & <Jerry>',
  unsubscribeUrl:
    'https://crm.example.com/s/email-campaigns/unsubscribe?token=abc',
};

const htmlDesign = (html: string, css = '') => ({
  ...DEFAULT_EMAIL_DESIGN,
  mode: 'html' as const,
  html,
  css,
});

const render = (html: string, css = '', previewText = '') =>
  renderEmailHtml({
    design: htmlDesign(html, css),
    subject: 'Hi {{storeName}}',
    previewText,
    variables,
  });

describe('HTML mode', () => {
  it('escapes merchant values and inlines the CSS', () => {
    const html = render(
      '<p class="lead">Hello {{storeName}}</p>',
      '.lead { color: #ff0000; }',
    );

    expect(html).toContain('Tom &amp; &lt;Jerry&gt;');
    expect(html).toMatch(/<p class="lead" style="color: ?#ff0000;?">/);
  });

  it('keeps media queries in a style tag', () => {
    expect(
      render(
        '<p class="x">a</p>',
        '@media (max-width: 600px) { .x { padding: 8px; } }',
      ),
    ).toContain('@media');
  });

  it('adds the unsubscribe footer only when the author did not place the link', () => {
    expect(render('<p>a</p>')).toContain(
      'href="https://crm.example.com/s/email-campaigns/unsubscribe?token=abc"',
    );
    expect(render('<p>a</p>')).toContain('>Unsubscribe</a>');

    const own = render('<a href="{{unsubscribeUrl}}">Stop</a>');

    expect(own).toContain('>Stop</a>');
    expect(own).not.toContain('>Unsubscribe</a>');
  });

  it('wraps a fragment into a document with the preheader right after body', () => {
    const html = render('<p>a</p>', '', 'Preview {{storeName}}');

    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toMatch(
      /<body[^>]*>\s*<div style="display:none;[^"]*">Preview Tom &amp; &lt;Jerry&gt;<\/div>/,
    );
  });

  it('keeps a full document as written and strips scripts and handlers', () => {
    const html = render(
      '<html><head><title>x</title></head><body onload="x()"><p>a</p><script>alert(1)</script></body></html>',
    );

    expect(html).not.toContain('<!DOCTYPE html>\n<html lang="en">');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('onload');
  });

  it('builds a plain-text part from the HTML', () => {
    const text = renderEmailText(
      htmlDesign(
        '<h1>Hi {{contactName}}</h1><p>Visit <a href="https://x.io">our site</a></p>',
      ),
      variables,
    );

    expect(text).toContain('Hi Alex');
    expect(text).toContain('our site (https://x.io)');
    expect(text).toContain(
      'Unsubscribe (https://crm.example.com/s/email-campaigns/unsubscribe?token=abc)',
    );
  });
});

describe('convertBlocksToHtml', () => {
  it('keeps placeholders so the HTML renders like the blocks', () => {
    const html = convertBlocksToHtml(DEFAULT_EMAIL_DESIGN);

    expect(html).toContain('{{appName}}');
    expect(html).toContain('href="{{unsubscribeUrl}}"');
    expect(render(html)).toContain(
      'href="https://crm.example.com/s/email-campaigns/unsubscribe?token=abc"',
    );
  });
});

describe('htmlToText', () => {
  it('decodes entities and collapses blank lines', () => {
    expect(htmlToText('<p>a &amp; b</p>\n\n\n<p>c</p>')).toBe('a & b\n\nc');
  });
});
