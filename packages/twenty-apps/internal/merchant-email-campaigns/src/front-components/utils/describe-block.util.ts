import { type EmailBlock } from '../../types/email-block';

type Translate = (
  message: string,
  values?: Record<string, string | number>,
) => string;

const truncate = (value: string, length: number) =>
  value.length > length ? `${value.slice(0, length - 1)}…` : value;

// Takes the translator as an argument so the helper stays testable without a
// front-component context.
export const describeBlock = (
  block: EmailBlock,
  t: Translate = (message, values) =>
    message.replace(/\{(\w+)\}/g, (match, key: string) =>
      String(values?.[key] ?? match),
    ),
): string => {
  switch (block.type) {
    case 'heading':
    case 'text':
      return truncate(block.text.replace(/\s+/g, ' ').trim() || t('Empty'), 60);
    case 'button':
      return truncate(block.label || t('Button'), 60);
    case 'image':
      return block.src.trim() === ''
        ? t('No image URL yet')
        : truncate(block.src, 60);
    case 'divider':
      return t('Horizontal line');
    case 'spacer':
      return t('{height}px of space', { height: block.height });
  }
};
