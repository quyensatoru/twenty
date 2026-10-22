import { defineApplication, FieldType } from 'twenty-sdk/define';

import {
  ALERT_EMAIL_LANGUAGE_VARIABLE,
  ALERT_FROM_EMAIL_VARIABLE,
  ALERT_SMTP_HOST_VARIABLE,
  ALERT_SMTP_PASSWORD_VARIABLE,
  ALERT_SMTP_PORT_VARIABLE,
  ALERT_SMTP_USERNAME_VARIABLE,
  ALERT_WORKFLOW_WEBHOOK_URL_VARIABLE,
  EMAIL_PROVIDER_VARIABLE,
  PUBLIC_BASE_URL_VARIABLE,
} from './constants/application-variable-names';
import {
  ALERT_FROM_EMAIL_VARIABLE_UID,
  ALERT_SMTP_HOST_VARIABLE_UID,
  ALERT_SMTP_PASSWORD_VARIABLE_UID,
  ALERT_SMTP_PORT_VARIABLE_UID,
  ALERT_SMTP_USERNAME_VARIABLE_UID,
  ALERT_WORKFLOW_WEBHOOK_URL_VARIABLE_UID,
  APPLICATION_UID,
  EMAIL_PROVIDER_VARIABLE_UID,
  HEALTH_ALERT_EMAIL_LANGUAGE_VARIABLE_UID,
  PUBLIC_BASE_URL_VARIABLE_UID,
} from './constants/universal-identifiers';

export default defineApplication({
  universalIdentifier: APPLICATION_UID,
  displayName: 'Health Monitor',
  description:
    'Polls the health endpoint of each Task Manager app in the background, keeps a short history for charts and emails the chosen people when a server or pm2 process crosses its thresholds.',
  applicationVariables: {
    [EMAIL_PROVIDER_VARIABLE]: {
      universalIdentifier: EMAIL_PROVIDER_VARIABLE_UID,
      label: 'Email provider',
      description:
        // No CONNECTED_ACCOUNT option: the core sendEmail mutation requires a
        // token bound to a workspace member, which a pure application-token
        // logic function call never has — confirmed by hitting "This endpoint
        // requires a token bound to a user workspace" regardless of the
        // app's own role permissions.
        'SMTP sends directly through a mail server (e.g. Gmail SMTP relay). WORKFLOW_WEBHOOK posts each email to a workflow webhook that sends it.',
      type: FieldType.SELECT,
      options: [
        { label: 'SMTP', value: 'SMTP' },
        { label: 'Workflow webhook', value: 'WORKFLOW_WEBHOOK' },
      ],
      value: 'SMTP',
    },
    [ALERT_SMTP_HOST_VARIABLE]: {
      universalIdentifier: ALERT_SMTP_HOST_VARIABLE_UID,
      label: 'SMTP host',
      description:
        'For example smtp.gmail.com. Only used when the provider is SMTP.',
      value: '',
    },
    [ALERT_SMTP_PORT_VARIABLE]: {
      universalIdentifier: ALERT_SMTP_PORT_VARIABLE_UID,
      label: 'SMTP port',
      description:
        '587 for STARTTLS, 465 for implicit TLS. Only used when the provider is SMTP.',
      value: '587',
    },
    [ALERT_SMTP_USERNAME_VARIABLE]: {
      universalIdentifier: ALERT_SMTP_USERNAME_VARIABLE_UID,
      label: 'SMTP username',
      description:
        'Usually the full sending address. Only used when the provider is SMTP.',
      value: '',
    },
    [ALERT_SMTP_PASSWORD_VARIABLE]: {
      universalIdentifier: ALERT_SMTP_PASSWORD_VARIABLE_UID,
      label: 'SMTP password',
      description:
        'For Gmail/Google Workspace this must be an App Password, not the account password. Only used when the provider is SMTP.',
      isSecret: true,
    },
    [ALERT_FROM_EMAIL_VARIABLE]: {
      universalIdentifier: ALERT_FROM_EMAIL_VARIABLE_UID,
      label: 'From address',
      description:
        'For example "MIDA Health <health@mida.so>". Only used when the provider is SMTP.',
      value: '',
    },
    [ALERT_WORKFLOW_WEBHOOK_URL_VARIABLE]: {
      universalIdentifier: ALERT_WORKFLOW_WEBHOOK_URL_VARIABLE_UID,
      label: 'Workflow webhook URL',
      description:
        'Only used when the provider is WORKFLOW_WEBHOOK. Receives a POST with to, subject and text.',
      isSecret: true,
    },
    [ALERT_EMAIL_LANGUAGE_VARIABLE]: {
      universalIdentifier: HEALTH_ALERT_EMAIL_LANGUAGE_VARIABLE_UID,
      label: 'Alert email language',
      description: 'Language of alert and recovery emails.',
      type: FieldType.SELECT,
      options: [
        { label: 'English', value: 'en' },
        { label: 'Vietnamese', value: 'vi-VN' },
      ],
      value: 'en',
    },
    [PUBLIC_BASE_URL_VARIABLE]: {
      universalIdentifier: PUBLIC_BASE_URL_VARIABLE_UID,
      label: 'Public CRM URL',
      description:
        'Origin used for the dashboard link in alert emails, e.g. https://crm.example.com. Left empty, emails carry no link.',
      value: '',
    },
  },
});
