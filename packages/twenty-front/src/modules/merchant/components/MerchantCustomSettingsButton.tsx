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

import { useDirectFileUpload } from '@/file/hooks/useDirectFileUpload';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { InputLabel } from '@/ui/input/components/InputLabel';
import { SettingsTextInput } from '@/ui/input/components/SettingsTextInput';
import { DropdownMenuInnerSelect } from '@/ui/layout/dropdown/components/DropdownMenuInnerSelect';
import { ModalStatefulWrapper } from '@/ui/layout/modal/components/ModalStatefulWrapper';
import { useModal } from '@/ui/layout/modal/hooks/useModal';
import { isDefined } from 'twenty-shared/utils';
import { FileFolder } from '~/generated-metadata/graphql';

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
  | 'SELECT'
  | 'FILE';

type CustomSettingFieldSchemaEntry = {
  key: string;
  label: string;
  type: CustomSettingFieldType;
  options?: string[];
  default?: unknown;
};

// Persisted shape for a FILE-type value — the file itself is never stored on
// the record, only a reference to it plus a signed download URL minted once
// at upload time (see useDirectFileUpload / FileFolder.MerchantCustomSetting).
type CustomSettingFileValue = {
  fileId: string;
  label: string;
  extension: string;
  url: string;
};

type CustomSettingValue = string | boolean | CustomSettingFileValue;

const isCustomSettingFileValue = (
  value: unknown,
): value is CustomSettingFileValue =>
  isDefined(value) &&
  typeof value === 'object' &&
  'fileId' in (value as Record<string, unknown>);

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

const StyledFileRow = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledFileLink = styled.a`
  color: ${themeCssVariables.font.color.primary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
): CustomSettingValue => {
  if (entry.type === 'BOOLEAN') {
    return Boolean(existingValue);
  }
  if (entry.type === 'ARRAY') {
    return Array.isArray(existingValue)
      ? existingValue.join(ARRAY_VALUE_SEPARATOR)
      : '';
  }
  if (entry.type === 'FILE') {
    return isCustomSettingFileValue(existingValue) ? existingValue : '';
  }
  return existingValue?.toString() ?? '';
};

const parseValueForSave = (
  entry: CustomSettingFieldSchemaEntry,
  value: CustomSettingValue,
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
  if (entry.type === 'FILE') {
    return isCustomSettingFileValue(value) ? value : undefined;
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
  const { uploadFile } = useDirectFileUpload();

  const [schemaValues, setSchemaValues] = useState<
    Record<string, CustomSettingValue>
  >({});
  const [uploadingKeys, setUploadingKeys] = useState<Record<string, boolean>>(
    {},
  );

  // Portalled modal content (including the backdrop click-outside-to-close
  // area) still bubbles clicks up the REACT tree (not the DOM tree) to the
  // record field's own click-to-edit handler, which would otherwise flip the
  // underlying customSettings field into raw JSON edit mode every time this
  // modal is dismissed. Stopping propagation here, once, around the whole
  // modal wrapper, guards both the content and the backdrop beneath it.
  const stopClickPropagation = (event: React.SyntheticEvent) => {
    event.stopPropagation();
  };

  const handleOpen = (event: React.MouseEvent) => {
    event.stopPropagation();

    const currentCustomSettings =
      (record?.customSettings as Record<string, unknown> | null) ?? {};

    const initialValues: Record<string, CustomSettingValue> = {};
    fieldSchema.forEach((entry) => {
      initialValues[entry.key] = formatValueForInput(
        entry,
        currentCustomSettings[entry.key] ?? entry.default,
      );
    });
    setSchemaValues(initialValues);
    openModal(modalInstanceId);
  };

  const handleSchemaValueChange = (key: string, value: CustomSettingValue) => {
    setSchemaValues((previousValues) => ({ ...previousValues, [key]: value }));
  };

  const handleFileSelected = async (key: string, file: File | undefined) => {
    if (!isDefined(file)) {
      return;
    }

    setUploadingKeys((previousValues) => ({ ...previousValues, [key]: true }));

    try {
      const uploadedFile = await uploadFile(file, {
        fileFolder: FileFolder.MerchantCustomSetting,
      });

      handleSchemaValueChange(key, {
        fileId: uploadedFile.id,
        label: file.name,
        extension: uploadedFile.path.split('.').pop() ?? '',
        url: uploadedFile.url,
      });
    } finally {
      setUploadingKeys((previousValues) => ({
        ...previousValues,
        [key]: false,
      }));
    }
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
      <div onClick={stopClickPropagation} onMouseDown={stopClickPropagation}>
        <ModalStatefulWrapper
          modalInstanceId={modalInstanceId}
          size="medium"
          isClosable
          padding="large"
          renderInDocumentBody
        >
          <StyledModalContent>
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
                      const currentValue = String(
                        schemaValues[entry.key] ?? '',
                      );
                      const selectedOption =
                        selectOptions.find(
                          (option) => option.value === currentValue,
                        ) ?? selectOptions[0];
                      const rawValue = schemaValues[entry.key];
                      const currentFileValue = isCustomSettingFileValue(
                        rawValue,
                      )
                        ? rawValue
                        : undefined;

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
                            ) : entry.type === 'FILE' ? (
                              <StyledFileRow>
                                {isDefined(currentFileValue) && (
                                  <StyledFileLink
                                    href={currentFileValue.url}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {currentFileValue.label}
                                  </StyledFileLink>
                                )}
                                <input
                                  type="file"
                                  disabled={uploadingKeys[entry.key]}
                                  onChange={(event) =>
                                    handleFileSelected(
                                      entry.key,
                                      event.target.files?.[0],
                                    )
                                  }
                                />
                              </StyledFileRow>
                            ) : (
                              <SettingsTextInput
                                instanceId={`merchant-custom-setting-${entry.key}`}
                                value={currentValue}
                                onChange={(value) =>
                                  handleSchemaValueChange(
                                    entry.key,
                                    value ?? '',
                                  )
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
      </div>
    </>
  );
};
