import { type BcMemberRole } from './bc-records';
import { type BcScope } from './bc-scope';

export type BcContextMember = {
  workspaceMemberId: string;
  name: string;
  avatarUrl: string | null;
  role: BcMemberRole;
  teamId: string | null;
  teamName: string | null;
};

export type BcContextPlan = {
  appName: string;
  planCode: string;
  label: string;
  monthlyPrice: number | null;
  rank: number | null;
  usageAllowance: number | null;
};

export type BcContextResult = {
  scope: BcScope;
  // BCs the caller may filter by or assign clients to.
  members: BcContextMember[];
  teams: { id: string; name: string }[];
  appNames: string[];
  plans: BcContextPlan[];
  settings: {
    baseCurrency: string;
    reportingTimezone: string;
    noReplyHours: number;
    isAiIssueDetectionEnabled: boolean;
  };
  now: string;
};
