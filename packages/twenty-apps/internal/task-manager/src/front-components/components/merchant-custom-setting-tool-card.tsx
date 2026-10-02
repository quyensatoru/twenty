import { Fragment, useState } from 'react';
import { t } from 'twenty-sdk/front-component';

import {
  type CustomSettingDraftValue,
  type CustomSettingToolRunStatus,
  type CustomSettingToolSchemaEntry,
  type CustomSettingValues,
  isCustomSettingToolRun,
} from '../../types/custom-setting-schema';
import {
  buildCustomSettingDraft,
  hasCustomSettingValue,
} from '../../utils/custom-setting-value.util';
import { formatDateTimeLabel } from '../utils/format-date-time-label.util';
import { MerchantCustomSettingInput } from './merchant-custom-setting-input';
import { TaskButton } from './task-button';
import { TaskTag } from './task-tag';
import { TASK_TOKENS } from './task-tokens';

const LABEL_COLUMN_WIDTH = 140;

const TAG_COLOR_BY_STATUS: Record<CustomSettingToolRunStatus, string> = {
  REQUESTED: 'blue',
  PROCESSING: 'orange',
  DONE: 'green',
  FAILED: 'red',
};

type MerchantCustomSettingToolCardProps = {
  tool: CustomSettingToolSchemaEntry;
  values: CustomSettingValues;
  uploadFieldMetadataId: string | null;
  onRun: (params: Record<string, CustomSettingDraftValue>) => Promise<void>;
};

// Each tool runs independently of the others and of the settings form: a
// run-envelope written under the tool's own key, never a record field, so one
// tool's inputs never touch another's and Settings keeps its own Save.
export const MerchantCustomSettingToolCard = ({
  tool,
  values,
  uploadFieldMetadataId,
  onRun,
}: MerchantCustomSettingToolCardProps) => {
  const [paramValues, setParamValues] = useState<
    Record<string, CustomSettingDraftValue>
  >(() => buildCustomSettingDraft(tool.fields, {}));
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  const handleRun = async () => {
    setIsRunning(true);
    setRunError(null);

    try {
      await onRun(paramValues);
    } catch (error) {
      setRunError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsRunning(false);
    }
  };

  const rawLastRun = values[tool.key];
  const lastRun = isCustomSettingToolRun(rawLastRun) ? rawLastRun : null;

  const hasMissingRequiredField = tool.fields.some(
    (field) =>
      field.required === true &&
      !hasCustomSettingValue(field, paramValues[field.key]),
  );

  const lastRunText =
    lastRun === null
      ? null
      : [
          lastRun.result?.summary,
          formatDateTimeLabel(lastRun.requestedAt),
          lastRun.requestedBy,
        ]
          .filter((part) => (part ?? '').length > 0)
          .join(' · ') || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: 8,
          justifyContent: 'space-between',
        }}
      >
        <div style={{ alignItems: 'center', display: 'flex', gap: 8, minWidth: 0 }}>
          <span
            style={{
              color: TASK_TOKENS.textPrimary,
              fontSize: 13,
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {tool.label}
          </span>
          {lastRun === null ? null : (
            <TaskTag color={TAG_COLOR_BY_STATUS[lastRun.status] ?? 'gray'}>
              {lastRun.status}
            </TaskTag>
          )}
        </div>

        <TaskButton
          variant="primary"
          size="small"
          isDisabled={isRunning || hasMissingRequiredField}
          onClick={handleRun}
        >
          {isRunning ? t('Running...') : t('Run')}
        </TaskButton>
      </div>

      {tool.fields.length === 0 ? null : (
        <div
          style={{
            columnGap: 16,
            display: 'grid',
            gridTemplateColumns: `minmax(100px, ${LABEL_COLUMN_WIDTH}px) 1fr`,
            rowGap: 8,
          }}
        >
          {tool.fields.map((field) => (
            <Fragment key={field.key}>
              <span
                style={{
                  alignItems: 'center',
                  color: TASK_TOKENS.textSecondary,
                  display: 'flex',
                  fontSize: 13,
                  minHeight: 32,
                }}
              >
                {field.label}
                {field.required === true ? (
                  <span style={{ color: TASK_TOKENS.textDanger }}>&nbsp;*</span>
                ) : null}
              </span>
              <div style={{ minWidth: 0 }}>
                <MerchantCustomSettingInput
                  entry={field}
                  value={paramValues[field.key]}
                  uploadFieldMetadataId={uploadFieldMetadataId}
                  onChange={(value) =>
                    setParamValues((current) => ({
                      ...current,
                      [field.key]: value,
                    }))
                  }
                />
              </div>
            </Fragment>
          ))}
        </div>
      )}

      {lastRunText === null ? null : (
        <span
          style={{
            color: TASK_TOKENS.textTertiary,
            fontSize: TASK_TOKENS.fontSizeSmall,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {lastRunText}
        </span>
      )}

      {runError === null ? null : (
        <span style={{ color: TASK_TOKENS.textDanger, fontSize: 12 }}>
          {runError}
        </span>
      )}
    </div>
  );
};
