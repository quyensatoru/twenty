import { RecordFieldsScopeContextProvider } from '@/object-record/record-field-list/contexts/RecordFieldsScopeContext';
import { visibleRecordFieldsComponentSelector } from '@/object-record/record-field/states/visibleRecordFieldsComponentSelector';
import { FieldContext } from '@/object-record/record-field/ui/contexts/FieldContext';
import { RecordFieldComponentInstanceContext } from '@/object-record/record-field/ui/states/contexts/RecordFieldComponentInstanceContext';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { RecordInlineCell } from '@/object-record/record-inline-cell/components/RecordInlineCell';
import { getRecordFieldInputInstanceId } from '@/object-record/utils/getRecordFieldInputId';
import { useAtomComponentSelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentSelectorValue';
import { isDefined } from 'twenty-shared/utils';

const PROJECT_FIELD_PREVIEW_PREFIX = 'pm-field-preview';

type ProjectRecordFieldsPreviewProps = {
  recordId: string;
};

export const ProjectRecordFieldsPreview = ({
  recordId,
}: ProjectRecordFieldsPreviewProps) => {
  const {
    labelIdentifierFieldMetadataItem,
    fieldDefinitionByFieldMetadataItemId,
  } = useRecordIndexContextOrThrow();

  const visibleRecordFields = useAtomComponentSelectorValue(
    visibleRecordFieldsComponentSelector,
  );

  const visibleRecordFieldsExceptLabelIdentifier = visibleRecordFields.filter(
    (recordField) =>
      recordField.fieldMetadataItemId !== labelIdentifierFieldMetadataItem?.id,
  );

  return (
    <RecordFieldsScopeContextProvider
      value={{ scopeInstanceId: PROJECT_FIELD_PREVIEW_PREFIX }}
    >
      {visibleRecordFieldsExceptLabelIdentifier.map((recordField) => {
        const fieldDefinition =
          fieldDefinitionByFieldMetadataItemId[recordField.fieldMetadataItemId];

        if (!isDefined(fieldDefinition)) {
          return null;
        }

        return (
          <FieldContext.Provider
            key={recordField.fieldMetadataItemId}
            value={{
              recordId,
              fieldDefinition,
              isLabelIdentifier: false,
              isRecordFieldReadOnly: true,
              isDisplayModeFixHeight: true,
              maxWidth: 156,
            }}
          >
            <RecordFieldComponentInstanceContext.Provider
              value={{
                instanceId: getRecordFieldInputInstanceId({
                  recordId,
                  fieldName: fieldDefinition.metadata.fieldName,
                  prefix: PROJECT_FIELD_PREVIEW_PREFIX,
                }),
              }}
            >
              <RecordInlineCell
                instanceIdPrefix={PROJECT_FIELD_PREVIEW_PREFIX}
              />
            </RecordFieldComponentInstanceContext.Provider>
          </FieldContext.Provider>
        );
      })}
    </RecordFieldsScopeContextProvider>
  );
};
