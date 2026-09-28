import { type EmailDesign } from '../types/email-design';
import { type TemplateVariables } from '../types/template-variables';
import { escapeHtml } from './escape-html.util';
import { hasUnsubscribePlaceholder } from './has-unsubscribe-placeholder.util';
import { inlineEmailCss } from './inline-email-css.util';
import { interpolateTemplate } from './interpolate-template.util';
import { renderUnsubscribeFooterHtml } from './render-unsubscribe-footer-html.util';
import { stripUnsafeHtml } from './strip-unsafe-html.util';

const insertAfterOpeningTag = (html: string, tag: string, content: string) => {
  const match = html.match(new RegExp(`<${tag}\\b[^>]*>`, 'i'));

  return match?.index === undefined
    ? `${content}${html}`
    : `${html.slice(0, match.index + match[0].length)}${content}${html.slice(match.index + match[0].length)}`;
};

const insertBeforeClosingTag = (html: string, tag: string, content: string) => {
  const index = html.search(new RegExp(`</${tag}\\s*>`, 'i'));

  return index === -1
    ? `${html}${content}`
    : `${html.slice(0, index)}${content}${html.slice(index)}`;
};

// HTML mode: the author's markup is used as written. Merchant values are
// escaped as they are interpolated, so a store name cannot inject markup. An
// unsubscribe footer is appended unless the author placed {{unsubscribeUrl}}
// themselves, so no template can go out without a way to opt out.
export const renderCustomHtmlEmail = ({
  design,
  subject,
  previewText,
  variables,
}: {
  design: EmailDesign;
  subject: string;
  previewText: string;
  variables: TemplateVariables;
}): string => {
  const source = stripUnsafeHtml(design.html);
  const body = interpolateTemplate(source, variables, escapeHtml);
  const isFullDocument = /<html\b/i.test(body);
  const title = escapeHtml(interpolateTemplate(subject, variables));
  const css = design.css.replace(/<\/style/gi, '<\\/style');
  let document = isFullDocument
    ? body
    : `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1" />\n<title>${title}</title>\n</head>\n<body style="margin:0;padding:0;">\n${body}\n</body>\n</html>`;

  if (css.trim() !== '') {
    document = /<head\b/i.test(document)
      ? insertBeforeClosingTag(document, 'head', `<style>\n${css}\n</style>\n`)
      : `<style>\n${css}\n</style>\n${document}`;
  }

  const preheader = interpolateTemplate(previewText, variables).trim();

  if (preheader !== '') {
    document = insertAfterOpeningTag(
      document,
      'body',
      `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>`,
    );
  }

  if (!hasUnsubscribePlaceholder(source)) {
    document = insertBeforeClosingTag(
      document,
      'body',
      renderUnsubscribeFooterHtml(design.settings, variables),
    );
  }

  return inlineEmailCss(document);
};
