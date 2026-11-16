import { type BcMemberRole } from './bc-records';

export type SettingsTeam = {
  id: string;
  name: string;
  description: string | null;
};

export type SettingsMember = {
  id: string;
  workspaceMemberId: string | null;
  name: string;
  email: string | null;
  role: BcMemberRole;
  teamId: string | null;
  crispOperatorNames: string[];
  isActive: boolean;
};

export type SettingsPlan = {
  id: string;
  appName: string;
  planCode: string;
  name: string;
  monthlyPrice: number | null;
  rank: number | null;
  usageAllowance: number | null;
};

export type SettingsResult = {
  teams: SettingsTeam[];
  members: SettingsMember[];
  workspaceMembers: { id: string; name: string; email: string | null }[];
  plans: SettingsPlan[];
  appNames: string[];
  // Plan codes the merchant sync knows, so admins can price each of them.
  pricingPlanCodes: { value: string; label: string }[];
  // Recent credited or creditable outcomes an admin may correct (§9).
  attributionRecords: SettingsAttributionRecord[];
  integrations: {
    ingestPaths: { name: string; path: string }[];
    secretHeader: string;
    isSecretSet: boolean;
    isAiIssueDetectionEnabled: boolean;
    baseCurrency: string;
    noReplyHours: number;
  };
};

export type SettingsAttributionRecord = {
  kind: 'SUBSCRIPTION_EVENT' | 'REVIEW';
  id: string;
  label: string;
  clientName: string;
  appName: string | null;
  occurredAt: string | null;
  creditedMemberId: string | null;
  creditedMemberName: string | null;
};

export type AttributionCorrectionInput = {
  subscriptionEventId?: string | null;
  reviewId?: string | null;
  memberId?: string | null;
  reason?: string;
};

export type TeamInput = { id?: string | null; name?: string; description?: string | null };

export type MemberInput = {
  id?: string | null;
  workspaceMemberId?: string;
  teamId?: string;
  role?: BcMemberRole;
  crispOperatorNames?: string[];
  isActive?: boolean;
};

export type PlanInput = {
  id?: string | null;
  appName?: string;
  planCode?: string;
  name?: string | null;
  monthlyPrice?: number | null;
  rank?: number | null;
  usageAllowance?: number | null;
};

export type SettingsSaveBody =
  | { action: 'saveTeam'; team?: TeamInput }
  | { action: 'deleteTeam'; teamId?: string }
  | { action: 'saveMember'; member?: MemberInput }
  | { action: 'removeMember'; id?: string }
  | { action: 'savePlan'; plan?: PlanInput }
  | { action: 'deletePlan'; id?: string }
  | ({ action: 'correctAttribution' } & AttributionCorrectionInput);
