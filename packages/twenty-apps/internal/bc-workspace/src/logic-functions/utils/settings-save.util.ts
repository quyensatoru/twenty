import { type ApiClient } from '../../types/api-client';
import { type BcMemberRecord, type BcPlanRecord } from '../../types/bc-records';
import {
  type MemberInput,
  type PlanInput,
  type SettingsSaveBody,
  type TeamInput,
} from '../../types/settings';
import { listAllRecords } from './list-all-records.util';
import { correctAttribution } from './settings-attribution.util';
import { BC_PLAN_SELECTION } from './record-selections';
import {
  createRecord,
  deleteRecord,
  updateRecord,
} from './record-store.util';
import { BC_MEMBER_SELECTION } from './resolve-bc-scope.util';
import { listWorkspaceMembers } from './workspace-members.util';

const requireId = (value: unknown, name: string): string => {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing ${name}.`);
  }

  return value;
};

const readOptionalNumber = (value: unknown, name: string): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`${name} must be a positive number.`);
  }

  return number;
};

export const normalizeOperatorNames = (names: unknown): string[] =>
  Array.isArray(names)
    ? [
        ...new Set(
          names
            .filter((name): name is string => typeof name === 'string')
            .map((name) => name.trim().replace(/\s+/g, ' '))
            .filter((name) => name.length > 0),
        ),
      ]
    : [];

const saveTeam = async (client: ApiClient, team: TeamInput | undefined) => {
  const name = team?.name?.trim() ?? '';

  if (name.length === 0) {
    throw new Error('A team needs a name.');
  }

  const data = { name, description: team?.description?.trim() || null };

  if (typeof team?.id === 'string' && team.id.length > 0) {
    await updateRecord({ client, objectNameSingular: 'bcTeam', id: team.id, data });
  } else {
    await createRecord({ client, objectNameSingular: 'bcTeam', data, selection: { id: true } });
  }
};

// A team's memberships go with it: a membership without a team would leave
// its BC in a scope nobody manages.
const deleteTeam = async (client: ApiClient, teamId: string) => {
  const memberships = await listAllRecords<BcMemberRecord>({
    client,
    pluralName: 'bcMembers',
    filter: { teamId: { eq: teamId } },
    selection: { id: true },
  });

  for (const membership of memberships) {
    await deleteRecord({ client, objectNameSingular: 'bcMember', id: membership.id });
  }

  await deleteRecord({ client, objectNameSingular: 'bcTeam', id: teamId });
};

const saveMember = async (client: ApiClient, member: MemberInput | undefined) => {
  const workspaceMemberId = requireId(member?.workspaceMemberId, 'workspace member');
  const teamId = requireId(member?.teamId, 'team');
  const role = member?.role === 'MANAGER' ? 'MANAGER' : member?.role === 'BC' ? 'BC' : null;

  if (role === null) {
    throw new Error('Role must be BC or MANAGER.');
  }

  const existing = await listAllRecords<BcMemberRecord>({
    client,
    pluralName: 'bcMembers',
    filter: { memberId: { eq: workspaceMemberId }, teamId: { eq: teamId } },
    selection: BC_MEMBER_SELECTION,
  });
  const memberId = typeof member?.id === 'string' && member.id.length > 0 ? member.id : null;

  if (existing.some((membership) => membership.id !== memberId)) {
    throw new Error('This person is already in the team.');
  }

  const workspaceMember = (await listWorkspaceMembers(client)).find(
    (candidate) => candidate.id === workspaceMemberId,
  );

  if (workspaceMember === undefined) {
    throw new Error('This workspace member no longer exists.');
  }

  const data = {
    name: workspaceMember.name,
    memberId: workspaceMemberId,
    teamId,
    memberRole: role,
    crispOperatorNames: normalizeOperatorNames(member?.crispOperatorNames),
    isActive: member?.isActive !== false,
  };

  if (memberId !== null) {
    await updateRecord({ client, objectNameSingular: 'bcMember', id: memberId, data });
  } else {
    await createRecord({ client, objectNameSingular: 'bcMember', data, selection: { id: true } });
  }
};

const savePlan = async (client: ApiClient, plan: PlanInput | undefined) => {
  const appName = plan?.appName?.trim().toUpperCase() ?? '';
  const planCode = plan?.planCode?.trim() ?? '';

  if (appName.length === 0 || planCode.length === 0) {
    throw new Error('A plan needs an app and a plan code.');
  }

  const planId = typeof plan?.id === 'string' && plan.id.length > 0 ? plan.id : null;
  const duplicates = await listAllRecords<BcPlanRecord>({
    client,
    pluralName: 'bcPlans',
    filter: { appName: { eq: appName }, planCode: { eq: planCode } },
    selection: BC_PLAN_SELECTION,
  });

  if (duplicates.some((duplicate) => duplicate.id !== planId)) {
    throw new Error('This app already has a plan with that code.');
  }

  const data = {
    appName,
    planCode,
    name: plan?.name?.trim() || planCode,
    monthlyPrice: readOptionalNumber(plan?.monthlyPrice, 'Monthly price'),
    rank: readOptionalNumber(plan?.rank, 'Rank'),
    usageAllowance: readOptionalNumber(plan?.usageAllowance, 'Usage allowance'),
  };

  if (planId !== null) {
    await updateRecord({ client, objectNameSingular: 'bcPlan', id: planId, data });
  } else {
    await createRecord({ client, objectNameSingular: 'bcPlan', data, selection: { id: true } });
  }
};

export const applySettingsChange = async (
  client: ApiClient,
  body: SettingsSaveBody,
  actorMemberId: string | null = null,
): Promise<void> => {
  switch (body.action) {
    case 'correctAttribution':
      return correctAttribution({ client, input: body, actorMemberId });
    case 'saveTeam':
      return saveTeam(client, body.team);
    case 'deleteTeam':
      return deleteTeam(client, requireId(body.teamId, 'team'));
    case 'saveMember':
      return saveMember(client, body.member);
    case 'removeMember':
      return deleteRecord({
        client,
        objectNameSingular: 'bcMember',
        id: requireId(body.id, 'membership'),
      });
    case 'savePlan':
      return savePlan(client, body.plan);
    case 'deletePlan':
      return deleteRecord({
        client,
        objectNameSingular: 'bcPlan',
        id: requireId(body.id, 'plan'),
      });
    default:
      throw new Error('Unknown settings action.');
  }
};
