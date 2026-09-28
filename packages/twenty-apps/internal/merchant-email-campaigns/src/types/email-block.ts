export type EmailBlockAlign = 'left' | 'center' | 'right';

export type EmailHeadingBlock = {
  id: string;
  type: 'heading';
  text: string;
  level: 1 | 2 | 3;
  align: EmailBlockAlign;
};

export type EmailTextBlock = {
  id: string;
  type: 'text';
  text: string;
  align: EmailBlockAlign;
};

export type EmailButtonBlock = {
  id: string;
  type: 'button';
  label: string;
  url: string;
  align: EmailBlockAlign;
  backgroundColor: string;
  textColor: string;
};

export type EmailImageBlock = {
  id: string;
  type: 'image';
  src: string;
  alt: string;
  href: string;
  widthPercent: number;
  align: EmailBlockAlign;
};

export type EmailDividerBlock = {
  id: string;
  type: 'divider';
  color: string;
};

export type EmailSpacerBlock = {
  id: string;
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
