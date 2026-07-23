import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { getIsMetadataItemCustom } from '@/object-metadata/utils/getIsMetadataItemCustom';
import { type FieldsWidgetGroup } from '@/page-layout/widgets/fields/types/FieldsWidgetGroup';
import { isFieldMetadataEligibleForFieldsWidget } from 'twenty-shared/utils';
import { v5 as uuidv5 } from 'uuid';

// This builder is called independently (and re-memoized) from several call
// sites - normal display, edit-mode draft init, settings summary - for what
// is conceptually the same "default General/Other grouping" of one object.
// The id must stay deterministic per object, otherwise every recompute mints
// a new group identity, which desyncs those call sites and churns the
// group's React/drag-and-drop key for no reason.
const buildDefaultGroupId = (
  objectMetadataId: string | undefined,
  groupKey: 'general' | 'other',
) =>
  uuidv5(
    `fields-widget-default-group:${objectMetadataId ?? 'unknown'}:${groupKey}`,
    uuidv5.URL,
  );

export const buildDefaultFieldsWidgetGroups = ({
  fields,
  labelIdentifierFieldMetadataItemId,
  workspaceCustomApplicationId,
}: {
  fields: FieldMetadataItem[];
  labelIdentifierFieldMetadataItemId: string | undefined;
  workspaceCustomApplicationId?: string | null;
}): FieldsWidgetGroup[] => {
  const eligibleFields = fields.filter(
    (field) =>
      field.isActive &&
      isFieldMetadataEligibleForFieldsWidget({
        fieldName: field.name,
        fieldType: field.type,
        isLabelIdentifierField: field.id === labelIdentifierFieldMetadataItemId,
      }),
  );

  const nonCustomFields = eligibleFields.filter(
    (field) => !getIsMetadataItemCustom(field, workspaceCustomApplicationId),
  );
  const customFields = eligibleFields.filter((field) =>
    getIsMetadataItemCustom(field, workspaceCustomApplicationId),
  );

  const objectMetadataId = fields[0]?.objectMetadataId;

  // Every eligible field defaults to visible here, including relations.
  // This is also what the read-only page falls back to before any ViewField
  // exists (useFieldsWidgetGroups), so a never-configured widget must show
  // exactly what the record page already showed - anything hidden by default
  // silently vanishes the moment a user saves any change without noticing
  // and re-enabling it.
  const groups: FieldsWidgetGroup[] = [];
  let globalIndex = 0;

  if (nonCustomFields.length > 0) {
    groups.push({
      id: buildDefaultGroupId(objectMetadataId, 'general'),
      name: 'General',
      position: 0,
      isVisible: true,
      fields: nonCustomFields.map((field, index) => ({
        fieldMetadataItem: field,
        position: index,
        isVisible: true,
        globalIndex: globalIndex++,
      })),
    });
  }

  if (customFields.length > 0) {
    groups.push({
      id: buildDefaultGroupId(objectMetadataId, 'other'),
      name: 'Other',
      position: 1,
      isVisible: true,
      fields: customFields.map((field, index) => ({
        fieldMetadataItem: field,
        position: index,
        isVisible: true,
        globalIndex: globalIndex++,
      })),
    });
  }

  return groups;
};
