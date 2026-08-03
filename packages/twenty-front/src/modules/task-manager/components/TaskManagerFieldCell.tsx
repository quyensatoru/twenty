import { useContext, useState, type ReactNode } from 'react';

import { styled } from '@linaria/react';
import { isDefined } from 'twenty-shared/utils';
import { useIcons } from 'twenty-ui/icon';
import { ThemeContext, themeCssVariables } from 'twenty-ui/theme-constants';
import { FeatureFlagKey } from '~/generated-metadata/graphql';

import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { formatFieldMetadataItemAsColumnDefinition } from '@/object-metadata/utils/formatFieldMetadataItemAsColumnDefinition';
import { FieldInput } from '@/object-record/record-field/ui/components/FieldInput';
import { FieldContext } from '@/object-record/record-field/ui/contexts/FieldContext';
import { FieldFocusContextProvider } from '@/object-record/record-field/ui/contexts/FieldFocusContextProvider';
import {
  FieldInputEventContext,
  type FieldInputEvent,
} from '@/object-record/record-field/ui/contexts/FieldInputEventContext';
import { useFieldFocus } from '@/object-record/record-field/ui/hooks/useFieldFocus';
import { useOpenJunctionRelationFieldInput } from '@/object-record/record-field/ui/hooks/useOpenJunctionRelationFieldInput';
import { usePersistField } from '@/object-record/record-field/ui/hooks/usePersistField';
import { useOpenRelationFromManyFieldInput } from '@/object-record/record-field/ui/meta-types/input/hooks/useOpenRelationFromManyFieldInput';
import { useOpenRelationToOneFieldInput } from '@/object-record/record-field/ui/meta-types/input/hooks/useOpenRelationToOneFieldInput';
import { RecordFieldComponentInstanceContext } from '@/object-record/record-field/ui/states/contexts/RecordFieldComponentInstanceContext';
import { type FieldDefinition } from '@/object-record/record-field/ui/types/FieldDefinition';
import { type FieldMetadata } from '@/object-record/record-field/ui/types/FieldMetadata';
import { isFieldRelationManyToOne } from '@/object-record/record-field/ui/types/guards/isFieldRelationManyToOne';
import { isFieldRelationOneToMany } from '@/object-record/record-field/ui/types/guards/isFieldRelationOneToMany';
import { hasJunctionConfig } from '@/object-record/record-field/ui/utils/junction/hasJunctionConfig';
import { RecordInlineCell } from '@/object-record/record-inline-cell/components/RecordInlineCell';
import { RecordInlineCellAnchoredPortal } from '@/object-record/record-inline-cell/components/RecordInlineCellAnchoredPortal';
import { RecordInlineCellEditMode } from '@/object-record/record-inline-cell/components/RecordInlineCellEditMode';
import { getRecordFieldInputInstanceId } from '@/object-record/utils/getRecordFieldInputId';
import { useIsFeatureEnabled } from '@/workspace/hooks/useIsFeatureEnabled';

type TaskManagerFieldCellProps = {
  recordId: string;
  fieldMetadataItem: FieldMetadataItem;
  objectMetadataItem: EnrichedObjectMetadataItem;
  instanceIdPrefix: string;
  showLabel?: boolean;
  readOnly?: boolean;
  // Bypasses the generic FieldDisplay dispatch for this cell's display mode
  // only (e.g. a colored Tag sourced from a relation target's own `color`
  // field, which the generic RelationToOneFieldDisplay/RecordChip pipeline
  // has no concept of). Click-to-edit still opens the normal field input.
  customDisplay?: ReactNode;
};

// customDisplay's rendering below mirrors, layer for layer, the generic
// inline-cell tree every other field cell renders through
// (RecordInlineCellContainer > RecordInlineCellValue >
// RecordInlineCellDisplayMode), so a custom display looks and behaves
// pixel-identical to a real SELECT field cell — including the field's own
// icon (RecordInlineCellContainer always renders one: fieldDefinition's
// iconName falls back to 'Icon123' when unset, so this isn't optional) and
// the hover highlight, which is tracked via FieldFocusContext across the
// icon+value row exactly like the generic version, not a local :hover.
const StyledBaseContainer = styled.div<{ readOnly: boolean }>`
  align-items: center;
  box-sizing: border-box;
  cursor: ${({ readOnly }) => (readOnly ? 'default' : 'pointer')};
  display: flex;
  gap: ${themeCssVariables.spacing['1']};
  height: fit-content;
  user-select: none;
  width: 100%;
`;

const StyledLabelAndIconContainer = styled.div`
  align-items: center;
  align-self: flex-start;
  display: flex;
  gap: ${themeCssVariables.spacing['1']};
  height: 24px;
`;

const StyledIconContainer = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  width: 16px;

  svg {
    align-items: center;
    display: flex;
    height: 16px;
    justify-content: center;
    width: 16px;
  }
`;

const StyledValueContainer = styled.div`
  display: flex;
  min-width: 0;
  position: relative;
  width: 100%;
`;

const StyledClickableContainer = styled.div<{ readOnly: boolean }>`
  align-items: center;
  cursor: ${({ readOnly }) => (readOnly ? 'default' : 'pointer')};
  display: flex;
  gap: ${themeCssVariables.spacing['1']};
  width: 100%;
