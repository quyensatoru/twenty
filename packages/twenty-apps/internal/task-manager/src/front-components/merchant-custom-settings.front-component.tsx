import { type ReactNode, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import { enqueueSnackbar, t, useRecordId } from 'twenty-sdk/front-component';
import { IconSettings } from 'twenty-ui/icon';

import { MERCHANT_CUSTOM_SETTINGS_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import {
  type CustomSettingFieldSchemaEntry,
  isCustomSettingFileValue,
} from '../types/custom-setting-schema';
import { formatCustomSettingFileName } from '../utils/build-custom-setting-file-value.util';
import { formatCustomSettingValue } from '../utils/custom-setting-value.util';
import { MerchantCustomSettingsDialog } from './components/merchant-custom-settings-dialog';
import { TaskButton } from './components/task-button';
import { TaskCheckbox } from './components/task-checkbox';
import { TaskMessage } from './components/task-message';
import { TaskSkeletonBlock } from './components/task-skeleton-block';
import { TASK_TOKENS } from './components/task-tokens';
import { useMerchantCustomSettings } from './hooks/use-merchant-custom-settings';

// The same 90px label column RecordInlineCellContainer gives a field row, so
// this widget and the host's FIELDS widget above it read as one column.
const LABEL_WIDTH = 90;
const ROW_MIN_HEIGHT = 24;
const SKELETON_ROW_COUNT = 3;
// Just under the button, which is 32 tall in a 16px-padded widget.
const OVERLAY_OFFSET_Y = 36;

const SettingsFrame = ({ children }: { children: ReactNode }) => (
  <section
    style={{
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: TASK_TOKENS.fontFamily,
      gap: 8,
      padding: 16,
      width: '100%',
    }}
  >
    {children}
  </section>
);

const SettingValue = ({
  entry,
  storedValue,
}: {
  entry: CustomSettingFieldSchemaEntry;
  storedValue: unknown;
}) => {
  const value = formatCustomSettingValue(entry, storedValue);

  if (entry.type === 'BOOLEAN') {
    return <TaskCheckbox isChecked={value === true} />;
  }

  const text = isCustomSettingFileValue(value)
    ? formatCustomSettingFileName(value)
    : String(value);

  return (
    <span
      style={{
        color: text.length === 0 ? TASK_TOKENS.textLight : TASK_TOKENS.textPrimary,
        fontSize: 13,
        overflowWrap: 'anywhere',
      }}
    >
      {text.length === 0 ? t('Empty') : text}
    </span>
  );
};

// The fork put this behind a button inside the raw JSON cell, by patching
// FieldDisplay. An app has no hook into a field's display, so the button gets
// a widget of its own on the merchant record page and the dialog opens over
// the page as a host-rendered overlay — one button, one dialog, Settings and
// Tools as its two tabs, matching the fork's own modal shape.
const MerchantCustomSettings = () => {
  const merchantId = useRecordId();
  const {
    schema,
    values,
    canUpdate,
    uploadFieldMetadataId,
    isLoading,
    loadError,
    save,
    runTool,
  } = useMerchantCustomSettings(merchantId ?? null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <SettingsFrame>
        {Array.from({ length: SKELETON_ROW_COUNT }).map((_, index) => (
          <TaskSkeletonBlock key={index} height={ROW_MIN_HEIGHT} />
        ))}
      </SettingsFrame>
    );
  }

  if (loadError !== null) {
    return <TaskMessage text={loadError} tone="danger" />;
  }

  if (schema.fields.length === 0 && schema.tools.length === 0) {
    return (
      <TaskMessage text={t('This merchant app declares no custom settings.')} />
    );
  }

  return (
    <SettingsFrame>
      {schema.fields.map((entry) => (
        <div
          key={entry.key}
          style={{
            alignItems: 'center',
            display: 'flex',
            gap: 4,
            minHeight: ROW_MIN_HEIGHT,
          }}
        >
          <span
            style={{
              color: TASK_TOKENS.textTertiary,
              flexShrink: 0,
              fontSize: TASK_TOKENS.fontSizeSmall,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: LABEL_WIDTH,
            }}
          >
            {entry.label}
          </span>
          <SettingValue entry={entry} storedValue={values[entry.key]} />
        </div>
      ))}

      {canUpdate ? (
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          {/* The overlay anchors to its PARENT element, so it hangs off this
              wrapper rather than off the whole row. */}
          <span style={{ display: 'inline-flex', position: 'relative' }}>
            <TaskButton onClick={() => setIsDialogOpen(!isDialogOpen)}>
              <IconSettings size={14} />
              {t('Custom settings')}
            </TaskButton>

            {isDialogOpen && (
              <twenty-overlay
                offsetY={OVERLAY_OFFSET_Y}
                onClose={() => setIsDialogOpen(false)}
              >
                <MerchantCustomSettingsDialog
                  schema={schema}
                  values={values}
                  uploadFieldMetadataId={uploadFieldMetadataId}
                  onClose={() => setIsDialogOpen(false)}
                  onSaveSettings={async (nextValues) => {
                    await save(nextValues);
                    setIsDialogOpen(false);
                    await enqueueSnackbar({
                      message: t('Custom settings saved'),
                      variant: 'success',
                    });
                  }}
                  onRunTool={async (toolKey, params) => {
                    await runTool(toolKey, params);
                    await enqueueSnackbar({
                      message: t('Tool started'),
                      variant: 'success',
                    });
                  }}
                />
              </twenty-overlay>
            )}
          </span>
        </div>
      ) : null}
    </SettingsFrame>
  );
};

export default defineFrontComponent({
  universalIdentifier: MERCHANT_CUSTOM_SETTINGS_FRONT_COMPONENT_UID,
  name: 'merchant-custom-settings',
  description:
    "A merchant's custom settings, shaped by the schema its app declares and written through the app's scoped routes.",
  component: MerchantCustomSettings,
});
