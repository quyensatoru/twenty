import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';

import {
  type CustomSettingDraftValue,
  type CustomSettingFieldSchemaEntry,
  isCustomSettingFileValue,
} from '../../types/custom-setting-schema';
import { MerchantCustomSettingFileInput } from './merchant-custom-setting-file-input';
import { TaskCheckbox } from './task-checkbox';
import { getTaskControlStyle, TASK_BARE_FIELD_STYLE } from './task-control-styles';
import { TaskSelect } from './task-select';
import { TaskTextInput } from './task-text-input';
import { TASK_TOKENS } from './task-tokens';

const RICH_TEXT_MIN_HEIGHT = 72;

type MerchantCustomSettingInputProps = {
  entry: CustomSettingFieldSchemaEntry;
  value: CustomSettingDraftValue;
  onChange: (value: CustomSettingDraftValue) => void;
  uploadFieldMetadataId: string | null;
};

// One schema entry, drawn as the control its type asks for. Every type but
// BOOLEAN edits as a string; parseCustomSettingValue is what turns the string
// back into the stored shape on save.
export const MerchantCustomSettingInput = ({
  entry,
  value,
  onChange,
  uploadFieldMetadataId,
}: MerchantCustomSettingInputProps) => {
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);

  // Drop or paste, never a picker: an <input type="file"> inside a front
  // component hands the guest the file's NAME and SIZE and nothing else, while
  // a dropped or pasted file arrives with the handle uploadFileByHandle needs
  // (serializeTransferredFileList in twenty-front-component-renderer).
  if (entry.type === 'FILE') {
    return (
      <MerchantCustomSettingFileInput
        value={isCustomSettingFileValue(value) ? value : null}
        onChange={(file) => onChange(file ?? '')}
        ariaLabel={entry.label}
        uploadFieldMetadataId={uploadFieldMetadataId}
      />
    );
  }

  if (entry.type === 'BOOLEAN') {
    const isChecked = value === true;

    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={isChecked}
        aria-label={entry.label}
        onClick={() => onChange(!isChecked)}
        style={{
          alignItems: 'center',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'inline-flex',
          height: 32,
          padding: 0,
        }}
      >
        <TaskCheckbox isChecked={isChecked} />
      </button>
    );
  }

  if (entry.type === 'SELECT') {
    return (
      <TaskSelect
        value={String(value)}
        options={(entry.options ?? []).map((option) => ({
          value: option,
          label: option,
        }))}
        onChange={onChange}
        ariaLabel={entry.label}
        width="100%"
      />
    );
  }

  if (entry.type === 'RICH_TEXT') {
    return (
      <textarea
        aria-label={entry.label}
        value={String(value)}
        onFocus={() => setIsTextareaFocused(true)}
        onBlur={() => setIsTextareaFocused(false)}
        onChange={(event) => onChange(event.target.value)}
        style={{
          ...getTaskControlStyle(isTextareaFocused),
          ...TASK_BARE_FIELD_STYLE,
          background: TASK_TOKENS.backgroundTransparentLighter,
          border: `1px solid ${
            isTextareaFocused ? TASK_TOKENS.accent : TASK_TOKENS.border
          }`,
          minHeight: RICH_TEXT_MIN_HEIGHT,
          padding: 8,
          resize: 'vertical',
        }}
      />
    );
  }

  return (
    <TaskTextInput
      value={String(value)}
      onChange={onChange}
      ariaLabel={entry.label}
      type={
        entry.type === 'NUMBER'
          ? 'number'
          : entry.type === 'DATE'
            ? 'date'
            : 'text'
      }
      placeholder={entry.type === 'ARRAY' ? t('Comma separated') : undefined}
    />
  );
};
