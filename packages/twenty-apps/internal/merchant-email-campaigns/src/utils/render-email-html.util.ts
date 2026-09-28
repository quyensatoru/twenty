import { type EmailDesign } from '../types/email-design';
import { type TemplateVariables } from '../types/template-variables';
import { renderBlockEmailHtml } from './render-block-email-html.util';
import { renderCustomHtmlEmail } from './render-custom-html-email.util';

// The same function renders the editor preview and the message that is sent,
// so what the author sees is what the merchant receives.
export const renderEmailHtml = (input: {
  design: EmailDesign;
  subject: string;
  previewText: string;
  variables: TemplateVariables;
}): string =>
  input.design.mode === 'html'
    ? renderCustomHtmlEmail(input)
    : renderBlockEmailHtml(input);
