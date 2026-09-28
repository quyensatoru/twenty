import { defineApplication, FieldType } from 'twenty-sdk/define';

import { DEFAULT_CUSTOM_EMAIL_BODY_TEMPLATE } from './constants/default-custom-email-body-template';

import {
  CAMPAIGN_SENDERS_VARIABLE,
  CUSTOM_EMAIL_BODY_TEMPLATE_VARIABLE,
  CUSTOM_EMAIL_ENDPOINT_VARIABLE,
  CUSTOM_EMAIL_HEADERS_VARIABLE,
  EMAIL_PROVIDER_VARIABLE,
  INBOUND_EVENTS_API_KEY_VARIABLE,
  DEFAULT_FROM_EMAIL_VARIABLE,
  DEFAULT_REPLY_TO_VARIABLE,
  PUBLIC_SERVER_URL_VARIABLE,
  RESEND_API_KEY_VARIABLE,
  UNSUBSCRIBE_SECRET_VARIABLE,
} from './constants/application-variable-names';
import {
  APPLICATION_UID,
  CAMPAIGN_SENDERS_VARIABLE_UID,
  CUSTOM_EMAIL_BODY_TEMPLATE_VARIABLE_UID,
  CUSTOM_EMAIL_ENDPOINT_VARIABLE_UID,
  CUSTOM_EMAIL_HEADERS_VARIABLE_UID,
  EMAIL_PROVIDER_VARIABLE_UID,
  INBOUND_EVENTS_API_KEY_VARIABLE_UID,
  DEFAULT_FROM_EMAIL_VARIABLE_UID,
  DEFAULT_REPLY_TO_VARIABLE_UID,
  PUBLIC_SERVER_URL_VARIABLE_UID,
  RESEND_API_KEY_VARIABLE_UID,
  UNSUBSCRIBE_SECRET_VARIABLE_UID,
} from './constants/universal-identifiers';

export default defineApplication({
  universalIdentifier: APPLICATION_UID,
  displayName: 'Merchant Email Campaigns',
  description:
    'Email marketing for merchants: automations on install, uninstall and plan changes, one-off broadcasts to a segment, and a block-based template editor. Sends through Resend.',
  applicationVariables: {
    [EMAIL_PROVIDER_VARIABLE]: {
      universalIdentifier: EMAIL_PROVIDER_VARIABLE_UID,
      label: 'Email provider',
      description:
        'RESEND sends through Resend. CUSTOM_HTTP posts every email to your own service (CUSTOM_EMAIL_* variables).',
      type: FieldType.SELECT,
      options: [
        { label: 'Resend', value: 'RESEND' },
        { label: 'Custom HTTP service', value: 'CUSTOM_HTTP' },
      ],
      value: 'RESEND',
    },
    [RESEND_API_KEY_VARIABLE]: {
      universalIdentifier: RESEND_API_KEY_VARIABLE_UID,
      label: 'Resend API key',
      description:
        'Key with sending access, from resend.com > API Keys. Only used when the provider is RESEND.',
      isSecret: true,
    },
    [DEFAULT_FROM_EMAIL_VARIABLE]: {
      universalIdentifier: DEFAULT_FROM_EMAIL_VARIABLE_UID,
      label: 'Default From',
      description:
        'Used when a campaign leaves From empty, e.g. "MIDA Team <hello@mida.so>". The domain must be verified in Resend.',
    },
    [DEFAULT_REPLY_TO_VARIABLE]: {
      universalIdentifier: DEFAULT_REPLY_TO_VARIABLE_UID,
      label: 'Default Reply-To',
      description: 'Optional address replies go to.',
    },
    [UNSUBSCRIBE_SECRET_VARIABLE]: {
      universalIdentifier: UNSUBSCRIBE_SECRET_VARIABLE_UID,
      label: 'Unsubscribe link secret',
      description:
        'Any long random string that signs unsubscribe links. Set it before the first send: changing it breaks every link already delivered.',
      isSecret: true,
    },
    [PUBLIC_SERVER_URL_VARIABLE]: {
      universalIdentifier: PUBLIC_SERVER_URL_VARIABLE_UID,
      label: 'Public server URL',
      description:
        'Public base URL of this Twenty server for unsubscribe links, e.g. https://crm.example.com. Defaults to the server URL.',
    },
    [CAMPAIGN_SENDERS_VARIABLE]: {
      universalIdentifier: CAMPAIGN_SENDERS_VARIABLE_UID,
      label: 'Allowed campaign senders',
      description:
        'Comma-separated member emails allowed to launch campaigns, or * for everyone. Members with the Applications permission are always allowed.',
    },
    [CUSTOM_EMAIL_ENDPOINT_VARIABLE]: {
      universalIdentifier: CUSTOM_EMAIL_ENDPOINT_VARIABLE_UID,
      label: 'Custom email endpoint',
      description:
        'URL each email is POSTed to when the provider is CUSTOM_HTTP.',
    },
    [CUSTOM_EMAIL_HEADERS_VARIABLE]: {
      universalIdentifier: CUSTOM_EMAIL_HEADERS_VARIABLE_UID,
      label: 'Custom email headers',
      description:
        'JSON object of request headers, e.g. {"Authorization": "Bearer ..."}. Content-Type is always application/json.',
      isSecret: true,
    },
    [CUSTOM_EMAIL_BODY_TEMPLATE_VARIABLE]: {
      universalIdentifier: CUSTOM_EMAIL_BODY_TEMPLATE_VARIABLE_UID,
      label: 'Custom email body template',
      description:
        'JSON body with {{tokens}}: to, from, fromEmail, fromName, replyTo, subject, html, text, unsubscribeUrl, shopDomain, campaignId, campaignName, merchantId, idempotencyKey. A value that is exactly one token becomes null when empty.',
      value: JSON.stringify(DEFAULT_CUSTOM_EMAIL_BODY_TEMPLATE),
    },
    [INBOUND_EVENTS_API_KEY_VARIABLE]: {
      universalIdentifier: INBOUND_EVENTS_API_KEY_VARIABLE_UID,
      label: 'Inbound events API key',
      description:
        'Other apps send it in the `api-key` header when posting events. Any long random string.',
      isSecret: true,
    },
  },
});
