import { type FieldMetadataType } from 'twenty-shared/types';

// Flat, AND-only local UI state for one Record Visibility Policy — a
// deliberately simpler shape than RLS's RecordFilter/RecordFilterGroup
// (which support arbitrary nested and/or), matching the equally simplified
// single-jsonb-column backend model (see RECORD_VISIBILITY_POLICY_SPEC.md §4
// and §7). Converted to/from the backend's RecordGqlOperationFilter by
// recordVisibilityPolicyConversion.ts.
export type RecordVisibilityPolicyStaticCondition = {
  id: string;
  fieldMetadataId: string;
  fieldName: string;
  fieldType: FieldMetadataType;
  // Raw text as typed by the user; parsed per fieldType at save time
  // (e.g. MULTI_SELECT splits on commas into a string[]).
  value: string;
};

export type RecordVisibilityPolicyDraft = {
  staticConditions: RecordVisibilityPolicyStaticCondition[];
  // A RELATION field name (e.g. "assignee") to compare against whoever is
  // making the request, or null if this policy doesn't use that mode — v1
  // only supports comparing against workspaceMember.id (see spec §10.1).
  currentMemberFieldName: string | null;
};
