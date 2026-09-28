import { type EmailBlockType } from '../types/email-block';

export const BLOCK_TYPE_LABELS: Record<EmailBlockType, string> = {
  heading: 'Heading',
  text: 'Text',
  button: 'Button',
  image: 'Image',
  divider: 'Divider',
  spacer: 'Spacer',
};
