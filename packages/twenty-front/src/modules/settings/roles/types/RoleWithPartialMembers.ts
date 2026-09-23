import { type RecordVisibilityPolicy } from '@/settings/roles/role-permissions/object-level-permissions/record-visibility-policy/types/RecordVisibilityPolicy';
import { type Role, type WorkspaceMember } from '~/generated-metadata/graphql';

export type PartialWorkspaceMember = Omit<
  WorkspaceMember,
  | 'colorScheme'
  | 'uiScale'
  | 'openRecordIn'
  | 'locale'
  | 'timeZone'
  | 'dateFormat'
  | 'timeFormat'
  | 'calendarStartDay'
  | 'createdAt'
  | 'updatedAt'
>;

export type RoleWithPartialMembers = Omit<
  Role,
  'workspaceMembers' | 'recordVisibilityPolicies'
> & {
  workspaceMembers: PartialWorkspaceMember[];
  recordVisibilityPolicies?: RecordVisibilityPolicy[] | null;
};
