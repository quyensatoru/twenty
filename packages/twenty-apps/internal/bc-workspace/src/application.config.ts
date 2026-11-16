import { defineApplication, FieldType } from 'twenty-sdk/define';

import {
  AI_ISSUE_DETECTION_ENABLED_VARIABLE,
  BASE_CURRENCY_VARIABLE,
  INGEST_SECRET_VARIABLE,
  NO_REPLY_HOURS_VARIABLE,
  REPORTING_TIMEZONE_VARIABLE,
  REVIEW_ATTRIBUTION_DAYS_VARIABLE,
  UPSELL_ATTRIBUTION_DAYS_VARIABLE,
} from './constants/application-variable-names';
import {
  AI_ISSUE_DETECTION_ENABLED_VARIABLE_UID,
  APPLICATION_UID,
  BASE_CURRENCY_VARIABLE_UID,
  INGEST_SECRET_VARIABLE_UID,
  NO_REPLY_HOURS_VARIABLE_UID,
  REPORTING_TIMEZONE_VARIABLE_UID,
  REVIEW_ATTRIBUTION_DAYS_VARIABLE_UID,
  UPSELL_ATTRIBUTION_DAYS_VARIABLE_UID,
} from './constants/universal-identifiers';

export default defineApplication({
  universalIdentifier: APPLICATION_UID,
  displayName: 'BC Workspace',
  description:
    'VIP client dashboard, balanced analytics and personal task management for Business Consultants, with AI issue detection from Crisp and usage-based upsell tasks.',
  applicationVariables: {
    [INGEST_SECRET_VARIABLE]: {
      universalIdentifier: INGEST_SECRET_VARIABLE_UID,
      label: 'Ingest secret',
      description:
        'Shared secret the billing, usage and review systems send in the x-bc-ingest-secret header. Ingest routes reject every call while it is empty.',
      isSecret: true,
    },
    [REPORTING_TIMEZONE_VARIABLE]: {
      universalIdentifier: REPORTING_TIMEZONE_VARIABLE_UID,
      label: 'Reporting timezone',
      description:
        'IANA timezone that bounds every reporting day, e.g. Asia/Ho_Chi_Minh.',
      value: 'Asia/Ho_Chi_Minh',
    },
    [AI_ISSUE_DETECTION_ENABLED_VARIABLE]: {
      universalIdentifier: AI_ISSUE_DETECTION_ENABLED_VARIABLE_UID,
      label: 'AI issue detection',
      description:
        'Whether customer Crisp messages of VIP clients are classified by AI to open issues and tasks automatically.',
      type: FieldType.BOOLEAN,
      value: true,
    },
    [NO_REPLY_HOURS_VARIABLE]: {
      universalIdentifier: NO_REPLY_HOURS_VARIABLE_UID,
      label: 'No-reply follow-up after (hours)',
      description:
        'Hours without a client reply to a BC message before the client moves to Follow-up and a follow-up task is created.',
      value: '72',
    },
    [REVIEW_ATTRIBUTION_DAYS_VARIABLE]: {
      universalIdentifier: REVIEW_ATTRIBUTION_DAYS_VARIABLE_UID,
      label: 'Review attribution window (days)',
      description:
        'How long before a review a BC review request still earns the credit.',
      value: '60',
    },
    [UPSELL_ATTRIBUTION_DAYS_VARIABLE]: {
      universalIdentifier: UPSELL_ATTRIBUTION_DAYS_VARIABLE_UID,
      label: 'Upgrade attribution window (days)',
      description:
        'How long before an upgrade a BC upsell outreach still earns the credit.',
      value: '90',
    },
    [BASE_CURRENCY_VARIABLE]: {
      universalIdentifier: BASE_CURRENCY_VARIABLE_UID,
      label: 'Base currency',
      description: 'Currency of plan prices, MRR and collected payments.',
      value: 'USD',
    },
  },
});
