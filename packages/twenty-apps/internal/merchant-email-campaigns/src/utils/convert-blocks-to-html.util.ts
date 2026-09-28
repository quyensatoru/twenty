import { TEMPLATE_VARIABLE_DEFINITIONS } from '../constants/template-variable-definitions';
import { type EmailDesign } from '../types/email-design';
import { type TemplateVariables } from '../types/template-variables';
import { renderBlockEmailHtml } from './render-block-email-html.util';

const UNSUBSCRIBE_MARKER = 'https://unsubscribe.invalid/marker';

// Starting point for HTML mode: the block layout rendered with every variable
// left as its {{placeholder}}. The unsubscribe URL goes through the URL
// sanitizer, so it is rendered as a marker and swapped back afterwards.
export const convertBlocksToHtml = (design: EmailDesign): string => {
  const placeholders = Object.fromEntries(
    TEMPLATE_VARIABLE_DEFINITIONS.map(({ key }) => [key, `{{${key}}}`]),
  ) as unknown as TemplateVariables;

  return renderBlockEmailHtml({
    design: { ...design, mode: 'blocks' },
    subject: '',
    previewText: '',
    variables: { ...placeholders, unsubscribeUrl: UNSUBSCRIBE_MARKER },
  })
    .replace(/<div style="display:none;[^"]*"><\/div>\n?/, '')
    .split(UNSUBSCRIBE_MARKER)
    .join('{{unsubscribeUrl}}');
};
