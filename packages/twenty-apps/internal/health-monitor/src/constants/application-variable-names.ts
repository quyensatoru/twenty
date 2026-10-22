// Named so the Settings UI's alphabetical-by-key sort reads in a sensible
// order (it ignores declaration order in this file/application.config.ts
// entirely): provider, then every SMTP setting, then the webhook
// alternative, then the two settings that aren't about transport at all.
export const EMAIL_PROVIDER_VARIABLE = 'ALERT_EMAIL_PROVIDER';
export const ALERT_SMTP_HOST_VARIABLE = 'ALERT_EMAIL_SMTP_HOST';
export const ALERT_SMTP_PORT_VARIABLE = 'ALERT_EMAIL_SMTP_PORT';
export const ALERT_SMTP_USERNAME_VARIABLE = 'ALERT_EMAIL_SMTP_USERNAME';
export const ALERT_SMTP_PASSWORD_VARIABLE = 'ALERT_EMAIL_SMTP_PASSWORD';
export const ALERT_FROM_EMAIL_VARIABLE = 'ALERT_EMAIL_SMTP_FROM';
export const ALERT_WORKFLOW_WEBHOOK_URL_VARIABLE = 'ALERT_EMAIL_WORKFLOW_WEBHOOK_URL';
export const ALERT_EMAIL_LANGUAGE_VARIABLE = 'ALERT_LANGUAGE';
export const PUBLIC_BASE_URL_VARIABLE = 'PUBLIC_BASE_URL';
