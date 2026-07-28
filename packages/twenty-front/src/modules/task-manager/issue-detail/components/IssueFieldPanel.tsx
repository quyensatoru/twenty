import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { RecordFieldsScopeContextProvider } from '@/object-record/record-field-list/contexts/RecordFieldsScopeContext';
import { visibleRecordFieldsComponentSelector } from '@/object-record/record-field/states/visibleRecordFieldsComponentSelector';
import { useAtomComponentSelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentSelectorValue';
import { TaskManagerFieldCell } from '@/task-manager/components/TaskManagerFieldCell';

// title/description are edited in the main column; status/priority/issueKey
// already show as pills in the page header — listing them again here would
// just be visual noise.
const FIELD_PANEL_EXCLUDED_FIELD_NAMES = new Set([
  'title',
  'description',
  'status',
  'priority',
  'issueKey',
]);

const StyledPanel = styled.div`
  display: flex;
  flex-direction: column;
  padding-bottom: ${themeCssVariables.spacing['4']};
`;

const StyledHeader = styled.div`
  align-items: center;
  display: flex;
  padding: ${themeCssVariables.spacing['4']} ${themeCssVariables.spacing['2']}
    ${themeCssVariables.spacing['2']};
`;

const StyledHeaderTitle = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  text-transform: uppercase;
`;

const StyledFieldList = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 ${themeCssVariables.spacing['1']};
`;

const StyledFieldRow = styled.div`
  border-radius: ${themeCssVariables.border.radius.sm};

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
  }
`;

type IssueFieldPanelProps = {
  recordId: string;
  objectMetadataItem: EnrichedObjectMetadataItem;
  recordIndexId: string;
};

export const IssueFieldPanel = ({
  recordId,
  objectMetadataItem,
  recordIndexId,
}: IssueFieldPanelProps) => {
  const visibleRecordFields = useAtomComponentSelectorValue(
    visibleRecordFieldsComponentSelector,
    recordIndexId,
  );

  const visibleFieldMetadataItems = visibleRecordFields
    .map((recordField) =>
      objectMetadataItem.fields.find(
        (field) => field.id === recordField.fieldMetadataItemId,
      ),
    )
    .filter(
      (
        fieldMetadataItem,
      ): fieldMetadataItem is NonNullable<typeof fieldMetadataItem> =>
        fieldMetadataItem !== undefined &&
        !FIELD_PANEL_EXCLUDED_FIELD_NAMES.has(fieldMetadataItem.name),
    );

  return (
    <StyledPanel>
      <StyledHeader>
        <StyledHeaderTitle>Details</StyledHeaderTitle>
      </StyledHeader>
      <RecordFieldsScopeContextProvider
        value={{ scopeInstanceId: `issue-detail-panel-${recordId}` }}
      >
        <StyledFieldList>
          {visibleFieldMetadataItems.map((fieldMetadataItem) => (
            <StyledFieldRow key={fieldMetadataItem.id}>
              <TaskManagerFieldCell
                recordId={recordId}
                fieldMetadataItem={fieldMetadataItem}
                objectMetadataItem={objectMetadataItem}
                instanceIdPrefix={recordIndexId}
              />
            </StyledFieldRow>
          ))}
        </StyledFieldList>
      </RecordFieldsScopeContextProvider>
    </StyledPanel>
  );
};
