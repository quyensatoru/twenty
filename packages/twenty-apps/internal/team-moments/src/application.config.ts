import { defineApplication, FieldType } from 'twenty-sdk/define';

import {
  NOTIFICATION_EMAIL_PROVIDER_VARIABLE,
  NOTIFICATION_SMTP_FROM_VARIABLE,
  NOTIFICATION_SMTP_HOST_VARIABLE,
  NOTIFICATION_SMTP_PASSWORD_VARIABLE,
  NOTIFICATION_SMTP_PORT_VARIABLE,
  NOTIFICATION_SMTP_USERNAME_VARIABLE,
  NOTIFICATION_WORKFLOW_WEBHOOK_URL_VARIABLE,
  PUBLIC_BASE_URL_VARIABLE,
} from './constants/application-variable-names';
import {
  APPLICATION_UID,
  NOTIFICATION_EMAIL_PROVIDER_VARIABLE_UID,
  NOTIFICATION_SMTP_FROM_VARIABLE_UID,
  NOTIFICATION_SMTP_HOST_VARIABLE_UID,
  NOTIFICATION_SMTP_PASSWORD_VARIABLE_UID,
  NOTIFICATION_SMTP_PORT_VARIABLE_UID,
  NOTIFICATION_SMTP_USERNAME_VARIABLE_UID,
  NOTIFICATION_WORKFLOW_WEBHOOK_URL_VARIABLE_UID,
  PUBLIC_BASE_URL_VARIABLE_UID,
} from './constants/universal-identifiers';

export default defineApplication({
  universalIdentifier: APPLICATION_UID,
  displayName: 'Team Moments',
  description:
    'Countdowns for holidays, member birthdays and work anniversaries, with a chat room, a shared greeting card and a share link for every occasion.',
  applicationVariables: {
    [PUBLIC_BASE_URL_VARIABLE]: {
      universalIdentifier: PUBLIC_BASE_URL_VARIABLE_UID,
      label: 'Public server URL',
      description:
        'Origin the share links are opened from, with no trailing slash, e.g. https://crm.example.com. Link previews need absolute image URLs; left empty, the request host is used.',
      value: '',
    },
    [NOTIFICATION_EMAIL_PROVIDER_VARIABLE]: {
      universalIdentifier: NOTIFICATION_EMAIL_PROVIDER_VARIABLE_UID,
      label: 'Mention email provider',
      description:
        'How @mention email notifications are sent. SMTP sends directly through a mail server (e.g. Gmail SMTP relay). WORKFLOW_WEBHOOK posts each email to a workflow webhook that sends it.',
      type: FieldType.SELECT,
      options: [
        { label: 'SMTP', value: 'SMTP' },
        { label: 'Workflow webhook', value: 'WORKFLOW_WEBHOOK' },
      ],
      value: 'SMTP',
    },
    [NOTIFICATION_SMTP_HOST_VARIABLE]: {
      universalIdentifier: NOTIFICATION_SMTP_HOST_VARIABLE_UID,
      label: 'SMTP host',
      description:
        'For example smtp.gmail.com. Only used when the provider is SMTP.',
      value: '',
    },
    [NOTIFICATION_SMTP_PORT_VARIABLE]: {
      universalIdentifier: NOTIFICATION_SMTP_PORT_VARIABLE_UID,
      label: 'SMTP port',
      description:
        '587 for STARTTLS, 465 for implicit TLS. Only used when the provider is SMTP.',
      value: '587',
    },
    [NOTIFICATION_SMTP_USERNAME_VARIABLE]: {
      universalIdentifier: NOTIFICATION_SMTP_USERNAME_VARIABLE_UID,
      label: 'SMTP username',
      description:
        'Usually the full sending address. Only used when the provider is SMTP.',
      value: '',
    },
    [NOTIFICATION_SMTP_PASSWORD_VARIABLE]: {
      universalIdentifier: NOTIFICATION_SMTP_PASSWORD_VARIABLE_UID,
      label: 'SMTP password',
      description:
        'For Gmail/Google Workspace this must be an App Password, not the account password. Only used when the provider is SMTP.',
      isSecret: true,
    },
    [NOTIFICATION_SMTP_FROM_VARIABLE]: {
      universalIdentifier: NOTIFICATION_SMTP_FROM_VARIABLE_UID,
      label: 'From address (SMTP)',
      description:
        'For example "Team Moments <notify@example.com>". Only used when the provider is SMTP.',
      value: '',
    },
    [NOTIFICATION_WORKFLOW_WEBHOOK_URL_VARIABLE]: {
      universalIdentifier: NOTIFICATION_WORKFLOW_WEBHOOK_URL_VARIABLE_UID,
      label: 'Workflow webhook URL',
      description:
        'Only used when the provider is WORKFLOW_WEBHOOK. Receives a POST with to, subject and text.',
      isSecret: true,
    },
  },
});
