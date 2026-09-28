import { type EmailSendStatus } from './email-send-status';

export type EmailSendDraft = {
  name: string;
  subject: string;
  status: EmailSendStatus;
  trigger: string;
  providerMessageId: string;
  errorMessage: string;
  sentAt: string | null;
  campaignId: string;
  merchantId: string | null;
};
