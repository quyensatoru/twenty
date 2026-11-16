import { type ReactNode, useState } from 'react';
import { enqueueSnackbar, t, useLocale } from 'twenty-sdk/front-component';
import {
  IconAlertTriangle,
  IconArrowUpRight,
  IconBuildingSkyscraper,
  IconCheckbox,
  IconCode,
  IconTargetArrow,
} from 'twenty-ui/icon';
import { Banner } from 'twenty-ui/primitives/feedback';
import { Button } from 'twenty-ui/primitives/input';

import {
  ISSUE_STATUS_OPTIONS,
  OPPORTUNITY_STATUS_OPTIONS,
  TASK_TRIGGER_TYPE_OPTIONS,
} from '../../constants/select-options';
import { TASK_SAVE_ROUTE_PATH } from '../../constants/route-paths';
import { type TaskDetail, type TaskDetailResult } from '../../types/tasks';
import { readCompletionLabel } from '../../utils/task-rules.util';
import { useTaskDetail } from '../hooks/use-task-detail';
import { openDeveloperIssue } from '../utils/client-navigation.util';
import { formatTaskDate, formatTaskDateTime } from '../utils/task-date-format.util';
import { postAppRoute, readErrorText } from '../utils/post-app-route.util';
import { OPTION_SETS, readOptionLabel } from '../utils/option-labels.util';
import { BcPanelSection, BcSidePanel } from './bc-side-panel';
import { OptionTag, PriorityTag, TaskStatusTag } from './bc-tags';
import { BC_TOKENS, spacing } from './bc-theme';
import {
  TaskFields,
  type TaskFormDraft,
  toTaskFormDraft,
  toTaskSaveRequest,
  validateTaskForm,
} from './task-fields';
import { TaskCategoryTag, TaskSourceLabel } from './task-table';
import { displayGeneratedText } from '../utils/display-text.util';

type TaskDetailPanelProps = {
  taskId: string;
  timeZone: string;
  width: number | string;
  onClose: () => void;
  onSaved: (task: TaskDetail) => void;
  onOpenClient: (vipClientId: string) => void;
};

const InfoRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <div
    style={{
      alignItems: 'center',
      display: 'grid',
      gap: spacing(2),
      gridTemplateColumns: '120px 1fr',
      minHeight: 28,
    }}
  >
    <span style={{ color: BC_TOKENS.textTertiary, fontSize: BC_TOKENS.fontSizeSm }}>{label}</span>
    <span style={{ minWidth: 0 }}>{children}</span>
  </div>
);

const HISTORY_ACTION_LABELS: Record<string, string> = {
  CREATED: 'Created',
  STATUS_CHANGED: 'Status changed',
  UPDATED: 'Updated',
  ESCALATED: 'Priority escalated',
};

const readHistoryValue = (value: string | null | undefined): string => {
  if (value === null || value === undefined) {
    return '';
  }

  const options = [OPTION_SETS.taskStatus, OPTION_SETS.taskPriority].find((set) =>
    set.some((option) => option.value === value),
  );

  return options === undefined ? value : readOptionLabel(options, value);
};

const LinkButton = ({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      alignItems: 'center',
      background: 'transparent',
      border: 'none',
      color: BC_TOKENS.accent,
      cursor: 'pointer',
      display: 'inline-flex',
      flexShrink: 0,
      fontFamily: BC_TOKENS.fontFamily,
      fontSize: BC_TOKENS.fontSizeSm,
      gap: 2,
      padding: 0,
    }}
  >
    {label}
    <IconArrowUpRight size={12} />
  </button>
);

