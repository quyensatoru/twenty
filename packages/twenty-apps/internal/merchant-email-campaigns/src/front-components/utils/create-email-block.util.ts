import { type EmailBlock, type EmailBlockType } from '../../types/email-block';
import { generateBlockId } from './generate-block-id.util';

export const createEmailBlock = (type: EmailBlockType): EmailBlock => {
  const id = generateBlockId();

  switch (type) {
    case 'heading':
      return { id, type, text: 'Your headline', level: 2, align: 'left' };
    case 'text':
      return {
        id,
        type,
        text: 'Write something helpful. Use **bold**, *italic* and [links](https://example.com).',
        align: 'left',
      };
    case 'button':
      return {
        id,
        type,
        label: 'Get started',
        url: 'https://',
        align: 'left',
        backgroundColor: '#1961ed',
        textColor: '#ffffff',
      };
    case 'image':
      return {
        id,
        type,
        src: '',
        alt: '',
        href: '',
        widthPercent: 100,
        align: 'center',
      };
    case 'divider':
      return { id, type, color: '#e5e7eb' };
    case 'spacer':
      return { id, type, height: 24 };
  }
};
