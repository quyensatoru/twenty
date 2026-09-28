import {
  DEFAULT_FROM_EMAIL_VARIABLE,
  DEFAULT_REPLY_TO_VARIABLE,
} from '../../constants/application-variable-names';
import { type CampaignRow } from '../../types/campaign-row';

export const resolveSender = (
  campaign: Pick<CampaignRow, 'fromEmail' | 'replyTo'> | null,
): { from: string; replyTo?: string } => {
  const from =
    campaign?.fromEmail?.trim() ||
    process.env[DEFAULT_FROM_EMAIL_VARIABLE]?.trim();

  if (from === undefined || from === '') {
    throw new Error(
      'No sender address: set "From" on the campaign or DEFAULT_FROM_EMAIL on the app.',
    );
  }

  const replyTo =
    campaign?.replyTo?.trim() || process.env[DEFAULT_REPLY_TO_VARIABLE]?.trim();

  return replyTo === undefined || replyTo === '' ? { from } : { from, replyTo };
};
