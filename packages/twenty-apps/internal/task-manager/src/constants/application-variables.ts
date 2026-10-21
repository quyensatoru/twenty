// Keyed by name, not by universalIdentifier: getApplicationVariable reads the
// manifest key. Declared in src/application.config.ts.
export const RECORD_PAGE_BASE_URL_VARIABLE = 'RECORD_PAGE_BASE_URL';

// Which transport sends issue notification emails (assigned, commented,
// mentioned): SMTP / RESEND / WORKFLOW_WEBHOOK. Read via process.env in
// logic functions, same as every other application variable. No
// CONNECTED_ACCOUNT option — the core sendEmail mutation requires a token
// bound to a workspace member, which a pure application-token call never has.
export const NOTIFICATION_EMAIL_PROVIDER_VARIABLE =
  'NOTIFICATION_EMAIL_PROVIDER';
export const NOTIFICATION_RESEND_API_KEY_VARIABLE =
  'NOTIFICATION_RESEND_API_KEY';
export const NOTIFICATION_FROM_EMAIL_VARIABLE = 'NOTIFICATION_FROM_EMAIL';
export const NOTIFICATION_WORKFLOW_WEBHOOK_URL_VARIABLE =
  'NOTIFICATION_WORKFLOW_WEBHOOK_URL';
export const NOTIFICATION_SMTP_HOST_VARIABLE = 'NOTIFICATION_SMTP_HOST';
export const NOTIFICATION_SMTP_PORT_VARIABLE = 'NOTIFICATION_SMTP_PORT';
export const NOTIFICATION_SMTP_USERNAME_VARIABLE =
  'NOTIFICATION_SMTP_USERNAME';
export const NOTIFICATION_SMTP_PASSWORD_VARIABLE =
  'NOTIFICATION_SMTP_PASSWORD';
export const NOTIFICATION_SMTP_FROM_VARIABLE = 'NOTIFICATION_SMTP_FROM';
