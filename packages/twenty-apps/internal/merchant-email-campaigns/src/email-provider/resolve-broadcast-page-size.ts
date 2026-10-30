import { BROADCAST_BATCH_SIZE } from '../constants/send-limits';
import { readCustomEmailMaxPerMinute } from '../custom-http-client/read-custom-email-max-per-minute';
import { readEmailProviderName } from './read-email-provider-name';

// A paced page must fit in one batch job, so it holds at most a minute of sends.
export const resolveBroadcastPageSize = (): number =>
  readEmailProviderName() === 'CUSTOM_HTTP'
    ? Math.min(BROADCAST_BATCH_SIZE, readCustomEmailMaxPerMinute())
    : BROADCAST_BATCH_SIZE;
