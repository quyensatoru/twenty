import { type RecordGqlOperationFilter } from 'twenty-shared/types';

export type RecordVisibilityPolicyFilter = {
  filter: RecordGqlOperationFilter;
  currentMemberFieldName: string | null;
};

// roleId -> objectMetadataId -> policy. Shape stored under the
// `recordVisibilityPolicies` workspace cache key.
export type RecordVisibilityPoliciesByRoleId = Record<
  string,
  Record<string, RecordVisibilityPolicyFilter>
>;
