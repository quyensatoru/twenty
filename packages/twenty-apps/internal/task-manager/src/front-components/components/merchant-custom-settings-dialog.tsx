import { Fragment, useState } from 'react';
import { t } from 'twenty-sdk/front-component';

import {
  type CustomSettingDraftValue,
  type CustomSettingSchema,
  type CustomSettingValues,
} from '../../types/custom-setting-schema';
import {
  buildCustomSettingDraft,
  listMissingRequiredLabels,
  mergeCustomSettingValues,
} from '../../utils/custom-setting-value.util';
import { MerchantCustomSettingInput } from './merchant-custom-setting-input';
import { MerchantCustomSettingToolCard } from './merchant-custom-setting-tool-card';
import { TaskButton } from './task-button';
import { TASK_TOKENS } from './task-tokens';

const CARD_WIDTH = 460;
// A FIXED height, not a cap: the host repositions this overlay every time its
// element resizes (ResizeObserver in TwentyOverlayRenderer), flipping between
// opening down and opening up whenever the content crosses the viewport edge.
// Settings and Tools render very different amounts of content, and a select's
// own dropdown opens in flow rather than floating — so anything shorter than
// this box growing or shrinking it live reads as the whole dialog jumping.
// Pinning the content area to one height, scrolling inside it instead, is what
// keeps the dialog still while a tab switches or a dropdown opens.
const CONTENT_HEIGHT = 360;
const LABEL_COLUMN_WIDTH = 140;

type CustomSettingsDialogTab = 'settings' | 'tools';

type MerchantCustomSettingsDialogProps = {
  schema: CustomSettingSchema;
  values: CustomSettingValues;
  uploadFieldMetadataId: string | null;
  onSaveSettings: (values: CustomSettingValues) => Promise<void>;
  onRunTool: (
    toolKey: string,
    params: Record<string, CustomSettingDraftValue>,
  ) => Promise<void>;
  onClose: () => void;
};

// Settings (one form, one Save) and tools (independent Run actions) are two
// different interaction models, so they are two tabs of one dialog rather
// than one long scroll. The tab bar itself only renders when the app schema
// declares both kinds — a schema with only one of them opens straight to it.
//
// Rendered inside a <twenty-overlay>: a widget clips its own content and
// paints in a stacking context the widget beside it covers, so the dialog has
// to be drawn by the host over the whole page.
export const MerchantCustomSettingsDialog = ({
  schema,
  values,
  uploadFieldMetadataId,
  onSaveSettings,
  onRunTool,
  onClose,
}: MerchantCustomSettingsDialogProps) => {
  const hasSettings = schema.fields.length > 0;
  const hasTools = schema.tools.length > 0;
  const showTabBar = hasSettings && hasTools;

  const [activeTab, setActiveTab] = useState<CustomSettingsDialogTab>(
    hasSettings ? 'settings' : 'tools',
  );
  const currentTab: CustomSettingsDialogTab = !hasSettings
    ? 'tools'
    : !hasTools
      ? 'settings'
      : activeTab;

  const [draftValues, setDraftValues] = useState<
    Record<string, CustomSettingDraftValue>
  >(() => buildCustomSettingDraft(schema.fields, values));
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const missingLabels = listMissingRequiredLabels(schema.fields, draftValues);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      await onSaveSettings(
        mergeCustomSettingValues({
          entries: schema.fields,
          storedValues: values,
          draftValues,
        }),
      );
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : String(error));
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        background: TASK_TOKENS.background,
        border: `1px solid ${TASK_TOKENS.borderLight}`,
        borderRadius: TASK_TOKENS.radius,
        boxShadow: TASK_TOKENS.shadowStrong,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: TASK_TOKENS.fontFamily,
        width: CARD_WIDTH,
      }}
    >
      <header
        style={{
          color: TASK_TOKENS.textPrimary,
          fontSize: 13,
          fontWeight: 600,
          padding: '12px 16px',
          ...(showTabBar ? {} : { borderBottom: `1px solid ${TASK_TOKENS.borderLight}` }),
        }}
      >
        {t('Custom settings')}
      </header>

      {showTabBar ? (
        <div
          style={{
            borderBottom: `1px solid ${TASK_TOKENS.borderLight}`,
            display: 'flex',
            gap: 16,
            padding: '0 16px',
          }}
        >
          {(['settings', 'tools'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${
                  currentTab === tab ? TASK_TOKENS.textPrimary : 'transparent'
                }`,
                color:
                  currentTab === tab
                    ? TASK_TOKENS.textPrimary
                    : TASK_TOKENS.textSecondary,
                cursor: 'pointer',
                fontFamily: TASK_TOKENS.fontFamily,
                fontSize: 13,
                fontWeight: 500,
                marginBottom: -1,
                padding: '0 0 8px',
              }}
            >
              {tab === 'settings' ? t('Settings') : t('Tools')}
            </button>
          ))}
        </div>
      ) : null}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          height: CONTENT_HEIGHT,
          overflowY: 'auto',
          padding: 16,
        }}
      >
        {currentTab === 'settings' && saveError !== null ? (
          <span style={{ color: TASK_TOKENS.textDanger, fontSize: 12 }}>
            {saveError}
          </span>
        ) : null}

        {currentTab === 'settings' ? (
          <div
            style={{
              columnGap: 16,
              display: 'grid',
              gridTemplateColumns: `minmax(100px, ${LABEL_COLUMN_WIDTH}px) 1fr`,
              rowGap: 12,
            }}
          >
            {schema.fields.map((entry) => (
              <Fragment key={entry.key}>
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
                    value={draftValues[entry.key]}
                    onChange={(value) =>
                      setDraftValues((current) => ({
                        ...current,
                        [entry.key]: value,
                      }))
                    }
                  />
                </div>
              </Fragment>
            ))}
          </div>
        ) : (
          schema.tools.map((tool, toolIndex) => (
            <Fragment key={tool.key}>
              {toolIndex > 0 ? (
                <div
                  style={{
                    background: TASK_TOKENS.borderLight,
                    height: 1,
                    width: '100%',
                  }}
                />
              ) : null}
              <MerchantCustomSettingToolCard
                tool={tool}
                values={values}
                uploadFieldMetadataId={uploadFieldMetadataId}
                onRun={(params) => onRunTool(tool.key, params)}
              />
            </Fragment>
          ))
        )}
      </div>

      <footer
        style={{
          alignItems: 'center',
          borderTop: `1px solid ${TASK_TOKENS.borderLight}`,
          display: 'flex',
          gap: 8,
          justifyContent: 'flex-end',
          padding: '12px 16px',
        }}
      >
        {currentTab === 'settings' ? (
          <>
            <TaskButton onClick={onClose} isDisabled={isSaving}>
              {t('Cancel')}
            </TaskButton>
            <TaskButton
              variant="primary"
              onClick={handleSave}
              isDisabled={isSaving || missingLabels.length > 0}
              title={
                missingLabels.length > 0
                  ? `${t('Required')}: ${missingLabels.join(', ')}`
                  : undefined
              }
            >
              {isSaving ? t('Saving...') : t('Save')}
            </TaskButton>
          </>
        ) : (
          <TaskButton onClick={onClose}>{t('Close')}</TaskButton>
        )}
      </footer>
    </div>
  );
};
