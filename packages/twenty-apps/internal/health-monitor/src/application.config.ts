import { defineApplication, FieldType } from 'twenty-sdk/define';

import {
  ALERT_CONNECTED_ACCOUNT_VARIABLE,
  ALERT_EMAIL_LANGUAGE_VARIABLE,
  ALERT_FROM_EMAIL_VARIABLE,
  ALERT_WORKFLOW_WEBHOOK_URL_VARIABLE,
  EMAIL_PROVIDER_VARIABLE,
  PUBLIC_BASE_URL_VARIABLE,
  RESEND_API_KEY_VARIABLE,
} from './constants/application-variable-names';
import {
  ALERT_CONNECTED_ACCOUNT_VARIABLE_UID,
  ALERT_FROM_EMAIL_VARIABLE_UID,
  ALERT_WORKFLOW_WEBHOOK_URL_VARIABLE_UID,
  APPLICATION_UID,
  EMAIL_PROVIDER_VARIABLE_UID,
  HEALTH_ALERT_EMAIL_LANGUAGE_VARIABLE_UID,
  PUBLIC_BASE_URL_VARIABLE_UID,
  RESEND_API_KEY_VARIABLE_UID,
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
        'CONNECTED_ACCOUNT sends through a workspace-shared connected email account. RESEND sends through Resend. WORKFLOW_WEBHOOK posts each email to a workflow webhook that sends it.',
      type: FieldType.SELECT,
      options: [
        { label: 'Connected account', value: 'CONNECTED_ACCOUNT' },
        { label: 'Resend', value: 'RESEND' },
        { label: 'Workflow webhook', value: 'WORKFLOW_WEBHOOK' },
      ],
      value: 'CONNECTED_ACCOUNT',
    },
    [ALERT_CONNECTED_ACCOUNT_VARIABLE]: {
      universalIdentifier: ALERT_CONNECTED_ACCOUNT_VARIABLE_UID,
      label: 'Connected account id',
      description:
        'Id of the connected account alerts are sent from. It must be shared with the workspace: the app has no user of its own.',
      value: '',
    },
    [RESEND_API_KEY_VARIABLE]: {
      universalIdentifier: RESEND_API_KEY_VARIABLE_UID,
      label: 'Resend API key',
      description: 'Only used when the provider is RESEND.',
      isSecret: true,
    },
    [ALERT_FROM_EMAIL_VARIABLE]: {
      universalIdentifier: ALERT_FROM_EMAIL_VARIABLE_UID,
      label: 'From address (Resend)',
      description:
        'For example "MIDA Health <health@mida.so>". The domain must be verified in Resend.',
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
