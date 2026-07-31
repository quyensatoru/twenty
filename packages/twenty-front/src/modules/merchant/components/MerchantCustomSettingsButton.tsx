import { Fragment, useState } from 'react';

import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { IconSettings } from 'twenty-ui/icon';
import {
  Button,
  Checkbox,
  IconButton,
  type SelectOption,
} from 'twenty-ui/input';
import { Section, SectionAlignment } from 'twenty-ui/layout';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { H1Title, H1TitleFontColor } from 'twenty-ui/typography';

import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { InputLabel } from '@/ui/input/components/InputLabel';
import { SettingsTextInput } from '@/ui/input/components/SettingsTextInput';
import { DropdownMenuInnerSelect } from '@/ui/layout/dropdown/components/DropdownMenuInnerSelect';
import { ModalStatefulWrapper } from '@/ui/layout/modal/components/ModalStatefulWrapper';
import { useModal } from '@/ui/layout/modal/hooks/useModal';

type MerchantCustomSettingsButtonProps = {
  recordId: string;
};

// Schema stored on the merchant's App (App.fieldSchema) drives this form —
// authored as raw JSON on the App record itself, no dedicated schema-editing UI.
type CustomSettingFieldType =
  | 'TEXT'
  | 'BOOLEAN'
  | 'NUMBER'
  | 'DATE'
  | 'ARRAY'
  | 'RICH_TEXT'
  | 'SELECT';

type CustomSettingFieldSchemaEntry = {
  key: string;
  label: string;
  type: CustomSettingFieldType;
  options?: string[];
  default?: unknown;
};

const NO_SELECT_VALUE = '';
const ARRAY_VALUE_SEPARATOR = ',';

const getModalInstanceId = (recordId: string) =>
  `merchant-custom-settings-modal-${recordId}`;

const StyledFieldGrid = styled.div`
  column-gap: ${themeCssVariables.spacing[4]};
  display: grid;
  grid-template-columns: minmax(100px, 140px) 1fr;
  row-gap: ${themeCssVariables.spacing[4]};
  width: 100%;
`;

const StyledFieldLabel = styled.div`
  align-items: center;
  display: flex;
  min-height: 32px;
`;

const StyledNativeInput = styled.input`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  height: 32px;
  padding: 0 ${themeCssVariables.spacing[2]};
  width: 100%;
`;

const StyledNativeTextarea = styled.textarea`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.primary};
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  min-height: 72px;
  padding: ${themeCssVariables.spacing[2]};
  resize: vertical;
  width: 100%;
`;

const StyledFooter = styled.div`
  display: flex;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[2]};
  margin-top: ${themeCssVariables.spacing[6]};
`;

const StyledModalContent = styled.div`
  display: flex;
  flex-direction: column;
  max-height: 70dvh;
`;

const StyledScrollableSection = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-color: ${themeCssVariables.border.color.medium} transparent;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${themeCssVariables.border.color.medium};
    border-radius: ${themeCssVariables.border.radius.pill};
  }
