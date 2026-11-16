import { defineLogicFunction } from 'twenty-sdk/define';

import { CONTEXT_ROUTE_PATH } from '../constants/route-paths';
import { CONTEXT_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import {
  type BcMemberRecord,
  type BcPlanRecord,
  type BcTeamRecord,
} from '../types/bc-records';
import { type BcContextResult } from '../types/bc-context';
import { listAllRecords } from './utils/list-all-records.util';
import { listAppNames } from './utils/list-app-names.util';
import { readBcSettings } from './utils/read-bc-settings.util';
import {
  BC_PLAN_SELECTION,
  BC_TEAM_SELECTION,
} from './utils/record-selections';
import { BC_MEMBER_SELECTION } from './utils/resolve-bc-scope.util';
import { runBcRoute } from './utils/run-bc-route.util';
import { listWorkspaceMembers } from './utils/workspace-members.util';

const handler = async () =>
  runBcRoute(async ({ client, scope }) => {
    const [bcMembers, teams, plans, workspaceMembers, appNames] =
      await Promise.all([
        listAllRecords<BcMemberRecord>({
          client,
          pluralName: 'bcMembers',
          filter: { isActive: { eq: true } },
          selection: BC_MEMBER_SELECTION,
        }),
        listAllRecords<BcTeamRecord>({
          client,
          pluralName: 'bcTeams',
          selection: BC_TEAM_SELECTION,
        }),
        listAllRecords<BcPlanRecord>({
          client,
          pluralName: 'bcPlans',
          selection: BC_PLAN_SELECTION,
          orderBy: [{ appName: 'AscNullsLast' }, { rank: 'AscNullsLast' }],
        }),
        listWorkspaceMembers(client),
        listAppNames(client),
      ]);

    const memberById = new Map(workspaceMembers.map((member) => [member.id, member]));
    const teamNameById = new Map(teams.map((team) => [team.id, team.name ?? '']));
    const visible = scope.visibleMemberIds;
    const seen = new Set<string>();
    const members: BcContextResult['members'] = [];

    for (const bcMember of bcMembers) {
      if (
        bcMember.memberId === null ||
        seen.has(bcMember.memberId) ||
        (visible !== null && !visible.includes(bcMember.memberId))
      ) {
        continue;
      }

      seen.add(bcMember.memberId);

      const workspaceMember = memberById.get(bcMember.memberId);

      members.push({
        workspaceMemberId: bcMember.memberId,
        name: workspaceMember?.name ?? bcMember.name ?? '',
        avatarUrl: workspaceMember?.avatarUrl ?? null,
        role: bcMember.memberRole,
        teamId: bcMember.teamId,
        teamName:
          bcMember.teamId === null ? null : (teamNameById.get(bcMember.teamId) ?? null),
      });
    }

    members.sort((left, right) => left.name.localeCompare(right.name));

    const settings = readBcSettings();
    const result: BcContextResult = {
      scope,
      members,
      teams: teams
        .filter((team) => scope.visibleMemberIds === null || scope.teamIds.includes(team.id))
        .map((team) => ({ id: team.id, name: team.name ?? '' })),
      appNames,
      plans: plans
        .filter((plan) => plan.appName !== null && plan.planCode !== null)
        .map((plan) => ({
          appName: plan.appName as string,
          planCode: plan.planCode as string,
          label: plan.name ?? (plan.planCode as string),
          // Prices drive MRR, which only managers may see.
          monthlyPrice: scope.canSeeFinance ? plan.monthlyPrice : null,
          rank: plan.rank,
          usageAllowance: plan.usageAllowance,
        })),
      settings: {
        baseCurrency: settings.baseCurrency,
        reportingTimezone: settings.reportingTimezone,
        noReplyHours: settings.noReplyHours,
        isAiIssueDetectionEnabled: settings.isAiIssueDetectionEnabled,
      },
      now: new Date().toISOString(),
    };

    return result;
  });

export default defineLogicFunction({
  universalIdentifier: CONTEXT_LOGIC_FUNCTION_UID,
  name: 'bc-context',
  description:
    "Route: the caller's BC scope, the BCs they may filter or assign, products and plan catalog.",
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: CONTEXT_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
