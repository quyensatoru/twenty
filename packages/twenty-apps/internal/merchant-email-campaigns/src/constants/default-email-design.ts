import { type EmailDesign } from '../types/email-design';

export const DEFAULT_EMAIL_DESIGN: EmailDesign = {
  version: 1,
  mode: 'blocks',
  html: '',
  css: '',
  settings: {
    backgroundColor: '#f4f5f7',
    contentBackgroundColor: '#ffffff',
    textColor: '#333333',
    linkColor: '#1961ed',
    fontFamily: 'Helvetica, Arial, sans-serif',
    contentWidth: 600,
    footerText:
      'You are receiving this email because {{storeName}} uses {{appName}}.',
    unsubscribeLabel: 'Unsubscribe',
  },
  blocks: [
    {
      id: 'heading-1',
      type: 'heading',
      text: 'Welcome to {{appName}}, {{contactName|there}}!',
      level: 1,
      align: 'left',
    },
    {
      id: 'text-1',
      type: 'text',
      text: 'Thanks for installing **{{appName}}** on {{storeName}}.\n\nReply to this email if you need a hand getting started.',
      align: 'left',
    },
    {
      id: 'button-1',
      type: 'button',
      label: 'Open the app',
      url: 'https://{{shopDomain}}/admin/apps',
      align: 'left',
      backgroundColor: '#1961ed',
      textColor: '#ffffff',
    },
  ],
};
