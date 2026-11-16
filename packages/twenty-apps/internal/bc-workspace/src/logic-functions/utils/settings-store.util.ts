import { MetadataApiClient } from 'twenty-client-sdk/metadata';

import {
  INGEST_MEETING_ROUTE_PATH,
  INGEST_PAYMENT_ROUTE_PATH,
  INGEST_REVIEW_ROUTE_PATH,
  INGEST_SUBSCRIPTION_ROUTE_PATH,
  INGEST_USAGE_ROUTE_PATH,
} from '../../constants/route-paths';
import { MERCHANT_OBJECT_UID } from '../../constants/universal-identifiers';
import { type ApiClient } from '../../types/api-client';
import {
  type BcMemberRecord,
  type BcPlanRecord,
  type BcTeamRecord,
} from '../../types/bc-records';
import { type SettingsResult } from '../../types/settings';
import { INGEST_SECRET_HEADER } from './ingest-route.util';
import { listAllRecords } from './list-all-records.util';
import { listAppNames } from './list-app-names.util';
import { readBcSettings } from './read-bc-settings.util';
import { listAttributionRecords } from './settings-attribution.util';
import { BC_PLAN_SELECTION, BC_TEAM_SELECTION } from './record-selections';
import { BC_MEMBER_SELECTION } from './resolve-bc-scope.util';
import { listWorkspaceMembers } from './workspace-members.util';

type MetadataFieldsResult = {
  objects?: {
    edges?: {
      node?: {
        fields?: {
          edges?: { node?: { name?: string; options?: unknown } }[];
        };
      };
    }[];
  };
};

// The merchant pricingPlan select is the list of plan codes the app syncs
// write; reading its options avoids scanning every merchant row.
const readPricingPlanCodes = async (): Promise<{ value: string; label: string }[]> => {
  const result = (await new MetadataApiClient().query({
    objects: {
      __args: {
        paging: { first: 1 },
        filter: { universalIdentifier: { eq: MERCHANT_OBJECT_UID } },
      },
      edges: {
        node: {
          fields: {
            __args: { paging: { first: 200 }, filter: {} },
            edges: { node: { name: true, options: true } },
          },
        },
      },
    },
  })) as MetadataFieldsResult;
  const field = (result.objects?.edges?.[0]?.node?.fields?.edges ?? [])
    .map((edge) => edge.node)
    .find((node) => node?.name === 'pricingPlan');
  const options = Array.isArray(field?.options) ? field.options : [];

  return options.flatMap((option) =>
    typeof option?.value === 'string'
      ? [{ value: option.value, label: typeof option.label === 'string' ? option.label : option.value }]
      : [],
  );
};

export const buildSettingsResult = async (client: ApiClient): Promise<SettingsResult> => {
  const [teams, bcMembers, plans, workspaceMembers, appNames, pricingPlanCodes] =
    await Promise.all([
      listAllRecords<BcTeamRecord>({
        client,
        pluralName: 'bcTeams',
        selection: BC_TEAM_SELECTION,
        orderBy: [{ name: 'AscNullsLast' }],
      }),
      listAllRecords<BcMemberRecord>({
        client,
        pluralName: 'bcMembers',
        selection: BC_MEMBER_SELECTION,
      }),
      listAllRecords<BcPlanRecord>({
        client,
        pluralName: 'bcPlans',
        selection: BC_PLAN_SELECTION,
        orderBy: [{ appName: 'AscNullsLast' }, { rank: 'AscNullsLast' }],
      }),
      listWorkspaceMembers(client),
      listAppNames(client),
      readPricingPlanCodes().catch(() => []),
    ]);
  const memberById = new Map(workspaceMembers.map((member) => [member.id, member]));
  const settings = readBcSettings();
  const attributionRecords = await listAttributionRecords(
    client,
    new Map(workspaceMembers.map((member) => [member.id, member.name])),
  );

  return {
    teams: teams.map((team) => ({
      id: team.id,
      name: team.name ?? '',
      description: team.description,
    })),
    members: bcMembers
      .map((member) => {
        const workspaceMember =
          member.memberId === null ? undefined : memberById.get(member.memberId);

        return {
          id: member.id,
          workspaceMemberId: member.memberId,
          name: workspaceMember?.name ?? member.name ?? '',
          email: workspaceMember?.email ?? null,
          role: member.memberRole,
          teamId: member.teamId,
          crispOperatorNames: member.crispOperatorNames ?? [],
          isActive: member.isActive,
        };
      })
      .sort((left, right) => left.name.localeCompare(right.name)),
    workspaceMembers: workspaceMembers
      .map((member) => ({ id: member.id, name: member.name, email: member.email }))
      .sort((left, right) => left.name.localeCompare(right.name)),
    plans: plans
      .filter((plan) => plan.appName !== null && plan.planCode !== null)
      .map((plan) => ({
        id: plan.id,
        appName: plan.appName as string,
        planCode: plan.planCode as string,
        name: plan.name ?? (plan.planCode as string),
        monthlyPrice: plan.monthlyPrice,
        rank: plan.rank,
        usageAllowance: plan.usageAllowance,
      })),
    appNames,
    pricingPlanCodes,
    attributionRecords,
    integrations: {
      ingestPaths: [
        { name: 'Usage', path: `/s${INGEST_USAGE_ROUTE_PATH}` },
        { name: 'Reviews', path: `/s${INGEST_REVIEW_ROUTE_PATH}` },
        { name: 'Payments', path: `/s${INGEST_PAYMENT_ROUTE_PATH}` },
        { name: 'Subscriptions', path: `/s${INGEST_SUBSCRIPTION_ROUTE_PATH}` },
        { name: 'Meetings', path: `/s${INGEST_MEETING_ROUTE_PATH}` },
      ],
      secretHeader: INGEST_SECRET_HEADER,
      isSecretSet: settings.ingestSecret.length > 0,
      isAiIssueDetectionEnabled: settings.isAiIssueDetectionEnabled,
      baseCurrency: settings.baseCurrency,
      noReplyHours: settings.noReplyHours,
    },
  };
};
