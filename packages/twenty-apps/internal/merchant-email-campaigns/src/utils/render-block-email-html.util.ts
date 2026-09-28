import { type EmailDesign } from '../types/email-design';
import { type TemplateVariables } from '../types/template-variables';
import { escapeHtml } from './escape-html.util';
import { interpolateTemplate } from './interpolate-template.util';
import { renderEmailBlockHtml } from './render-email-block-html.util';
import { renderInlineMarkup } from './render-inline-markup.util';
import { sanitizeUrl } from './sanitize-url.util';

// Block-mode layout. Table based with inline styles only: Outlook and Gmail
// drop flexbox and are unreliable with <style>.
export const renderBlockEmailHtml = ({
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
  const { settings } = design;
  const width = Math.min(800, Math.max(320, settings.contentWidth));
  const fontFamily = escapeHtml(settings.fontFamily);
  const blocksHtml = design.blocks
    .map((block) => renderEmailBlockHtml(block, settings, variables))
    .join('');
  const footerText = renderInlineMarkup(
    interpolateTemplate(settings.footerText, variables),
    settings.linkColor,
  );
  const unsubscribeHref = escapeHtml(sanitizeUrl(variables.unsubscribeUrl));
  const preheader = escapeHtml(interpolateTemplate(previewText, variables));

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<title>${escapeHtml(interpolateTemplate(subject, variables))}</title>
</head>
<body style="margin:0;padding:0;background:${escapeHtml(settings.backgroundColor)};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${escapeHtml(settings.backgroundColor)};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="${width}" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:${width}px;background:${escapeHtml(settings.contentBackgroundColor)};border-radius:8px;font-family:${fontFamily};">
<tr><td style="height:24px;font-size:0;line-height:0;">&nbsp;</td></tr>
${blocksHtml}
<tr><td style="height:24px;font-size:0;line-height:0;">&nbsp;</td></tr>
</table>
<table role="presentation" width="${width}" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:${width}px;font-family:${fontFamily};">
<tr><td style="padding:16px 32px;font-size:12px;line-height:1.5;color:#8a8f98;text-align:center;">${footerText}<br /><a href="${unsubscribeHref}" style="color:#8a8f98;text-decoration:underline;">${escapeHtml(settings.unsubscribeLabel)}</a></td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
};
