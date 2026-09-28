import { type EmailDesignSettings } from '../types/email-design';
import { type TemplateVariables } from '../types/template-variables';
import { escapeHtml } from './escape-html.util';
import { interpolateTemplate } from './interpolate-template.util';
import { renderInlineMarkup } from './render-inline-markup.util';
import { sanitizeUrl } from './sanitize-url.util';

export const renderUnsubscribeFooterHtml = (
  settings: EmailDesignSettings,
  variables: TemplateVariables,
): string => {
  const footerText = renderInlineMarkup(
    interpolateTemplate(settings.footerText, variables),
    settings.linkColor,
  );

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:16px 32px;font-family:${escapeHtml(settings.fontFamily)};font-size:12px;line-height:1.5;color:#8a8f98;text-align:center;">${footerText}<br /><a href="${escapeHtml(sanitizeUrl(variables.unsubscribeUrl))}" style="color:#8a8f98;text-decoration:underline;">${escapeHtml(settings.unsubscribeLabel)}</a></td></tr></table>`;
};
