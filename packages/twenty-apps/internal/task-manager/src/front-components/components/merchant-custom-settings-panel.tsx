import { Fragment, useEffect, useState } from 'react';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';

import {
  type CustomSettingDraftValue,
  type CustomSettingFieldSchemaEntry,
  isCustomSettingFileValue,
} from '../../types/custom-setting-schema';
import { formatCustomSettingFileName } from '../../utils/build-custom-setting-file-value.util';
import {
  buildCustomSettingDraft,
  formatCustomSettingValue,
  mergeCustomSettingValues,
} from '../../utils/custom-setting-value.util';
import { MerchantCustomSettingInput } from './merchant-custom-setting-input';
import { MerchantCustomSettingToolCard } from './merchant-custom-setting-tool-card';
import { TaskButton } from './task-button';
import { TaskCheckbox } from './task-checkbox';
import { TaskMessage } from './task-message';
import { TaskTabs } from './task-tabs';
import { TASK_TOKENS } from './task-tokens';
import { useMerchantCustomSettings } from '../hooks/use-merchant-custom-settings';

// The same 90px label column RecordInlineCellContainer gives a field row, so
// the read-only fallback and the host's FIELDS widget above it read as one.
const LABEL_WIDTH = 90;
const LABEL_COLUMN_WIDTH = 140;
const ROW_MIN_HEIGHT = 24;

type CustomSettingsTab = 'settings' | 'tools';

const SettingsFrame = ({
  children,
  isDivided,
}: {
  children: React.ReactNode;
  isDivided: boolean;
}) => (
  <section
    style={{
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: TASK_TOKENS.fontFamily,
      gap: isDivided ? 0 : 8,
      padding: 0,
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
        color:
          text.length === 0 ? TASK_TOKENS.textLight : TASK_TOKENS.textPrimary,
        fontSize: 13,
        overflowWrap: 'anywhere',
      }}
    >
      {text.length === 0 ? t('Empty') : text}
    </span>
  );
};

// Inline form, no dialog: Settings (plain fields) and Tools (TOOL entries) are
// two tabs of the widget itself. A tab bar only renders when the schema
// declares both kinds — a schema with one of them opens straight to it.
export const MerchantCustomSettingsPanel = ({
  merchantId,
  isDivided = false,
}: {
  merchantId: string | null;
  // Inside a bordered card: rows run edge to edge with a rule between them,
  // the way the Fields list beside it does.
  isDivided?: boolean;
}) => {
  const dividedRowStyle = (index: number): React.CSSProperties =>
    isDivided
      ? {
          borderTop:
            index === 0 ? 'none' : `1px solid ${TASK_TOKENS.borderLight}`,
          padding: '10px 12px',
        }
      : {};
  const padded = (node: React.ReactNode) =>
    isDivided ? <div style={{ padding: 12 }}>{node}</div> : node;

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

  const hasSettings = schema.fields.length > 0;
  const hasTools = schema.tools.length > 0;
  const showTabBar = hasSettings && hasTools;

  const [activeTab, setActiveTab] = useState<CustomSettingsTab>('settings');
  const currentTab: CustomSettingsTab = !hasSettings
    ? 'tools'
    : !hasTools
      ? 'settings'
      : activeTab;

  const [draftValues, setDraftValues] = useState<
    Record<string, CustomSettingDraftValue>
  >({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Rebuilt when the record behind the widget changes or the first load
  // lands. Deliberately not on every values change: a tool run folds its own
  // key into values, and that must not wipe a settings draft mid-edit.
  useEffect(() => {
    if (!isLoading) {
      setDraftValues(buildCustomSettingDraft(schema.fields, values));
      setSaveError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchantId, isLoading]);

  if (isLoading) {
    return null;
  }

  if (loadError !== null) {
    return padded(<TaskMessage text={loadError} tone="danger" />);
  }

  if (!hasSettings && !hasTools) {
    return padded(
      <TaskMessage
        text={t('This merchant app declares no custom settings.')}
      />,
    );
  }

  if (!canUpdate) {
    return (
      <SettingsFrame isDivided={isDivided}>
        {schema.fields.map((entry, index) => (
          <div
            key={entry.key}
            style={{
              alignItems: 'center',
              display: 'flex',
              gap: 4,
              minHeight: ROW_MIN_HEIGHT,
              ...dividedRowStyle(index),
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
      </SettingsFrame>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const savedValues = await save(
        mergeCustomSettingValues({
          entries: schema.fields,
          storedValues: values,
          draftValues,
        }),
      );

      setDraftValues(buildCustomSettingDraft(schema.fields, savedValues));
      await enqueueSnackbar({
        message: t('Custom settings saved'),
        variant: 'success',
      });
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SettingsFrame isDivided={isDivided}>
      {showTabBar ? (
        <TaskTabs
          value={currentTab}
          tabs={[
            { value: 'settings', label: t('Settings') },
            { value: 'tools', label: t('Tools') },
          ]}
          onChange={setActiveTab}
        />
      ) : null}

      {currentTab === 'settings' ? (
        <>
          {saveError === null
            ? null
            : padded(
                <span style={{ color: TASK_TOKENS.textDanger, fontSize: 12 }}>
                  {saveError}
                </span>,
              )}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: isDivided ? 0 : 12,
            }}
          >
            {schema.fields.map((entry, index) => (
              <div
                key={entry.key}
                style={{
                  columnGap: 16,
                  display: 'grid',
                  gridTemplateColumns: `minmax(100px, ${LABEL_COLUMN_WIDTH}px) 1fr`,
                  ...dividedRowStyle(index),
                }}
              >
                <span
                  style={{
                    alignItems: 'center',
                    color: TASK_TOKENS.textSecondary,
                    display: 'flex',
                    fontSize: 13,
                    minHeight: 32,
                    overflowWrap: 'anywhere',
                  }}
                >
                  {entry.label}
                  {entry.required === true ? (
                    <span style={{ color: TASK_TOKENS.textDanger }}>
                      &nbsp;*
                    </span>
                  ) : null}
                </span>
                <div style={{ minWidth: 0 }}>
                  <MerchantCustomSettingInput
                    entry={entry}
                    uploadFieldMetadataId={uploadFieldMetadataId}
                    value={
                      draftValues[entry.key] ??
                      formatCustomSettingValue(entry, undefined)
                    }
                    onChange={(value) =>
                      setDraftValues((current) => ({
                        ...current,
                        [entry.key]: value,
                      }))
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              ...dividedRowStyle(1),
            }}
          >
            <TaskButton
              variant="primary"
              onClick={handleSave}
              isDisabled={isSaving}
            >
              {isSaving ? t('Saving...') : t('Save')}
            </TaskButton>
          </div>
        </>
      ) : (
        padded(
          schema.tools.map((tool, toolIndex) => (
            <Fragment key={tool.key}>
              {toolIndex > 0 ? (
                <div
                  style={{
                    background: TASK_TOKENS.borderLight,
                    height: 1,
                    margin: '8px 0',
                    width: '100%',
                  }}
                />
              ) : null}
              <MerchantCustomSettingToolCard
                tool={tool}
                values={values}
                uploadFieldMetadataId={uploadFieldMetadataId}
                onRun={async (params) => {
                  await runTool(tool.key, params);
                  await enqueueSnackbar({
                    message: t('Tool started'),
                    variant: 'success',
                  });
                }}
              />
            </Fragment>
          )),
        )
      )}
    </SettingsFrame>
  );
};
