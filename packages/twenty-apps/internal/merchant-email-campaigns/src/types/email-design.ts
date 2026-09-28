import { type EmailBlock } from './email-block';
import { type EmailDesignMode } from './email-design-mode';

export type EmailDesignSettings = {
  backgroundColor: string;
  contentBackgroundColor: string;
  textColor: string;
  linkColor: string;
  fontFamily: string;
  contentWidth: number;
  footerText: string;
  unsubscribeLabel: string;
};

// Both editors keep their content side by side, so switching mode never
// throws work away; `mode` only decides which one is rendered and sent.
export type EmailDesign = {
  version: 1;
  mode: EmailDesignMode;
  settings: EmailDesignSettings;
  blocks: EmailBlock[];
  html: string;
  css: string;
};
