import {
  type ActivityTopic,
  type MeetingStatus,
  type PaymentKind,
  type SubscriptionEventType,
} from './bc-records';

// Bodies the billing, usage, review and meeting systems POST. Every call is
// keyed by its own id so a retry is a no-op.

export type IngestUsageBody = {
  eventId?: string;
  shopDomain?: string;
  appName?: string;
  plan?: string;
  billingCycle?: string;
  used?: number;
  limit?: number;
  at?: string;
};

export type IngestReviewBody = {
  reviewId?: string;
  shopDomain?: string;
  appName?: string;
  rating?: number;
  publishedAt?: string;
  reviewUrl?: string | null;
  reviewerName?: string;
  body?: string;
  isVerified?: boolean;
};

export type IngestPaymentBody = {
  paymentId?: string;
  shopDomain?: string;
  appName?: string | null;
  kind?: PaymentKind;
  amount?: number;
  currency?: string;
  amountInBaseCurrency?: number;
  paidAt?: string;
  invoiceId?: string | null;
  isOneTime?: boolean;
};

export type IngestSubscriptionBody = {
  eventId?: string;
  shopDomain?: string;
  appName?: string;
  eventType?: SubscriptionEventType;
  oldPlan?: string | null;
  newPlan?: string | null;
  occurredAt?: string;
  mrrDelta?: number | null;
};

export type IngestMeetingBody = {
  meetingId?: string;
  shopDomain?: string;
  ownerEmail?: string;
  status?: MeetingStatus;
  startedAt?: string;
  title?: string;
  summary?: string | null;
  topic?: ActivityTopic;
};
