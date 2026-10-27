import { defineApplication, FieldType } from 'twenty-sdk/define';

import {
  APPLICATION_UID,
  NOTIFICATION_EMAIL_PROVIDER_VARIABLE_UID,
  NOTIFICATION_SMTP_FROM_VARIABLE_UID,
  NOTIFICATION_SMTP_HOST_VARIABLE_UID,
  NOTIFICATION_SMTP_PASSWORD_VARIABLE_UID,
  NOTIFICATION_SMTP_PORT_VARIABLE_UID,
  NOTIFICATION_SMTP_USERNAME_VARIABLE_UID,
  NOTIFICATION_WORKFLOW_WEBHOOK_URL_VARIABLE_UID,
  RECORD_PAGE_BASE_URL_VARIABLE_UID,
} from './constants/universal-identifiers';
import {
  PRODUCT_BACKLOG_EDITOR_ROLES_VARIABLE_UID,
  PRODUCT_BACKLOG_HIDDEN_ROLES_VARIABLE_UID,
} from './constants/product-backlog';

export default defineApplication({
  universalIdentifier: APPLICATION_UID,
  displayName: 'Task Manager',
  description:
    'Jira-style issue tracking scoped by Shopify app: projects, sprints, epics, per-project statuses, worklogs and merchant links. Every read and write is filtered by the caller App Access grants.',
  applicationVariables: {
    RECORD_PAGE_BASE_URL: {
      universalIdentifier: RECORD_PAGE_BASE_URL_VARIABLE_UID,
      label: 'Front end base URL',
      description:
        'Origin this workspace is browsed at, with no trailing slash — https://crm.example.com. The copy-link buttons prefix it to the record path. Left empty they use the API server origin, which is right whenever the server also serves the front end; set it when the front end lives on another origin.',
      value: '',
    },
    NOTIFICATION_EMAIL_PROVIDER: {
      universalIdentifier: NOTIFICATION_EMAIL_PROVIDER_VARIABLE_UID,
      label: 'Notification email provider',
      description:
        // No CONNECTED_ACCOUNT option: the core sendEmail mutation requires a
        // token bound to a workspace member, which a pure application-token
        // logic function call never has — confirmed by hitting "This endpoint
        // requires a token bound to a user workspace" regardless of the
        // app's own role permissions.
        'How issue notification emails (assigned, commented, mentioned) are sent. SMTP sends directly through a mail server (e.g. Gmail SMTP relay). WORKFLOW_WEBHOOK posts each email to a workflow webhook that sends it.',
      type: FieldType.SELECT,
      options: [
        { label: 'SMTP', value: 'SMTP' },
        { label: 'Workflow webhook', value: 'WORKFLOW_WEBHOOK' },
      ],
      value: 'SMTP',
    },
    NOTIFICATION_SMTP_HOST: {
      universalIdentifier: NOTIFICATION_SMTP_HOST_VARIABLE_UID,
      label: 'SMTP host',
      description:
        'For example smtp.gmail.com. Only used when the provider is SMTP.',
      value: '',
    },
    NOTIFICATION_SMTP_PORT: {
      universalIdentifier: NOTIFICATION_SMTP_PORT_VARIABLE_UID,
      label: 'SMTP port',
      description:
        '587 for STARTTLS, 465 for implicit TLS. Only used when the provider is SMTP.',
      value: '587',
    },
    NOTIFICATION_SMTP_USERNAME: {
      universalIdentifier: NOTIFICATION_SMTP_USERNAME_VARIABLE_UID,
      label: 'SMTP username',
      description:
        'Usually the full sending address. Only used when the provider is SMTP.',
      value: '',
    },
    NOTIFICATION_SMTP_PASSWORD: {
      universalIdentifier: NOTIFICATION_SMTP_PASSWORD_VARIABLE_UID,
      label: 'SMTP password',
      description:
        'For Gmail/Google Workspace this must be an App Password, not the account password. Only used when the provider is SMTP.',
      isSecret: true,
    },
    NOTIFICATION_SMTP_FROM: {
      universalIdentifier: NOTIFICATION_SMTP_FROM_VARIABLE_UID,
      label: 'From address (SMTP)',
      description:
        'For example "Task Manager <notify@example.com>". Only used when the provider is SMTP.',
      value: '',
    },
    NOTIFICATION_WORKFLOW_WEBHOOK_URL: {
      universalIdentifier: NOTIFICATION_WORKFLOW_WEBHOOK_URL_VARIABLE_UID,
      label: 'Workflow webhook URL',
      description:
        'Only used when the provider is WORKFLOW_WEBHOOK. Receives a POST with to, subject and text.',
      isSecret: true,
    },
    PRODUCT_BACKLOG_EDITOR_ROLES: {
      universalIdentifier: PRODUCT_BACKLOG_EDITOR_ROLES_VARIABLE_UID,
      label: 'Product Backlog editor roles',
      description:
        'Workspace roles, by id or name and comma separated, that may change the Product Backlog. Admins always may; other roles only read it. Pick them in the Product Backlog Settings tab.',
      value: 'PMA',
    },
    PRODUCT_BACKLOG_HIDDEN_ROLES: {
      universalIdentifier: PRODUCT_BACKLOG_HIDDEN_ROLES_VARIABLE_UID,
      label: 'Product Backlog hidden roles',
      description:
        'Workspace roles, by id or name and comma separated, that may neither see nor change the Product Backlog. Pick them in the Product Backlog Settings tab.',
      value: 'CSE',
    },
  },
  // OAuth client credentials for the Development git integrations. The server
  // administrator registers one OAuth App on GitHub and one on GitLab and
  // fills these in on the application registration; users then connect their
  // own git accounts under Settings → Applications → Task Manager.
  serverVariables: {
    TASK_AI_STORAGE_SECRET: {
      description:
        '32-byte random hex secret for private Task AI history encryption. Keep stable across deployments.',
      isSecret: true,
      isRequired: false,
    },
    GITHUB_CLIENT_ID: {
      description: 'OAuth client ID of the GitHub OAuth App.',
      isSecret: false,
      isRequired: false,
    },
    GITHUB_CLIENT_SECRET: {
      description: 'OAuth client secret of the GitHub OAuth App.',
      isSecret: true,
      isRequired: false,
    },
    GITLAB_CLIENT_ID: {
      description: 'OAuth application ID of the GitLab OAuth application.',
      isSecret: false,
      isRequired: false,
    },
    GITLAB_CLIENT_SECRET: {
      description: 'OAuth secret of the GitLab OAuth application.',
      isSecret: true,
      isRequired: false,
    },
    GITLAB_BASE_URL: {
      description:
        'Base URL of the GitLab instance (https://git.example.com, no trailing slash). Empty means gitlab.com.',
      isSecret: false,
      isRequired: false,
    },
    GITHUB_BASE_URL: {
      description:
        'Base URL of the GitHub instance (https://github.example.com, no trailing slash). Empty means github.com.',
      isSecret: false,
      isRequired: false,
    },
  },
});