`;

const StyledHoverContainer = styled.div<{
  readOnly: boolean;
  isHovered: boolean;
}>`
  align-items: center;
  background-color: ${({ isHovered, readOnly }) =>
    isHovered && !readOnly
      ? themeCssVariables.background.transparent.light
      : 'transparent'};
  border-radius: ${themeCssVariables.border.radius.md};
  cursor: ${({ isHovered, readOnly }) =>
    isHovered && !readOnly ? 'pointer' : 'default'};
  display: flex;
  height: auto;
  min-height: 16px;
  outline: 1px solid
    ${({ isHovered, readOnly }) =>
      isHovered && readOnly
        ? themeCssVariables.border.color.medium
        : 'transparent'};
  overflow: hidden;
  padding-left: ${themeCssVariables.spacing['1']};
  padding-right: ${themeCssVariables.spacing['1']};
`;

const StyledInnerContainer = styled.div`
  align-content: center;
  align-items: center;
  height: fit-content;
  overflow: hidden;
  padding-bottom: 2px;
  padding-top: 2px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

type TaskManagerCustomFieldDisplayProps = {
  readOnly: boolean;
  anchorId: string;
  fieldDefinition: FieldDefinition<FieldMetadata>;
  onOpenEditMode: () => void;
  children: ReactNode;
};

// Rendered inside its own FieldFocusContextProvider (see below) so
// useFieldFocus's hover state is scoped per cell, exactly like
// RecordInlineCell wraps RecordInlineCellContainer.
const TaskManagerCustomFieldDisplay = ({
  readOnly,
  anchorId,
  fieldDefinition,
  onOpenEditMode,
  children,
}: TaskManagerCustomFieldDisplayProps) => {
  const { getIcon } = useIcons();
  const { theme } = useContext(ThemeContext);
  const { isFocused, setIsFocused } = useFieldFocus();

  const IconLabel = fieldDefinition.iconName
    ? getIcon(fieldDefinition.iconName)
    : undefined;

  const handleMouseEnter = () => {
    if (!readOnly) {
      setIsFocused(true);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setIsFocused(false);
    }
  };

  return (
    <StyledBaseContainer
      readOnly={readOnly}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {IconLabel && (
        <StyledLabelAndIconContainer>
          <StyledIconContainer>
            <IconLabel stroke={theme.icon.stroke.sm} />
          </StyledIconContainer>
        </StyledLabelAndIconContainer>
      )}
      <StyledValueContainer id={anchorId}>
        <StyledClickableContainer readOnly={readOnly}>
          <StyledHoverContainer
            readOnly={readOnly}
            isHovered={isFocused}
            onClick={readOnly ? undefined : onOpenEditMode}
          >
            <StyledInnerContainer>{children}</StyledInnerContainer>
          </StyledHoverContainer>
        </StyledClickableContainer>
      </StyledValueContainer>
    </StyledBaseContainer>
  );
};

// Minimal single-field version of RecordFieldList's inline-cell wiring
// (formatFieldMetadataItemAsColumnDefinition -> FieldContext ->
// RecordFieldComponentInstanceContext -> RecordInlineCell), for a custom
// panel that shows a curated list of scalar/many-to-one/one-to-many fields —
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
// what's currently selected and always shows "No X" checked. For one-to-many
// relation fields, opening edit mode must seed MultipleRecordPicker's
// searchable-object-metadata-items state (openRelationFromManyFieldInput) —
// otherwise the picker's search always returns zero results regardless of
// what records actually exist. A one-to-many field pointing at a junction
// object with junctionTargetFieldId configured (many-to-many via junction)
// needs the junction-aware variant instead (openJunctionRelationFieldInput),
// which resolves the picker to the junction's target object rather than the
// junction object itself.
export const TaskManagerFieldCell = ({
  recordId,
  fieldMetadataItem,
  objectMetadataItem,
  instanceIdPrefix,
  showLabel = true,
  readOnly = false,
  customDisplay,
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
  const { openRelationFromManyFieldInput } =
    useOpenRelationFromManyFieldInput();
  const { openJunctionRelationFieldInput } =
    useOpenJunctionRelationFieldInput();
  const isJunctionRelationsEnabled = useIsFeatureEnabled(
    FeatureFlagKey.IS_JUNCTION_RELATIONS_ENABLED,
  );

  const openEditMode = () => {
    if (isFieldRelationManyToOne(fieldDefinition)) {
      openRelationToOneFieldInput({
        fieldName: fieldMetadataItem.name,
        recordId,
        prefix: instanceIdPrefix,
      });
    } else if (
      isJunctionRelationsEnabled &&
      isFieldRelationOneToMany(fieldDefinition) &&
      hasJunctionConfig(fieldDefinition.metadata.settings)
    ) {
      openJunctionRelationFieldInput({
        fieldDefinition,
        recordId,
        prefix: instanceIdPrefix,
      });
    } else if (
      isFieldRelationOneToMany(fieldDefinition) &&
      isDefined(fieldDefinition.metadata.relationObjectMetadataNameSingular)
    ) {
      openRelationFromManyFieldInput({
        fieldName: fieldMetadataItem.name,
        objectNameSingular:
          fieldDefinition.metadata.relationObjectMetadataNameSingular,
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
        {isDefined(customDisplay) ? (
          <FieldFocusContextProvider>
            <TaskManagerCustomFieldDisplay
              readOnly={readOnly}
              anchorId={instanceId}
              fieldDefinition={fieldDefinition}
              onOpenEditMode={openEditMode}
            >
              {customDisplay}
            </TaskManagerCustomFieldDisplay>
          </FieldFocusContextProvider>
        ) : (
          <RecordInlineCell instanceIdPrefix={instanceIdPrefix} />
        )}
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
