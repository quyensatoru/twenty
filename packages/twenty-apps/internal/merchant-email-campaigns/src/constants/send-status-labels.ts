import { type EmailSendStatus } from '../types/email-send-status';

export const SEND_STATUS_LABELS: Record<EmailSendStatus, string> = {
  SENT: 'Sent',
  FAILED: 'Failed',
  SKIPPED: 'Skipped',
};