const TaskDetailBody = ({
  task,
  timeZone,
  onSaved,
  onOpenClient,
}: {
  task: TaskDetail;
  timeZone: string;
  onSaved: (task: TaskDetail) => void;
  onOpenClient: (vipClientId: string) => void;
}) => {
  const locale = useLocale();
  const [draft, setDraft] = useState<TaskFormDraft>(() => toTaskFormDraft(task));
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
        toTaskSaveRequest(task.id, draft, task.appName),
      );

      void enqueueSnackbar({ message: t('Task saved'), variant: 'success' });
      onSaved(result.task);
    } catch (error) {
      void enqueueSnackbar({ message: readErrorText(error), variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {!task.canEdit && (
        <div style={{ padding: `${spacing(3)} ${spacing(4)} 0` }}>
          <Banner color="blue" variant="secondary">
            {t('You can view this task. Only its owner can change it.')}
          </Banner>
        </div>
      )}
      <BcPanelSection title={t('Task')}>
        {task.canEdit ? (
          <>
            <TaskFields
              draft={draft}
              errors={errors}
              isEditable
              showStatus
              showOutcome
              onChange={setDraft}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="solid"
                color="accent"
                size="sm"
                loading={isSaving}
                disabled={isSaving}
                onClick={() => void save()}
              >
                {t('Save changes')}
              </Button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(1) }}>
            <span style={{ fontWeight: BC_TOKENS.fontWeightMedium }}>{displayGeneratedText(task.title)}</span>
            {task.notes !== null && (
              <span style={{ color: BC_TOKENS.textSecondary, whiteSpace: 'pre-wrap' }}>{task.notes}</span>
            )}
            <InfoRow label={t('Category')}>
              <TaskCategoryTag category={task.category} customCategory={task.customCategory} />
            </InfoRow>
            <InfoRow label={t('Priority')}>
              <PriorityTag value={task.priority} />
            </InfoRow>
            <InfoRow label={t('Status')}>
              <TaskStatusTag value={task.status} />
            </InfoRow>
            {task.outcome !== null && (
              <InfoRow label={t('Outcome')}>
                <span style={{ whiteSpace: 'pre-wrap' }}>{task.outcome}</span>
              </InfoRow>
            )}
            {task.category === 'UPSELL' && (
              <InfoRow label={t('Upsell outcome')}>
                <OptionTag options={OPTION_SETS.taskOutcomeStatus} value={task.outcomeStatus} />
              </InfoRow>
            )}
          </div>
        )}
      </BcPanelSection>

      <BcPanelSection title={t('Details')}>
        <InfoRow label={t('Source')}>
          <TaskSourceLabel source={task.source} />
        </InfoRow>
        {task.triggerType !== null && (
          <InfoRow label={t('Trigger')}>
            {readOptionLabel(TASK_TRIGGER_TYPE_OPTIONS, task.triggerType)}
          </InfoRow>
        )}
        <InfoRow label={t('Owner')}>{task.ownerName ?? t('Unassigned')}</InfoRow>
        <InfoRow label={t('Created date')}>{formatTaskDateTime(task.createdAt, locale, timeZone)}</InfoRow>
        <InfoRow label={t('Completion')}>
          {readCompletionLabel(task.status) === 'COMPLETED'
            ? t('Completed on {date}', { date: formatTaskDate(task.completedAt, locale, timeZone) })
            : t('Not completed')}
        </InfoRow>
        {task.appName !== null && <InfoRow label={t('App')}>{task.appName}</InfoRow>}
        <InfoRow label={t('Client')}>
          {task.vipClient === null ? (
            <span style={{ color: BC_TOKENS.textTertiary }}>{t('Personal task')}</span>
          ) : (
            <span style={{ alignItems: 'center', display: 'flex', gap: spacing(2), justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontWeight: BC_TOKENS.fontWeightMedium }}>
                  {task.vipClient.name ?? task.vipClient.shopDomain ?? ''}
                </span>
                {task.vipClient.shopDomain !== null && (
                  <span style={{ color: BC_TOKENS.textTertiary, fontSize: BC_TOKENS.fontSizeSm }}>
                    {task.vipClient.shopDomain}
                  </span>
                )}
              </span>
              <Button
                variant="ghost"
                color="neutral"
                size="sm"
                startIcon={<IconBuildingSkyscraper size={14} />}
                onClick={() => {
                  if (task.vipClient !== null) {
                    onOpenClient(task.vipClient.id);
                  }
                }}
              >
                {t('Open client')}
              </Button>
            </span>
          )}
        </InfoRow>
      </BcPanelSection>

      {(task.issue !== null || task.opportunity !== null || task.developerTasks.length > 0) && (
        <BcPanelSection title={t('Linked')}>
          {task.issue !== null && (
            <InfoRow label={t('Client issue')}>
              <span style={{ alignItems: 'center', display: 'flex', gap: spacing(2) }}>
                <IconAlertTriangle size={14} color={BC_TOKENS.textTertiary} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {task.issue.title ?? ''}
                </span>
                <OptionTag options={ISSUE_STATUS_OPTIONS} value={task.issue.status} />
                {task.vipClient !== null && (
                  <LinkButton
                    label={t('Resolve in client profile')}
                    onClick={() => {
                      if (task.vipClient !== null) {
                        onOpenClient(task.vipClient.id);
                      }
                    }}
                  />
                )}
              </span>
            </InfoRow>
          )}
          {task.developerTasks.map((developerTask) => (
            <InfoRow key={developerTask.activityId} label={t('Developer task')}>
              <span style={{ alignItems: 'center', display: 'flex', gap: spacing(2) }}>
                <IconCode size={14} color={BC_TOKENS.textTertiary} />
                <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {developerTask.title}
                </span>
                <span style={{ color: BC_TOKENS.textTertiary, fontSize: BC_TOKENS.fontSizeSm, whiteSpace: 'nowrap' }}>
                  {formatTaskDate(developerTask.createdAt, locale, timeZone)}
                </span>
                <LinkButton
                  label={t('Open')}
                  onClick={() => openDeveloperIssue(developerTask.developerIssueId)}
                />
              </span>
            </InfoRow>
          ))}
          {task.opportunity !== null && (
            <InfoRow label={t('Opportunity')}>
              <span style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: spacing(2) }}>
                <IconTargetArrow size={14} color={BC_TOKENS.textTertiary} />
                <span>
                  {[task.opportunity.appName, task.opportunity.plan, task.opportunity.billingCycle]
                    .filter((part) => part !== null && part.length > 0)
                    .join(' · ')}
                </span>
                {task.opportunity.usagePercent !== null && (
                  <span style={{ color: BC_TOKENS.textTertiary }}>
                    {t('{percent}% used', { percent: Math.round(task.opportunity.usagePercent) })}
                  </span>
                )}
                <OptionTag options={OPPORTUNITY_STATUS_OPTIONS} value={task.opportunity.status} />
              </span>
            </InfoRow>
          )}
        </BcPanelSection>
      )}

      <BcPanelSection title={t('History')}>
        {task.history.length === 0 ? (
          <span style={{ color: BC_TOKENS.textTertiary }}>{t('No changes yet.')}</span>
        ) : (
          <ol style={{ display: 'flex', flexDirection: 'column', gap: spacing(2), listStyle: 'none', margin: 0, padding: 0 }}>
            {task.history.map((entry, index) => (
              <li key={`${entry.at}-${index}`} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span>
                  {t(HISTORY_ACTION_LABELS[entry.action] ?? entry.action)}
                  {entry.from !== undefined && entry.from !== null && entry.to !== undefined && entry.to !== null
                    ? `: ${readHistoryValue(entry.from)} → ${readHistoryValue(entry.to)}`
                    : entry.to !== undefined && entry.to !== null
                      ? `: ${readHistoryValue(entry.to)}`
                      : ''}
                  {entry.action === 'UPDATED' && entry.note !== null && entry.note !== undefined
                    ? ` (${entry.note})`
                    : ''}
                </span>
                <span style={{ color: BC_TOKENS.textTertiary, fontSize: BC_TOKENS.fontSizeSm }}>
                  {[entry.actorName ?? t('Automation'), formatTaskDateTime(entry.at, locale, timeZone)].join(' · ')}
                </span>
              </li>
            ))}
          </ol>
        )}
      </BcPanelSection>
    </>
  );
};

export const TaskDetailPanel = ({
  taskId,
  timeZone,
  width,
  onClose,
  onSaved,
  onOpenClient,
}: TaskDetailPanelProps) => {
  const { task, error, setTask } = useTaskDetail(taskId);
  const [version, setVersion] = useState(0);

  return (
    <BcSidePanel
      title={task === null ? t('Task') : displayGeneratedText(task.title)}
      icon={<IconCheckbox size={16} />}
      width={width}
      ariaLabel={t('Task details')}
      onClose={onClose}
    >
      {error !== null && task === null ? (
        <div style={{ padding: spacing(4) }}>
          <Banner color="danger" variant="secondary">{error}</Banner>
        </div>
      ) : task === null ? (
        <div style={{ color: BC_TOKENS.textTertiary, padding: spacing(4) }}>{t('Loading…')}</div>
      ) : (
        <TaskDetailBody
          key={`${task.id}-${version}`}
          task={task}
          timeZone={timeZone}
          onOpenClient={onOpenClient}
          onSaved={(saved) => {
            setTask(saved);
            setVersion((current) => current + 1);
            onSaved(saved);
          }}
        />
      )}
    </BcSidePanel>
  );
};
