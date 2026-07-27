import { RECORD_VISIBILITY_POLICY_CURRENT_MEMBER_PLACEHOLDER } from 'twenty-shared/constants';
import { FieldMetadataType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { RECORD_VISIBILITY_POLICY_STATIC_FIELD_TYPES } from '@/settings/roles/role-permissions/object-level-permissions/record-visibility-policy/constants/RecordVisibilityPolicyFieldTypes';
import { type RecordVisibilityPolicyDraft } from '@/settings/roles/role-permissions/object-level-permissions/record-visibility-policy/types/RecordVisibilityPolicyCondition';

// oxlint-disable-next-line typescript/no-explicit-any
type JsonFilter = Record<string, any>;

const computeRelationJoinColumnName = (fieldName: string): string =>
  `${fieldName}Id`;

const parseStaticFilterValue = (
  fieldType: FieldMetadataType,
  // oxlint-disable-next-line typescript/no-explicit-any
  leafFilter: any,
): string => {
  if (fieldType === FieldMetadataType.MULTI_SELECT) {
    const values = leafFilter?.containsAny ?? [];

    return Array.isArray(values) ? values.join(',') : '';
  }

  const value = leafFilter?.eq;

  return isDefined(value) ? String(value) : '';
};

export const convertFilterToRecordVisibilityPolicyDraft = ({
  filter,
  currentMemberFieldName,
  fields,
}: {
  filter: JsonFilter | null | undefined;
  currentMemberFieldName: string | null | undefined;
  fields: FieldMetadataItem[];
}): RecordVisibilityPolicyDraft => {
  const draft: RecordVisibilityPolicyDraft = {
    staticConditions: [],
    currentMemberFieldName: null,
  };

  if (!isDefined(filter)) {
    return draft;
  }

  const relationFieldByJoinColumnName = new Map(
    fields
      .filter((field) => field.type === FieldMetadataType.RELATION)
      .map((field) => [computeRelationJoinColumnName(field.name), field]),
  );

  for (const [key, leafFilter] of Object.entries(filter)) {
    if (key === 'and' || key === 'or' || key === 'not') {
      // Anything more complex than a flat AND of leaves was authored outside
      // this simplified UI (or by a future version) — left untouched on
      // save (see convertRecordVisibilityPolicyDraftToFilter), but not
      // editable here.
      continue;
    }

    const relationField = relationFieldByJoinColumnName.get(key);

    if (isDefined(relationField) && isDefined(currentMemberFieldName)) {
      const inValues = leafFilter?.in ?? [];

      if (
        Array.isArray(inValues) &&
        inValues.includes(RECORD_VISIBILITY_POLICY_CURRENT_MEMBER_PLACEHOLDER)
      ) {
        draft.currentMemberFieldName = relationField.name;
        continue;
      }
    }

    const field = fields.find((candidate) => candidate.name === key);

    if (!isDefined(field)) {
      continue;
    }

    draft.staticConditions.push({
      id: field.id,
      fieldMetadataId: field.id,
      fieldName: field.name,
      fieldType: field.type,
      value: parseStaticFilterValue(field.type, leafFilter),
    });
  }

  return draft;
};

export const convertRecordVisibilityPolicyDraftToFilter = (
  draft: RecordVisibilityPolicyDraft,
): { filter: JsonFilter; currentMemberFieldName: string | null } => {
  const filter: JsonFilter = {};

  for (const condition of draft.staticConditions) {
    if (condition.fieldType === FieldMetadataType.MULTI_SELECT) {
      filter[condition.fieldName] = {
        containsAny: condition.value
          .split(',')
          .map((value) => value.trim())
          .filter((value) => value.length > 0),
      };
      continue;
    }

    if (condition.fieldType === FieldMetadataType.BOOLEAN) {
      filter[condition.fieldName] = { eq: condition.value === 'true' };
      continue;
    }

    if (
      condition.fieldType === FieldMetadataType.NUMBER ||
      condition.fieldType === FieldMetadataType.NUMERIC
    ) {
      filter[condition.fieldName] = { eq: Number(condition.value) };
      continue;
    }

    filter[condition.fieldName] = { eq: condition.value };
  }

  let currentMemberFieldName: string | null = null;

  if (isDefined(draft.currentMemberFieldName)) {
    const joinColumnName = computeRelationJoinColumnName(
      draft.currentMemberFieldName,
    );

    filter[joinColumnName] = {
      in: [RECORD_VISIBILITY_POLICY_CURRENT_MEMBER_PLACEHOLDER],
    };
    currentMemberFieldName = 'id';
  }

  return { filter, currentMemberFieldName };
};

export const getRecordVisibilityPolicyEligibleStaticFields = (
  fields: FieldMetadataItem[],
): FieldMetadataItem[] =>
  fields.filter((field) =>
    RECORD_VISIBILITY_POLICY_STATIC_FIELD_TYPES.includes(field.type),
  );

export const getRecordVisibilityPolicyEligibleRelationFields = (
  fields: FieldMetadataItem[],
): FieldMetadataItem[] =>
  fields.filter((field) => field.type === FieldMetadataType.RELATION);
