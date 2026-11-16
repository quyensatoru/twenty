import { useState } from 'react';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';
import { IconCheckbox } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';

import { TASK_SAVE_ROUTE_PATH } from '../../constants/route-paths';
import { type TaskDetail, type TaskDetailResult } from '../../types/tasks';
import { postAppRoute, readErrorText } from '../utils/post-app-route.util';
import { BcSidePanel } from './bc-side-panel';
import { BC_TOKENS, spacing } from './bc-theme';
import {
  EMPTY_TASK_DRAFT,
  TaskFields,
  type TaskFormDraft,
  toTaskSaveRequest,
  validateTaskForm,
} from './task-fields';

export const TaskFormPanel = ({
  width,
  onClose,
  onCreated,
}: {
  width: number | string;
  onClose: () => void;
  onCreated: (task: TaskDetail) => void;
}) => {
  const [draft, setDraft] = useState<TaskFormDraft>(EMPTY_TASK_DRAFT);
  const [hasTriedSave, setHasTriedSave] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const errors = hasTriedSave ? validateTaskForm(draft) : {};

  const save = async () => {
    setHasTriedSave(true);

    if (Object.keys(validateTaskForm(draft)).length > 0) {
      return;
    }

    setIsSaving(true);

    try {
      const result = await postAppRoute<TaskDetailResult & { success: true }>(
        TASK_SAVE_ROUTE_PATH,
        toTaskSaveRequest(null, draft, null),
      );

      void enqueueSnackbar({ message: t('Task created'), variant: 'success' });
      onCreated(result.task);
    } catch (error) {
      void enqueueSnackbar({ message: readErrorText(error), variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BcSidePanel
      title={t('New task')}
      icon={<IconCheckbox size={16} />}
      width={width}
      ariaLabel={t('New task')}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" color="neutral" size="sm" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button
            variant="solid"
            color="accent"
            size="sm"
            loading={isSaving}
            disabled={isSaving}
            onClick={() => void save()}
          >
            {t('Save task')}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(3), padding: spacing(4) }}>
        <TaskFields
          draft={draft}
          errors={errors}
          isEditable
          showStatus={false}
          showOutcome={false}
          onChange={setDraft}
        />
        <span style={{ color: BC_TOKENS.textTertiary, fontSize: BC_TOKENS.fontSizeSm }}>
          {t('The created date is recorded automatically. Tasks have no due date.')}
        </span>
      </div>
    </BcSidePanel>
  );
};
