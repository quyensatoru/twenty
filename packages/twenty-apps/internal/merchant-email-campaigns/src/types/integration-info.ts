import { type EmailProviderName } from './email-provider-name';

export type RecentMerchantEvent = {
  id: string;
  name: string;
  email: string;
  domain: string;
  status: string;
  campaignsQueued: number;
  occurredAt: string | null;
  merchantName: string;
};

export type IntegrationInfo = {
  eventsUrl: string;
  isInboundKeySet: boolean;
  provider: EmailProviderName;
  providerError: string | null;
  recentEvents: RecentMerchantEvent[];
};
