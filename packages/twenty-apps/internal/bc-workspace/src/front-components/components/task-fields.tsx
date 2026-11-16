import { t } from 'twenty-sdk/front-component';

import {
  type TaskCategory,
  type TaskOutcomeStatus,
  type TaskPriority,
  type TaskStatus,
} from '../../types/bc-records';
import {
  type TaskClientSummary,
  type TaskDetail,
  type TaskSaveRequest,
} from '../../types/tasks';
import {
  CUSTOM_CATEGORY_MAX_LENGTH,
  type TaskDraftErrors,
  validateTaskDraft,
} from '../../utils/task-rules.util';
import { OPTION_SETS, toSelectOptions } from '../utils/option-labels.util';
import { BcSelect } from './bc-select';
import { BcField, BcTextArea, BcTextInput } from './bc-text-input';
import { BC_TOKENS, spacing } from './bc-theme';
import { ClientAutocomplete } from './client-autocomplete';

export type TaskFormDraft = {
  title: string;
  notes: string;
  category: TaskCategory;
  customCategory: string;
  priority: TaskPriority;
  status: TaskStatus;
  outcome: string;
  outcomeStatus: TaskOutcomeStatus | null;
  client: TaskClientSummary | null;
};

export const EMPTY_TASK_DRAFT: TaskFormDraft = {
  title: '',
  notes: '',
  category: 'FOLLOW_UP',
  customCategory: '',
  priority: 'MEDIUM',
  status: 'TODO',
  outcome: '',
  outcomeStatus: null,
  client: null,
};

export const toTaskFormDraft = (task: TaskDetail): TaskFormDraft => ({
  title: task.title,
  notes: task.notes ?? '',
  category: task.category,
  customCategory: task.customCategory ?? '',
  priority: task.priority,
  status: task.status,
  outcome: task.outcome ?? '',
  outcomeStatus: task.outcomeStatus,
  client: task.vipClient,
});

export const toTaskSaveRequest = (
  taskId: string | null,
  draft: TaskFormDraft,
  appName: string | null,
): TaskSaveRequest => ({
  taskId,
  title: draft.title,
  notes: draft.notes,
  vipClientId: draft.client?.id ?? null,
  category: draft.category,
  customCategory: draft.customCategory,
  priority: draft.priority,
  status: draft.status,
  outcome: draft.outcome,
  outcomeStatus: draft.category === 'UPSELL' ? (draft.outcomeStatus ?? 'PENDING') : null,
  appName,
});

export const validateTaskForm = (draft: TaskFormDraft): TaskDraftErrors =>
  validateTaskDraft(draft);

const translateError = (message: string | undefined): string | null =>
  message === undefined ? null : t(message);

export const TaskFields = ({
  draft,
  errors,
  isEditable,
  showStatus,
  showOutcome,
  onChange,
}: {
  draft: TaskFormDraft;
  errors: TaskDraftErrors;
  isEditable: boolean;
  showStatus: boolean;
  showOutcome: boolean;
  onChange: (draft: TaskFormDraft) => void;
}) => {
  const update = (patch: Partial<TaskFormDraft>) => onChange({ ...draft, ...patch });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(3) }}>
      <BcField label={t('Client')}>
        {isEditable ? (
          <ClientAutocomplete
            value={draft.client}
            onChange={(client) => update({ client })}
          />
        ) : (
          <span>
            {draft.client === null
              ? t('Personal task')
              : (draft.client.name ?? draft.client.shopDomain ?? '')}
          </span>
        )}
      </BcField>
      <BcField label={t('Title')} isRequired error={translateError(errors.title)}>
        <BcTextInput
          value={draft.title}
          onChange={(title) => update({ title })}
          ariaLabel={t('Title')}
          placeholder={t('What needs to happen?')}
          maxLength={250}
          hasError={errors.title !== undefined}
        />
      </BcField>
      <div style={{ display: 'grid', gap: spacing(3), gridTemplateColumns: '1fr 1fr' }}>
        <BcField label={t('Category')}>
          <BcSelect
            value={draft.category}
            isDisabled={!isEditable}
            ariaLabel={t('Category')}
            options={toSelectOptions(OPTION_SETS.taskCategory)}
            onChange={(category) => update({ category: category as TaskCategory })}
          />
        </BcField>
        <BcField label={t('Priority')}>
          <BcSelect
            value={draft.priority}
            isDisabled={!isEditable}
            ariaLabel={t('Priority')}
            options={toSelectOptions(OPTION_SETS.taskPriority)}
            onChange={(priority) => update({ priority: priority as TaskPriority })}
          />
        </BcField>
      </div>
      {draft.category === 'OTHER' && (
        <BcField
          label={t('Custom category name')}
          isRequired
          error={translateError(errors.customCategory)}
        >
          <BcTextInput
            value={draft.customCategory}
            onChange={(customCategory) => update({ customCategory })}
            ariaLabel={t('Custom category name')}
            placeholder={t('e.g. Quarterly account planning')}
            maxLength={CUSTOM_CATEGORY_MAX_LENGTH}
            hasError={errors.customCategory !== undefined}
          />
        </BcField>
      )}
      {showStatus && (
        <BcField label={t('Status')}>
          <BcSelect
            value={draft.status}
            isDisabled={!isEditable}
            ariaLabel={t('Status')}
            options={toSelectOptions(OPTION_SETS.taskStatus)}
            onChange={(status) => update({ status: status as TaskStatus })}
          />
        </BcField>
      )}
      <BcField label={t('Notes / expected action')}>
        <BcTextArea
          value={draft.notes}
          onChange={(notes) => update({ notes })}
          ariaLabel={t('Notes')}
          maxLength={2500}
        />
      </BcField>
      {showOutcome && draft.category === 'UPSELL' && (
        <BcField
          label={t('Upsell opportunity outcome')}
          hint={t('A Converted label alone does not establish a verified upgrade.')}
        >
          <BcSelect
            value={draft.outcomeStatus ?? 'PENDING'}
            isDisabled={!isEditable}
            ariaLabel={t('Upsell opportunity outcome')}
            options={toSelectOptions(OPTION_SETS.taskOutcomeStatus)}
            onChange={(outcomeStatus) =>
              update({ outcomeStatus: outcomeStatus as TaskOutcomeStatus })
            }
          />
        </BcField>
      )}
      {showOutcome && (
        <BcField label={t('Outcome / notes')}>
          <BcTextArea
            value={draft.outcome}
            onChange={(outcome) => update({ outcome })}
            ariaLabel={t('Outcome')}
            placeholder={t('What happened and what is the result?')}
            maxLength={2500}
          />
        </BcField>
      )}
      {draft.category === 'CLIENT_ISSUE' && draft.status === 'COMPLETED' && (
        <span
          style={{
            background: BC_TOKENS.backgroundTertiary,
            borderRadius: BC_TOKENS.radiusSmall,
            color: BC_TOKENS.textSecondary,
            fontSize: BC_TOKENS.fontSizeSm,
            padding: `${spacing(2)} ${spacing(3)}`,
          }}
        >
          {t(
            'Completing this task does not resolve the issue. Confirm the resolution from the client profile.',
          )}
        </span>
      )}
    </div>
  );
};
