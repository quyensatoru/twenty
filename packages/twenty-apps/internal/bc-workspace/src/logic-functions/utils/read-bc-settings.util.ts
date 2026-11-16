import {
  AI_ISSUE_DETECTION_ENABLED_VARIABLE,
  BASE_CURRENCY_VARIABLE,
  INGEST_SECRET_VARIABLE,
  NO_REPLY_HOURS_VARIABLE,
  REPORTING_TIMEZONE_VARIABLE,
  REVIEW_ATTRIBUTION_DAYS_VARIABLE,
  UPSELL_ATTRIBUTION_DAYS_VARIABLE,
} from '../../constants/application-variable-names';

export type BcSettings = {
  ingestSecret: string;
  reportingTimezone: string;
  isAiIssueDetectionEnabled: boolean;
  noReplyHours: number;
  reviewAttributionDays: number;
  upsellAttributionDays: number;
  baseCurrency: string;
};

const readPositiveNumber = (name: string, fallback: number): number => {
  const value = Number(process.env[name]);

  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const readString = (name: string, fallback: string): string => {
  const value = process.env[name];

  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : fallback;
};

export const readBcSettings = (): BcSettings => ({
  ingestSecret: readString(INGEST_SECRET_VARIABLE, ''),
  reportingTimezone: readString(REPORTING_TIMEZONE_VARIABLE, 'Asia/Ho_Chi_Minh'),
  isAiIssueDetectionEnabled:
    readString(AI_ISSUE_DETECTION_ENABLED_VARIABLE, 'true') !== 'false',
  noReplyHours: readPositiveNumber(NO_REPLY_HOURS_VARIABLE, 72),
  reviewAttributionDays: readPositiveNumber(REVIEW_ATTRIBUTION_DAYS_VARIABLE, 60),
  upsellAttributionDays: readPositiveNumber(UPSELL_ATTRIBUTION_DAYS_VARIABLE, 90),
  baseCurrency: readString(BASE_CURRENCY_VARIABLE, 'USD'),
});
