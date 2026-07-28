import { useState } from 'react';

import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { formatFieldMetadataItemAsColumnDefinition } from '@/object-metadata/utils/formatFieldMetadataItemAsColumnDefinition';
import { FieldInput } from '@/object-record/record-field/ui/components/FieldInput';
import { FieldContext } from '@/object-record/record-field/ui/contexts/FieldContext';
import {
  FieldInputEventContext,
  type FieldInputEvent,
} from '@/object-record/record-field/ui/contexts/FieldInputEventContext';
import { usePersistField } from '@/object-record/record-field/ui/hooks/usePersistField';
import { useOpenRelationToOneFieldInput } from '@/object-record/record-field/ui/meta-types/input/hooks/useOpenRelationToOneFieldInput';
import { RecordFieldComponentInstanceContext } from '@/object-record/record-field/ui/states/contexts/RecordFieldComponentInstanceContext';
import { isFieldRelationManyToOne } from '@/object-record/record-field/ui/types/guards/isFieldRelationManyToOne';
import { RecordInlineCell } from '@/object-record/record-inline-cell/components/RecordInlineCell';
import { RecordInlineCellAnchoredPortal } from '@/object-record/record-inline-cell/components/RecordInlineCellAnchoredPortal';
import { RecordInlineCellEditMode } from '@/object-record/record-inline-cell/components/RecordInlineCellEditMode';
import { getRecordFieldInputInstanceId } from '@/object-record/utils/getRecordFieldInputId';

type TaskManagerFieldCellProps = {
  recordId: string;
  fieldMetadataItem: FieldMetadataItem;
  objectMetadataItem: EnrichedObjectMetadataItem;
  instanceIdPrefix: string;
  showLabel?: boolean;
  readOnly?: boolean;
};

// Minimal single-field version of RecordFieldList's inline-cell wiring
// (formatFieldMetadataItemAsColumnDefinition -> FieldContext ->
// RecordFieldComponentInstanceContext -> RecordInlineCell), for a custom
// panel that only ever shows a curated list of scalar/many-to-one fields —
// callers must wrap a RecordFieldsScopeContextProvider once around the panel.
// readOnly reuses the same FieldDisplay/FieldInput type-aware rendering for
// the Kanban card badges (display only, no click-to-edit).
//
// Click-to-edit is wired by hand here (local isEditing state + our own
// RecordInlineCellAnchoredPortal/FieldInputEventContext) rather than reusing
// RecordFieldList's edit-mode portal: that portal resolves "which field is
// open" from a position index into RecordFieldList's own alphabetically
// sorted field set, which doesn't match this panel's curated/reordered list.
// For many-to-one relation fields, opening edit mode must also seed
// SingleRecordPicker's selected-id state from the record's current value
// (openRelationToOneFieldInput) — otherwise the picker has no way to know
// what's currently selected and always shows "No X" checked.
export const TaskManagerFieldCell = ({
  recordId,
  fieldMetadataItem,
  objectMetadataItem,
  instanceIdPrefix,
  showLabel = true,
  readOnly = false,
}: TaskManagerFieldCellProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const fieldDefinition = formatFieldMetadataItemAsColumnDefinition({
    field: fieldMetadataItem,
    position: 0,
    objectMetadataItem,
    showLabel,
    labelWidth: 100,
  });

  const instanceId = getRecordFieldInputInstanceId({
    recordId,
    fieldName: fieldMetadataItem.name,
    prefix: instanceIdPrefix,
  });

  const persistField = usePersistField({
    objectMetadataItemId: objectMetadataItem.id,
  });

  const { openRelationToOneFieldInput } = useOpenRelationToOneFieldInput();

  const openEditMode = () => {
    if (isFieldRelationManyToOne(fieldDefinition)) {
      openRelationToOneFieldInput({
        fieldName: fieldMetadataItem.name,
        recordId,
        prefix: instanceIdPrefix,
      });
    }
    setIsEditing(true);
  };

  const closeEditMode = () => setIsEditing(false);

  const handleFieldInputEvent: FieldInputEvent = ({
    newValue,
    skipPersist,
  }) => {
    if (skipPersist !== true) {
      persistField({ recordId, fieldDefinition, valueToPersist: newValue });
    }
    closeEditMode();
  };

  return (
    <FieldContext.Provider
      value={{
        recordId,
        isLabelIdentifier: false,
        fieldDefinition,
        isDisplayModeFixHeight: true,
        isRecordFieldReadOnly: readOnly,
        anchorId: instanceId,
        onOpenEditMode: readOnly ? undefined : openEditMode,
        onCloseEditMode: closeEditMode,
      }}
    >
      <RecordFieldComponentInstanceContext.Provider value={{ instanceId }}>
        <RecordInlineCell instanceIdPrefix={instanceIdPrefix} />
        {isEditing && (
          <RecordInlineCellAnchoredPortal
            fieldMetadataItem={fieldMetadataItem}
            objectMetadataItem={objectMetadataItem}
            recordId={recordId}
            instanceIdPrefix={instanceIdPrefix}
            onCloseEditMode={closeEditMode}
          >
            <FieldInputEventContext.Provider
              value={{
                onEnter: handleFieldInputEvent,
                onSubmit: handleFieldInputEvent,
                onEscape: handleFieldInputEvent,
                onTab: handleFieldInputEvent,
                onShiftTab: handleFieldInputEvent,
                onClickOutside: handleFieldInputEvent,
                onCancel: closeEditMode,
              }}
            >
              <RecordInlineCellEditMode>
                <FieldInput />
              </RecordInlineCellEditMode>
            </FieldInputEventContext.Provider>
          </RecordInlineCellAnchoredPortal>
        )}
      </RecordFieldComponentInstanceContext.Provider>
    </FieldContext.Provider>
  );
};
