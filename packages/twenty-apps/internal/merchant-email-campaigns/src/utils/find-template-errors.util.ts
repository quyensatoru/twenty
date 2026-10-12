import { type EmailBlock } from '../types/email-block';
import { type EmailDesign } from '../types/email-design';
import { isTemplateConditionValid } from './template-condition.util';
import { findTemplateTextError } from './template-sections.util';

const readBlockTexts = (block: EmailBlock): string[] => {
  switch (block.type) {
    case 'heading':
    case 'text':
      return [block.text];
    case 'button':
      return [block.label, block.url];
    case 'image':
      return [block.src, block.alt, block.href];
    default:
      return [];
  }
};

// Checked in the editor as the author types and again before every send, so
// a broken {{#if}} is never mailed with both branches showing.
export const findTemplateErrors = ({
  subject,
  previewText,
  design,
}: {
  subject: string;
  previewText: string;
  design: EmailDesign;
}): string[] => {
  const errors: string[] = [];
  const check = (label: string, text: string) => {
    const error = findTemplateTextError(text);

    if (error !== null) {
      errors.push(`${label}: ${error}`);
    }
  };

  check('Subject', subject);
  check('Preview text', previewText);
  check('Footer', design.settings.footerText);

  if (design.mode === 'html') {
    check('HTML', design.html);

    return errors;
  }

  design.blocks.forEach((block, index) => {
    const label = `Block ${index + 1}`;

    readBlockTexts(block).forEach((text) => check(label, text));

    if (
      block.showIf?.some((condition) => !isTemplateConditionValid(condition))
    ) {
      errors.push(`${label}: a "Show if" condition cannot be read`);
    }
  });

  return errors;
};
