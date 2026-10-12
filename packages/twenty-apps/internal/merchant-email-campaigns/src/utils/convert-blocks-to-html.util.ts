import { type EmailDesign } from '../types/email-design';
import { buildSampleTemplateVariables } from './build-sample-template-variables.util';
import { renderBlockEmailHtml } from './render-block-email-html.util';

const UNSUBSCRIBE_MARKER = 'https://unsubscribe.invalid/marker';

// Starting point for HTML mode: the block layout rendered with every {{token}}
// left as written and conditional blocks wrapped in {{#if}}. The unsubscribe
// URL goes through the URL sanitizer, so it is rendered as a marker and
// swapped back afterwards.
export const convertBlocksToHtml = (design: EmailDesign): string =>
  renderBlockEmailHtml({
    design: { ...design, mode: 'blocks' },
    subject: '',
    previewText: '',
    variables: {
      ...buildSampleTemplateVariables(),
      unsubscribeUrl: UNSUBSCRIBE_MARKER,
      preserveTokens: true,
    },
  })
    .replace(/<div style="display:none;[^"]*"><\/div>\n?/, '')
    .split(UNSUBSCRIBE_MARKER)
    .join('{{unsubscribeUrl}}');
