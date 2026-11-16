import { type AnalyticsMetricKey } from '../types/analytics';

export type MetricText = {
  label: string;
  definition: string;
  calculation: string;
  timeBasis: string;
  filters: string;
  attribution: string;
};

// English source strings; the page passes each through t().
export const METRIC_DEFINITIONS: Record<AnalyticsMetricKey, MetricText> = {
  meetingsCompleted: {
    label: 'Meetings completed',
    definition: 'Client meetings a BC held and marked completed.',
    calculation:
      'Distinct meetings (by meeting ID) with status Completed. Attendees are not counted separately.',
    timeBasis: 'Meeting date within the selected period.',
    filters:
      'Product: meetings tagged with the product, or untagged ones of clients using it. BC: meetings the selected BCs owned.',
    attribution: 'Credited to the BC who owned the meeting.',
  },
  reviewsAcquired: {
    label: 'Reviews acquired',
    definition:
      'Verified Shopify App Store reviews earned through BC outreach.',
    calculation:
      'Distinct verified reviews with a logged BC outreach before publication. One client can review several apps.',
    timeBasis: 'Review publication date within the selected period.',
    filters:
      'Product: reviews of that app only. BC: reviews credited to the selected BCs.',
    attribution:
      'Credited BC on the review record; a request without a published review does not count.',
  },
  issuesResolved: {
    label: 'Issues resolved',
    definition: 'Client issues a BC explicitly confirmed resolved.',
    calculation:
      'Distinct issues closed with Confirm resolved. Developer task completion and dismissed false positives do not count.',
    timeBasis: 'Confirmation date within the selected period.',
    filters:
      'Product: issues naming that app, or untagged issues of clients using it. BC: issues the selected BCs confirmed.',
    attribution: 'Credited to the BC who confirmed the resolution.',
  },
  tasksCompleted: {
    label: 'Tasks completed',
    definition: 'BC tasks moved to Completed. Developer tasks are excluded.',
    calculation: 'Count of BC tasks whose completion time falls in the period.',
    timeBasis: 'Completion time within the selected period.',
    filters:
      'Product: tasks tagged with the product, or untagged ones of clients using it. BC: tasks the selected BCs own.',
    attribution: 'Task owner.',
  },
  clientsContacted: {
    label: 'Clients contacted',
    definition: 'Assigned clients who received BC-authored contact.',
    calculation:
      'Distinct clients with a BC Crisp message, email or completed meeting while assigned to the BC. Calls and review requests count as interactions, CS-only replies never count.',
    timeBasis: 'Contact date within the selected period.',
    filters:
      'Product: clients using the product. BC: contact by the selected BCs with clients they owned at the time.',
    attribution: 'BC who authored the contact.',
  },
  contactCoverage: {
    label: 'Contact coverage',
    definition: 'Share of the managed portfolio a BC reached.',
    calculation:
      'Managed clients at the period end who received BC contact during the period ÷ clients managed at the period end.',
    timeBasis:
      'Contacts within the period; portfolio as of the period end, from the PIC history.',
    filters:
      'Product: clients using the product. BC: the portfolio of the selected BCs.',
    attribution: 'BC who owned the client at the period end.',
  },
  bcInteractions: {
    label: 'BC interactions',
    definition: 'BC-authored client contacts and logged consultations.',
    calculation:
      'BC Crisp messages, emails, calls, review requests and completed meetings, counted once per source event and once when the same contact was logged twice in the same minute.',
    timeBasis: 'Contact date within the selected period.',
    filters:
      'Product: interactions tagged with the product, or untagged ones of clients using it. BC: interactions by the selected BCs.',
    attribution: 'BC who authored the contact.',
  },
  followUpsCompleted: {
    label: 'Follow-ups completed',
    definition: 'Follow-up tasks a BC completed.',
    calculation: 'BC tasks in category Follow-up moved to Completed.',
    timeBasis: 'Completion time within the selected period.',
    filters:
      'Product: tasks tagged with the product, or untagged ones of clients using it. BC: tasks the selected BCs own.',
    attribution: 'Task owner.',
  },
  upsellOpportunities: {
    label: 'Upsell opportunities',
    definition: 'Eligible upsell opportunities raised for the portfolio.',
    calculation:
      'Distinct opportunities per client, app, plan and billing cycle. The 80% alert and 100% escalation are one opportunity.',
    timeBasis: 'Opportunity creation date within the selected period.',
    filters:
      'Product: opportunities of that app. BC: clients the selected BCs owned when the opportunity was raised.',
    attribution:
      'Not attributed to a BC; an automatic opportunity does not prove BC involvement.',
  },
  bcInfluencedUpgrades: {
    label: 'BC-influenced upgrades',
    definition: 'Verified paid plan upgrades preceded by BC outreach.',
    calculation:
      'Verified upgrades marked BC influenced, with a contact by the credited BC on that client before the plan change.',
    timeBasis: 'Upgrade date within the selected period.',
    filters:
      'Product: upgrades of that app. BC: upgrades credited to the selected BCs, whoever owns the client now.',
    attribution:
      'Credited BC at the time of the upgrade; a later PIC change does not move the credit. The drilldown shows the outreach behind each credit.',
  },
  portfolioUpgrades: {
    label: 'All portfolio upgrades',
    definition: 'Every verified upgrade in the portfolio, influenced or not.',
    calculation:
      'Distinct verified upgrade events of clients the BC owned at the time. Not a measure of BC performance.',
    timeBasis: 'Upgrade date within the selected period.',
    filters:
      'Product: upgrades of that app. BC: clients the selected BCs owned at the time of the upgrade.',
    attribution:
      'Not attributed to a BC; counted in the portfolio of the PIC at the time.',
  },
  upsellConversionRate: {
    label: 'Upsell conversion',
    definition: 'Share of upsell opportunities that converted.',
    calculation:
      'Converted opportunities ÷ all opportunities, for the cohort of opportunities created in the period. Converted is set by a verified billing upgrade, not by a task outcome.',
    timeBasis: 'Cohort: opportunities created within the selected period.',
    filters:
      'Product: opportunities of that app. BC: clients the selected BCs owned when the opportunity was raised.',
    attribution:
      'Not attributed to a BC; see BC-influenced upgrades for credit.',
  },
  downgrades: {
    label: 'Downgrades',
    definition: 'Verified plan downgrades in the portfolio.',
    calculation:
      'Distinct verified downgrade events, whether or not a BC was involved.',
    timeBasis: 'Downgrade date within the selected period.',
    filters:
      'Product: downgrades of that app. BC: clients the selected BCs owned at the time.',
    attribution:
      'Not attributed to a BC; counted in the portfolio of the PIC at the time.',
  },
  uninstalls: {
    label: 'Uninstalls',
    definition: 'Verified app uninstalls in the portfolio.',
    calculation:
      'Distinct uninstall events. A client stays in the portfolio while another app is active.',
    timeBasis: 'Uninstall date within the selected period.',
    filters:
      'Product: uninstalls of that app. BC: clients the selected BCs owned at the time.',
    attribution:
      'Not attributed to a BC; counted in the portfolio of the PIC at the time.',
  },
  managedClients: {
    label: 'Managed clients',
    definition: 'VIP clients assigned to the BC.',
    calculation:
      'Distinct clients, whatever the number of apps, owned per the PIC history.',
    timeBasis: 'Snapshot as of the period end.',
    filters:
      'Product: clients using the product. BC: clients the selected BCs owned at the period end.',
    attribution: 'PIC at the period end.',
  },
  newVipClients: {
    label: 'New VIP assignments',
    definition: 'Clients assigned to a BC for the first time.',
    calculation:
      'Distinct clients whose first PIC assignment went to the BC. Transfers between BCs are counted separately.',
    timeBasis: 'Assignment date within the selected period.',
    filters:
      'Product: clients using the product. BC: assignments to the selected BCs.',
    attribution: 'BC who received the assignment.',
  },
  transferredClients: {
    label: 'Transfers in',
    definition: 'Clients moved to the BC from another PIC.',
    calculation: 'Distinct clients reassigned to the BC from another BC.',
    timeBasis: 'Reassignment date within the selected period.',
    filters:
      'Product: clients using the product. BC: transfers to the selected BCs.',
    attribution: 'BC who received the client.',
  },
  newIssues: {
    label: 'New issue incidents',
    definition: 'Client issues first detected in the period.',
    calculation:
      'Distinct issue records; several issues of one client count separately.',
    timeBasis: 'Detection date within the selected period.',
    filters:
      'Product: issues naming that app, or untagged issues of clients using it. BC: clients the selected BCs owned at detection.',
    attribution:
      'Not attributed to a BC; counted in the portfolio of the PIC at detection.',
  },
  recoveredClients: {
    label: 'Recovered clients',
    definition:
      'Clients who left At Risk because a BC confirmed their last open issue resolved.',
    calculation:
      'Distinct clients whose final open issue a BC confirmed resolved, leaving no other issue open. Dismissed false positives are not recoveries.',
    timeBasis: 'Resolution date within the selected period.',
    filters:
      'Product: issues naming that app, or untagged issues of clients using it. BC: clients the selected BCs owned at the resolution.',
    attribution: 'PIC at the time of the resolution.',
  },
  tasksCreated: {
    label: 'Tasks created',
    definition: 'BC tasks created manually or automatically.',
    calculation: 'Count of BC tasks. Developer tasks are excluded.',
    timeBasis: 'Creation date within the selected period.',
    filters:
      'Product: tasks tagged with the product, or untagged ones of clients using it. BC: tasks the selected BCs own.',
    attribution: 'Task owner.',
  },
  openTasks: {
    label: 'Open tasks',
    definition: 'BC tasks still To Do or In Progress.',
    calculation:
      'Tasks created before the period end and not completed or cancelled by then.',
    timeBasis: 'Snapshot as of the period end.',
    filters:
      'Product: tasks tagged with the product, or untagged ones of clients using it. BC: tasks the selected BCs own.',
    attribution: 'Task owner.',
  },
  automaticTasks: {
    label: 'Automatic tasks',
    definition: 'Tasks created by an automation trigger.',
    calculation: 'Tasks with source Automatic.',
    timeBasis: 'Creation date within the selected period.',
    filters:
      'Product: tasks tagged with the product, or untagged ones of clients using it. BC: tasks the selected BCs own.',
    attribution: 'Task owner.',
  },
  manualTasks: {
    label: 'Manual tasks',
    definition: 'Tasks a BC created by hand.',
    calculation: 'Tasks with source Manual.',
    timeBasis: 'Creation date within the selected period.',
    filters:
      'Product: tasks tagged with the product, or untagged ones of clients using it. BC: tasks the selected BCs own.',
    attribution: 'Task owner.',
  },
  totalMrr: {
    label: 'Total MRR',
    definition: 'Monthly recurring revenue of active paid subscriptions.',
    calculation:
      'Sum of the monthly catalog price of the plan each active app subscription held at the period end, read from the plan change history. One-time charges are excluded.',
    timeBasis: 'Snapshot as of the period end.',
    filters:
      'Product: subscriptions of that app. BC: clients the selected BCs owned at the period end.',
    attribution:
      'Not attributed to a BC; portfolio of the PIC at the period end.',
  },
  newMrr: {
    label: 'New MRR',
    definition:
      'Recurring revenue from clients that were not paying for anything yet.',
    calculation:
      'MRR increase of first paid installs and free-to-paid upgrades by clients without another active paid app.',
    timeBasis: 'Event date within the selected period.',
    filters:
      'Product: events of that app. BC: clients the selected BCs owned at the period end.',
    attribution: 'Not attributed to a BC.',
  },
  expansionMrr: {
    label: 'Expansion MRR',
    definition: 'Extra recurring revenue from paying clients.',
    calculation:
      'MRR increase of upgrades and additional paid apps by clients already paying.',
    timeBasis: 'Event date within the selected period.',
    filters:
      'Product: events of that app. BC: clients the selected BCs owned at the period end.',
    attribution:
      'Not attributed to a BC; see BC-influenced upgrades for credit.',
  },
  contractionMrr: {
    label: 'Contraction MRR',
    definition: 'Recurring revenue lost without losing the paying client.',
    calculation:
      'MRR decrease of downgrades and removed apps after which the client still pays for something.',
    timeBasis: 'Event date within the selected period.',
    filters:
      'Product: events of that app. BC: clients the selected BCs owned at the period end.',
    attribution: 'Not attributed to a BC.',
  },
  churnedMrr: {
    label: 'Churned MRR',
    definition:
      'Recurring revenue lost when a client stops paying for any app.',
    calculation:
      'MRR decrease of uninstalls, cancellations and downgrades to free that leave the client with no paid app.',
    timeBasis: 'Event date within the selected period.',
    filters:
      'Product: events of that app. BC: clients the selected BCs owned at the period end.',
    attribution: 'Not attributed to a BC.',
  },
  portfolioLifetimeRevenue: {
    label: 'Portfolio lifetime revenue',
    definition:
      'Money actually collected from the managed clients over their whole relationship.',
    calculation:
      'Collected payments minus refunds, across every app, for each managed client, counting each invoice once. Not a forecast.',
    timeBasis: 'Cumulative through the period end.',
    filters:
      'Product: narrows which clients are included; each client amount still covers all apps. BC: clients the selected BCs owned at the period end.',
    attribution: 'Not attributed to a BC.',
  },
  averageLifetimeRevenue: {
    label: 'Average lifetime revenue',
    definition: 'Average realized revenue per managed client.',
    calculation:
      'Portfolio lifetime revenue ÷ managed clients, including clients with no payment on record.',
    timeBasis: 'Cumulative through the period end.',
    filters:
      'Product: narrows which clients are included. BC: clients the selected BCs owned at the period end.',
    attribution: 'Not attributed to a BC.',
  },
};

// Tips for the charts that are not a single KPI.
export const CHART_DEFINITIONS = {
  engagementTrend: {
    label: 'Engagement trend',
    definition: 'BC interactions and completed meetings over time.',
    calculation:
      'Same records as BC interactions and Meetings completed, grouped by week up to 90 days and by month beyond.',
    timeBasis: 'Contact date, buckets in the reporting timezone.',
    filters: 'Product and BC filters apply as for BC interactions.',
    attribution: 'BC who authored the contact.',
  },
  statusSnapshot: {
    label: 'Client status',
    definition: 'How the managed clients stood at the end of the period.',
    calculation:
      'Managed clients per relationship status, replayed from the status change history.',
    timeBasis: 'Snapshot as of the period end.',
    filters:
      'Product: clients using the product. BC: clients the selected BCs owned at the period end.',
    attribution: 'PIC at the period end.',
  },
} satisfies Record<string, MetricText>;