`;

const formatValueForInput = (
  entry: CustomSettingFieldSchemaEntry,
  existingValue: unknown,
): string | boolean => {
  if (entry.type === 'BOOLEAN') {
    return Boolean(existingValue);
  }
  if (entry.type === 'ARRAY') {
    return Array.isArray(existingValue)
      ? existingValue.join(ARRAY_VALUE_SEPARATOR)
      : '';
  }
  return existingValue?.toString() ?? '';
};

const parseValueForSave = (
  entry: CustomSettingFieldSchemaEntry,
  value: string | boolean,
): unknown => {
  if (entry.type === 'NUMBER') {
    return Number(value) || 0;
  }
  if (entry.type === 'ARRAY') {
    return String(value)
      .split(ARRAY_VALUE_SEPARATOR)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return value;
};

export const MerchantCustomSettingsButton = ({
  recordId,
}: MerchantCustomSettingsButtonProps) => {
  const { t } = useLingui();
  const { openModal, closeModal } = useModal();
  const modalInstanceId = getModalInstanceId(recordId);

  const { record, refetch } = useFindOneRecord({
    objectNameSingular: 'merchant',
    objectRecordId: recordId,
    recordGqlFields: {
      id: true,
      customSettings: true,
      app: { id: true, fieldSchema: true },
    },
  });

  const fieldSchema = ((record?.app as { fieldSchema?: unknown } | null)
    ?.fieldSchema ?? []) as CustomSettingFieldSchemaEntry[];
  const hasSchema = fieldSchema.length > 0;

  const { updateOneRecord } = useUpdateOneRecord();

  const [schemaValues, setSchemaValues] = useState<
    Record<string, string | boolean>
  >({});

  // Portalled modal content still bubbles clicks up the REACT tree (not the
  // DOM tree) to the record field's own click-to-edit handler, which would
  // otherwise flip the underlying customSettings field into raw JSON edit
  // mode on every click inside this form. Stopping propagation here, once,
  // at the root of the portalled content, guards every control beneath it.
  const stopClickPropagation = (event: React.SyntheticEvent) => {
    event.stopPropagation();
  };

  const handleOpen = (event: React.MouseEvent) => {
    event.stopPropagation();

    const currentCustomSettings =
      (record?.customSettings as Record<string, unknown> | null) ?? {};

    const initialValues: Record<string, string | boolean> = {};
    fieldSchema.forEach((entry) => {
      initialValues[entry.key] = formatValueForInput(
        entry,
        currentCustomSettings[entry.key] ?? entry.default,
      );
    });
    setSchemaValues(initialValues);
    openModal(modalInstanceId);
  };

  const handleSchemaValueChange = (key: string, value: string | boolean) => {
    setSchemaValues((previousValues) => ({ ...previousValues, [key]: value }));
  };

  const handleSave = async () => {
    const currentCustomSettings =
      (record?.customSettings as Record<string, unknown> | null) ?? {};

    const newCustomSettings = {
      ...currentCustomSettings,
      ...Object.fromEntries(
        fieldSchema.map((entry) => [
          entry.key,
          parseValueForSave(entry, schemaValues[entry.key]),
        ]),
      ),
    };

    await updateOneRecord({
      objectNameSingular: 'merchant',
      idToUpdate: recordId,
      updateOneRecordInput: { customSettings: newCustomSettings },
    });
    await refetch();
    closeModal(modalInstanceId);
  };

  return (
    <>
      <IconButton
        Icon={IconSettings}
        dataTestId="merchant-custom-settings-button"
        size="small"
        variant="secondary"
        accent="default"
        ariaLabel={t`Custom settings`}
        onClick={handleOpen}
      />
      <ModalStatefulWrapper
        modalInstanceId={modalInstanceId}
        size="medium"
        isClosable
        padding="large"
        renderInDocumentBody
      >
        <StyledModalContent
          onClick={stopClickPropagation}
          onMouseDown={stopClickPropagation}
        >
          <H1Title
            title={t`Custom Settings`}
            fontColor={H1TitleFontColor.Primary}
          />
          <StyledScrollableSection>
            <Section alignment={SectionAlignment.Center}>
              {!hasSchema ? (
                <InputLabel>
                  {t`No custom settings configured for this app.`}
                </InputLabel>
              ) : (
                <StyledFieldGrid>
                  {fieldSchema.map((entry) => {
                    const selectOptions: SelectOption[] = [
                      { label: t`None`, value: NO_SELECT_VALUE },
                      ...(entry.options ?? []).map((option) => ({
                        label: option,
                        value: option,
                      })),
                    ];
                    const currentValue = String(schemaValues[entry.key] ?? '');
                    const selectedOption =
                      selectOptions.find(
                        (option) => option.value === currentValue,
                      ) ?? selectOptions[0];

                    return (
                      <Fragment key={entry.key}>
                        <StyledFieldLabel>
                          <InputLabel>{entry.label}</InputLabel>
                        </StyledFieldLabel>
                        <div>
                          {entry.type === 'BOOLEAN' ? (
                            <Checkbox
                              checked={Boolean(schemaValues[entry.key])}
                              onCheckedChange={(value) =>
                                handleSchemaValueChange(entry.key, value)
                              }
                            />
                          ) : entry.type === 'SELECT' ? (
                            <DropdownMenuInnerSelect
                              dropdownId={`merchant-custom-setting-select-${entry.key}`}
                              options={selectOptions}
                              selectedOption={selectedOption}
                              isDropdownInModal
                              onChange={(option) =>
                                handleSchemaValueChange(
                                  entry.key,
                                  option.value as string,
                                )
                              }
                            />
                          ) : entry.type === 'DATE' ? (
                            <StyledNativeInput
                              type="date"
                              value={currentValue}
                              onChange={(event) =>
                                handleSchemaValueChange(
                                  entry.key,
                                  event.target.value,
                                )
                              }
                            />
                          ) : entry.type === 'NUMBER' ? (
                            <StyledNativeInput
                              type="number"
                              value={currentValue}
                              onChange={(event) =>
                                handleSchemaValueChange(
                                  entry.key,
                                  event.target.value,
                                )
                              }
                            />
                          ) : entry.type === 'RICH_TEXT' ? (
                            <StyledNativeTextarea
                              value={currentValue}
                              onChange={(event) =>
                                handleSchemaValueChange(
                                  entry.key,
                                  event.target.value,
                                )
                              }
                            />
                          ) : (
                            <SettingsTextInput
                              instanceId={`merchant-custom-setting-${entry.key}`}
                              value={currentValue}
                              onChange={(value) =>
                                handleSchemaValueChange(entry.key, value ?? '')
                              }
                              placeholder={
                                entry.type === 'ARRAY'
                                  ? t`Comma-separated values`
                                  : entry.label
                              }
                              disableHotkeys
                              fullWidth
                            />
                          )}
                        </div>
                      </Fragment>
                    );
                  })}
                </StyledFieldGrid>
              )}
            </Section>
          </StyledScrollableSection>
          <StyledFooter>
            <Button
              onClick={() => closeModal(modalInstanceId)}
              title={hasSchema ? t`Cancel` : t`Close`}
              variant="secondary"
              fullWidth
            />
            {hasSchema && (
              <Button
                onClick={handleSave}
                title={t`Save`}
                variant="primary"
                accent="blue"
                fullWidth
              />
            )}
          </StyledFooter>
        </StyledModalContent>
      </ModalStatefulWrapper>
    </>
  );
};
