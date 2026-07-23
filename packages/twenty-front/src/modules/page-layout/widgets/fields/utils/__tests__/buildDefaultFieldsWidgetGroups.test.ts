import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { buildDefaultFieldsWidgetGroups } from '@/page-layout/widgets/fields/utils/buildDefaultFieldsWidgetGroups';
import { FieldMetadataType } from 'twenty-shared/types';

const makeField = (
  overrides: Partial<FieldMetadataItem> & { id: string; name: string },
): FieldMetadataItem =>
  ({
    label: overrides.name,
    type: FieldMetadataType.TEXT,
    isActive: true,
    objectMetadataId: 'object-1',
    ...overrides,
  }) as FieldMetadataItem;

describe('buildDefaultFieldsWidgetGroups', () => {
  it('includes every eligible field exactly once, even when two relation fields share the same target object', () => {
    // Mirrors Issue.assignee / Issue.reporter both targeting WorkspaceMember -
    // regression guard for a hypothesized (refuted) collision keyed by relation target.
    const fields: FieldMetadataItem[] = [
      makeField({ id: 'f-description', name: 'description' }),
      makeField({
        id: 'f-assignee',
        name: 'assignee',
        type: FieldMetadataType.RELATION,
        relation: {
          targetObjectMetadata: { id: 'workspace-member' },
        } as FieldMetadataItem['relation'],
      }),
      makeField({
        id: 'f-reporter',
        name: 'reporter',
        type: FieldMetadataType.RELATION,
        relation: {
          targetObjectMetadata: { id: 'workspace-member' },
        } as FieldMetadataItem['relation'],
      }),
    ];

    const groups = buildDefaultFieldsWidgetGroups({
      fields,
      labelIdentifierFieldMetadataItemId: undefined,
      workspaceCustomApplicationId: undefined,
    });

    const allFieldIds = groups
      .flatMap((group) => group.fields)
      .map((field) => field.fieldMetadataItem.id);

    expect(allFieldIds).toEqual(
      expect.arrayContaining(['f-description', 'f-assignee', 'f-reporter']),
    );
    expect(allFieldIds).toHaveLength(3);

    const assigneeField = groups
      .flatMap((group) => group.fields)
      .find((field) => field.fieldMetadataItem.id === 'f-assignee');
    const reporterField = groups
      .flatMap((group) => group.fields)
      .find((field) => field.fieldMetadataItem.id === 'f-reporter');

    // Defaults to visible, matching the read-only page's own fallback for a
    // never-configured widget - see buildDefaultFieldsWidgetGroups.ts.
    expect(assigneeField?.isVisible).toBe(true);
    expect(reporterField?.isVisible).toBe(true);
  });

  it('excludes the label identifier field, id, and deletedAt', () => {
    const fields: FieldMetadataItem[] = [
      makeField({ id: 'f-id', name: 'id' }),
      makeField({ id: 'f-name', name: 'name' }),
      makeField({ id: 'f-deletedAt', name: 'deletedAt' }),
    ];

    const groups = buildDefaultFieldsWidgetGroups({
      fields,
      labelIdentifierFieldMetadataItemId: 'f-name',
      workspaceCustomApplicationId: undefined,
    });

    const allFieldIds = groups
      .flatMap((group) => group.fields)
      .map((field) => field.fieldMetadataItem.id);

    expect(allFieldIds).toEqual([]);
  });

  it('returns the same group ids across repeated calls for the same object (deterministic, not random)', () => {
    const fields: FieldMetadataItem[] = [
      makeField({ id: 'f-description', name: 'description' }),
    ];

    const firstCall = buildDefaultFieldsWidgetGroups({
      fields,
      labelIdentifierFieldMetadataItemId: undefined,
      workspaceCustomApplicationId: undefined,
    });
    const secondCall = buildDefaultFieldsWidgetGroups({
      fields,
      labelIdentifierFieldMetadataItemId: undefined,
      workspaceCustomApplicationId: undefined,
    });

    expect(firstCall[0].id).toBe(secondCall[0].id);
  });

  it('gives different objects different group ids', () => {
    const fieldsForObjectA: FieldMetadataItem[] = [
      makeField({
        id: 'f-1',
        name: 'description',
        objectMetadataId: 'object-a',
      }),
    ];
    const fieldsForObjectB: FieldMetadataItem[] = [
      makeField({
        id: 'f-2',
        name: 'description',
        objectMetadataId: 'object-b',
      }),
    ];

    const groupsA = buildDefaultFieldsWidgetGroups({
      fields: fieldsForObjectA,
      labelIdentifierFieldMetadataItemId: undefined,
      workspaceCustomApplicationId: undefined,
    });
    const groupsB = buildDefaultFieldsWidgetGroups({
      fields: fieldsForObjectB,
      labelIdentifierFieldMetadataItemId: undefined,
      workspaceCustomApplicationId: undefined,
    });

    expect(groupsA[0].id).not.toBe(groupsB[0].id);
  });
});
