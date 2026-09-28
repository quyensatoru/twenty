import { type EmailDesign } from '../types/email-design';
import { type TemplateVariables } from '../types/template-variables';
import { htmlToText } from './html-to-text.util';
import { interpolateTemplate } from './interpolate-template.util';
import { renderCustomHtmlEmail } from './render-custom-html-email.util';
import { stripInlineMarkup } from './strip-inline-markup.util';

// Plain-text alternative: spam filters score HTML-only mail worse, and some
// merchants read mail in text-only clients.
export const renderEmailText = (
  design: EmailDesign,
  variables: TemplateVariables,
): string => {
  if (design.mode === 'html') {
    return htmlToText(
      renderCustomHtmlEmail({
        design,
        subject: '',
        previewText: '',
        variables,
      }),
    );
  }

  const interpolate = (value: string) => interpolateTemplate(value, variables);
  const lines = design.blocks.flatMap((block) => {
    switch (block.type) {
      case 'heading':
      case 'text':
        return [stripInlineMarkup(interpolate(block.text)), ''];
      case 'button':
        return [`${interpolate(block.label)}: ${interpolate(block.url)}`, ''];
      case 'image':
        return block.href.trim() === ''
          ? []
          : [`${interpolate(block.alt)}: ${interpolate(block.href)}`, ''];
      case 'divider':
        return ['----------', ''];
      default:
        return [];
    }
  });

  return [
    ...lines,
    stripInlineMarkup(interpolate(design.settings.footerText)),
    `${design.settings.unsubscribeLabel}: ${variables.unsubscribeUrl}`,
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};
