import { FieldMetadataType } from 'twenty-shared/types';

// Static-condition fields — same idea as RLS's own whitelist, but declared
// independently (not imported from the Enterprise record-level-permissions
// folder). RELATION is handled separately by the "current member" picker,
// not by these static conditions.
export const RECORD_VISIBILITY_POLICY_STATIC_FIELD_TYPES = [
  FieldMetadataType.BOOLEAN,
  FieldMetadataType.NUMBER,
  FieldMetadataType.NUMERIC,
  FieldMetadataType.DATE_TIME,
  FieldMetadataType.DATE,
  FieldMetadataType.SELECT,
  FieldMetadataType.MULTI_SELECT,
  FieldMetadataType.TEXT,
];

export const RECORD_VISIBILITY_POLICY_CURRENT_MEMBER_FIELD_TYPES = [
  FieldMetadataType.RELATION,
];
