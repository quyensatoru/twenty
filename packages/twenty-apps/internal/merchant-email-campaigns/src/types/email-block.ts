import { type TemplateCondition } from './template-condition';

export type EmailBlockAlign = 'left' | 'center' | 'right';

export type EmailHeadingBlock = {
  id: string;
  // Rendered only for merchants matching every condition.
  showIf?: TemplateCondition[];
  type: 'heading';
  text: string;
  level: 1 | 2 | 3;
  align: EmailBlockAlign;
};

export type EmailTextBlock = {
  id: string;
  showIf?: TemplateCondition[];
  type: 'text';
  text: string;
  align: EmailBlockAlign;
};

export type EmailButtonBlock = {
  id: string;
  showIf?: TemplateCondition[];
  type: 'button';
  label: string;
  url: string;
  align: EmailBlockAlign;
  backgroundColor: string;
  textColor: string;
};

export type EmailImageBlock = {
  id: string;
  showIf?: TemplateCondition[];
  type: 'image';
  src: string;
  alt: string;
  href: string;
  widthPercent: number;
  align: EmailBlockAlign;
};

export type EmailDividerBlock = {
  id: string;
  showIf?: TemplateCondition[];
  type: 'divider';
  color: string;
};

export type EmailSpacerBlock = {
  id: string;
  showIf?: TemplateCondition[];
  type: 'spacer';
  height: number;
};

export type EmailBlock =
  | EmailHeadingBlock
  | EmailTextBlock
  | EmailButtonBlock
  | EmailImageBlock
  | EmailDividerBlock
  | EmailSpacerBlock;

export type EmailBlockType = EmailBlock['type'];
