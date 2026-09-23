import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';

import { useActivityFieldComponentInstanceId } from '@/activities/hooks/useActivityFieldComponentInstanceId';
import { type Note } from '@/activities/types/Note';
import { useDeleteOneRecord } from '@/object-record/hooks/useDeleteOneRecord';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useObjectPermissionsForObject } from '@/object-record/hooks/useObjectPermissionsForObject';
import { getActivityPreview } from '@/activities/utils/getActivityPreview';
import { useObjectMorphJunctionConfigOrThrow } from '@/object-record/record-field/ui/hooks/useObjectMorphJunctionConfigOrThrow';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { RecordFieldsScopeContextProvider } from '@/object-record/record-field-list/contexts/RecordFieldsScopeContext';
import { FieldContextProvider } from '@/object-record/record-field/ui/components/FieldContextProvider';
import { RecordFieldComponentInstanceContext } from '@/object-record/record-field/ui/states/contexts/RecordFieldComponentInstanceContext';
import { RecordInlineCell } from '@/object-record/record-inline-cell/components/RecordInlineCell';
import { getRecordFieldInputInstanceId } from '@/object-record/utils/getRecordFieldInputId';
import { IconTrash } from 'twenty-ui/icon';
import { LightIconButton } from 'twenty-ui/components';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledCard = styled.div<{ isSingleNote: boolean }>`
  align-items: flex-start;
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  height: 300px;
  justify-content: space-between;
  position: relative;
  width: 100%;
`;

// Hidden until the card is hovered: a delete button sitting permanently next to
// a note is one stray click away from removing it.
const StyledDeleteButton = styled.div`
  opacity: 0;
  position: absolute;
  right: ${themeCssVariables.spacing[2]};
  top: ${themeCssVariables.spacing[2]};

  ${StyledCard}:hover &,
  &:focus-within {
    opacity: 1;
  }
`;

const StyledCardDetailsContainer = styled.div`
  align-items: flex-start;
  align-self: stretch;
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  height: calc(100% - 45px);
  justify-content: start;
  padding: ${themeCssVariables.spacing[4]};
  width: calc(100% - ${themeCssVariables.spacing[8]});
`;

const StyledNoteTitle = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledCardContent = styled.div`
  align-self: stretch;
  color: ${themeCssVariables.font.color.secondary};
  line-break: anywhere;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: pre-line;
  width: 100%;
`;

const StyledFooter = styled.div`
  align-items: center;
  align-self: stretch;
  border-top: 1px solid ${themeCssVariables.border.color.light};
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  flex-direction: row;
  gap: ${themeCssVariables.spacing[1]};
  justify-content: center;
  padding: ${themeCssVariables.spacing[2]};
  width: calc(100% - ${themeCssVariables.spacing[4]});
`;

export const NoteTile = ({
  note,
  isSingleNote,
}: {
  note: Note;
  isSingleNote: boolean;
}) => {
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();

  const body = getActivityPreview(note?.bodyV2?.blocknote ?? null);

  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: CoreObjectNameSingular.Note,
  });
  const objectPermissions = useObjectPermissionsForObject(
    objectMetadataItem.id,
  );
  const { deleteOneRecord } = useDeleteOneRecord({
    objectNameSingular: CoreObjectNameSingular.Note,
  });

  const junctionFieldName = useObjectMorphJunctionConfigOrThrow({
    objectNameSingular: CoreObjectNameSingular.Note,
  }).junctionField.name;

  const instanceIdPrefix =
    useActivityFieldComponentInstanceId('note-card-targets');
  const componentInstanceId = getRecordFieldInputInstanceId({
    recordId: note.id,
    fieldName: junctionFieldName,
    prefix: instanceIdPrefix,
  });

  return (
    <StyledCard isSingleNote={isSingleNote}>
      {objectPermissions.canSoftDeleteObjectRecords && (
        <StyledDeleteButton>
          <LightIconButton
            emphasis="subtle"
            aria-label={t`Delete note`}
            // Deleting is a soft delete, recoverable from the Notes view, so it
            // asks for no confirmation.
            onClick={(event) => {
              event.stopPropagation();
              void deleteOneRecord(note.id);
            }}
          >
            <IconTrash />
          </LightIconButton>
        </StyledDeleteButton>
      )}
      <StyledCardDetailsContainer
        onClick={() =>
          openRecordInSidePanel({
            recordId: note.id,
            objectNameSingular: CoreObjectNameSingular.Note,
          })
        }
      >
        <StyledNoteTitle>{note.title ?? t`Task Title`}</StyledNoteTitle>
        <StyledCardContent>{body}</StyledCardContent>
      </StyledCardDetailsContainer>
      <StyledFooter>
        <FieldContextProvider
          objectNameSingular={CoreObjectNameSingular.Note}
          objectRecordId={note.id}
          fieldMetadataName={junctionFieldName}
          fieldPosition={0}
          isDisplayModeFixHeight
        >
          <RecordFieldsScopeContextProvider
            value={{
              scopeInstanceId: note.id,
            }}
          >
            <RecordFieldComponentInstanceContext.Provider
              value={{ instanceId: componentInstanceId }}
            >
              <RecordInlineCell instanceIdPrefix={instanceIdPrefix} />
            </RecordFieldComponentInstanceContext.Provider>
          </RecordFieldsScopeContextProvider>
        </FieldContextProvider>
      </StyledFooter>
    </StyledCard>
  );
};
