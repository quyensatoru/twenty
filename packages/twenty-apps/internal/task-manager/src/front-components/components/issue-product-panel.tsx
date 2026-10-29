import { useMemo, useState } from 'react';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';
import {
  IconArchive,
  IconArrowRight,
  IconLock,
  IconPlus,
  IconRestore,
  IconX,
} from 'twenty-ui/icon';

import {
  BUG_SEVERITY_OPTIONS,
  REQUEST_SOURCE_OPTIONS,
  SET_ISSUE_STAGE_ROUTE_PATH,
} from '../../constants/product-backlog';
import { type IssueStage, type ProductItem } from '../../types/product-backlog';
import { type BoardIssue } from '../../types/task-board';
import { readItemReadiness } from '../../utils/product-backlog/item-readiness.util';
import { readEpicColor } from '../../utils/epic-color.util';
import { findPrioritizationTemplate } from '../../utils/product-backlog/prioritization-templates.util';
import { type ProductItemContext } from '../hooks/use-product-item-context';
import {
  AcceptanceCriteriaEditor,
  ReadinessChecklist,
  UserStoryEditor,
} from '../product-backlog/components/product-item-editors';
import { ProductScoreEditor } from '../product-backlog/components/product-score-editor';
import {
  PRODUCT_MUTED_STYLE,
  PRODUCT_TEXT_STYLE,
  ProductCommitTextInput,
  ProductSectionLabel,
  ProductTextArea,
} from '../product-backlog/components/product-ui';
import { postAppRoute } from '../utils/post-app-route.util';
import { readErrorText } from '../utils/read-error-text.util';
import { IssueBacklogContext } from './issue-backlog-context';
import { TaskBoardSelect } from './task-board-select';
import {
  TASK_DETAIL_BLOCK_FRAME_STYLE,
  TASK_DETAIL_BLOCK_INSET,
} from './task-control-styles';
import { TaskButton } from './task-button';
import { TaskChip } from './task-chip';
import { TaskIconButton } from './task-icon-button';
import { TaskIssueSearch } from './task-issue-search';
import { TaskProgressBar } from './task-progress-bar';
import { readTagColor, TASK_TOKENS } from './task-tokens';

const NONE_VALUE = '';

type IssueProductPanelProps = {
  item: ProductItem;
  context: ProductItemContext | null;
  epics: readonly { id: string; name?: string | null; color?: string | null }[];
  onUpdate: (patch: Partial<ProductItem>) => void;
  // The stage moved: the board and the page behind the modal re-read.
  onStageChanged: () => void;
  onOpenIssue: (issueId: string) => void;
};

// The product side of an issue: why it exists, what "done" means and whether
// it is ready. Full for a backlog item; for an issue on the Board, only what
// the people building it need to read.
//
// Mount it per issue: the Board's block fixes its fields when it opens.
export const IssueProductPanel = ({
  item,
  context,
  epics,
  onUpdate,
  onStageChanged,
  onOpenIssue,
}: IssueProductPanelProps) => {
  const [isAddingBlocker, setIsAddingBlocker] = useState(false);
  const [blockerSearch, setBlockerSearch] = useState('');
  const [isMoving, setIsMoving] = useState(false);

  const linkedIssuesById = useMemo(
    () =>
      new Map((context?.linkedIssues ?? []).map((issue) => [issue.id, issue])),
    [context],
  );

  if (context === null) {
    return null;
  }

  const stage = (item.stage ?? 'ISSUE') as IssueStage;
  const isItem = stage === 'ITEM';
  const isReadOnly = !context.canWrite;
  const template = findPrioritizationTemplate(
    context.settings.activeTemplateId,
  );
  const readiness = readItemReadiness({
    item,
    settings: context.settings,
    linkedIssuesById,
    doneStatusIds: context.doneStatusIds,
  });
  const blockerIds = item.blockedByIssueIds ?? [];

  const moveToStage = async (nextStage: IssueStage) => {
    setIsMoving(true);

    try {
      await postAppRoute(SET_ISSUE_STAGE_ROUTE_PATH, {
        issueIds: [item.id],
        stage: nextStage,
      });
      void enqueueSnackbar({
        message:
          nextStage === 'ISSUE'
            ? t('Pushed to the Board, in PLANNED.')
            : nextStage === 'ARCHIVED'
              ? t('Archived.')
              : t('Back in the Product Backlog.'),
        variant: 'success',
      });
      onStageChanged();
    } catch (error) {
      void enqueueSnackbar({ message: readErrorText(error), variant: 'error' });
    } finally {
      setIsMoving(false);
    }
  };

  if (stage === 'ISSUE') {
    return (
      <IssueBacklogContext
        item={item}
        isReadOnly={isReadOnly}
        onUpdate={onUpdate}
      />
    );
  }

  const stageColor = readTagColor(isItem ? 'blue' : 'gray');

  return (
    <section
      style={{
        ...TASK_DETAIL_BLOCK_FRAME_STYLE,
        border: `1px solid ${TASK_TOKENS.border}`,
        borderRadius: TASK_TOKENS.radius,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: `14px ${TASK_DETAIL_BLOCK_INSET}px`,
      }}
    >
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <strong style={PRODUCT_TEXT_STYLE}>{t('Product')}</strong>
        <span
          style={{
            background: stageColor.background,
            borderRadius: TASK_TOKENS.radiusExtraSmall,
            color: stageColor.text,
            fontFamily: TASK_TOKENS.fontFamily,
            fontSize: 11,
            fontWeight: 600,
            padding: '1px 6px',
          }}
        >
          {isItem ? t('Backlog item') : t('Archived')}
        </span>
        <span style={{ flex: 1 }} />
        {!isReadOnly && isItem && (
          <>
            <TaskButton
              size="small"
              variant="primary"
              isDisabled={isMoving}
              title={
                readiness.isReady
                  ? undefined
                  : t('Not ready yet: it still goes, with a warning.')
              }
              onClick={() => void moveToStage('ISSUE')}
            >
              <IconArrowRight size={14} />
              {readiness.isReady
                ? t('Push to Board')
                : t('Push to Board · DoR {passed}/{total}', {
                    passed: readiness.passedCount,
                    total: readiness.totalCount,
                  })}
              {!readiness.isReady && (
                <span
                  aria-hidden
                  style={{
                    background: readTagColor('orange').text,
                    borderRadius: '50%',
                    flexShrink: 0,
                    height: 8,
                    width: 8,
                  }}
                />
              )}
            </TaskButton>
            <TaskButton
              size="small"
              variant="ghost"
              isDisabled={isMoving}
              onClick={() => void moveToStage('ARCHIVED')}
            >
              <IconArchive size={14} />
              {t('Archive')}
            </TaskButton>
          </>
        )}
        {!isReadOnly && stage === 'ARCHIVED' && (
          <TaskButton
            size="small"
            isDisabled={isMoving}
            onClick={() => void moveToStage('ITEM')}
          >
            <IconRestore size={14} />
            {t('Restore to backlog')}
          </TaskButton>
        )}
      </div>

      {isItem && (
        <div
          style={{
            display: 'grid',
            gap: 10,
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          }}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <ProductSectionLabel>{t('Strategic goal')}</ProductSectionLabel>
            <TaskBoardSelect
              ariaLabel={t('Strategic goal')}
              width="100%"
              isDisabled={isReadOnly}
              value={item.strategicGoalId ?? NONE_VALUE}
              options={[
                { value: NONE_VALUE, label: t('No goal') },
                ...context.settings.goals.map((goal) => ({
                  value: goal.id,
                  label: goal.name,
                  color: goal.color,
                })),
              ]}
              onChange={(value) =>
                onUpdate({
                  strategicGoalId: value === NONE_VALUE ? null : value,
                })
              }
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <ProductSectionLabel>{t('Epic')}</ProductSectionLabel>
            <TaskBoardSelect
              ariaLabel={t('Epic')}
              width="100%"
              isDisabled={isReadOnly || typeof item.parentId === 'string'}
              value={item.epicId ?? NONE_VALUE}
              options={[
                { value: NONE_VALUE, label: t('No epic') },
                ...epics.map((epic) => ({
                  value: epic.id,
                  label: epic.name ?? t('Untitled epic'),
                  color: readEpicColor(epic),
                })),
              ]}
              onChange={(value) =>
                onUpdate({ epicId: value === NONE_VALUE ? null : value })
              }
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <ProductSectionLabel>{t('Request source')}</ProductSectionLabel>
            <TaskBoardSelect
              ariaLabel={t('Request source')}
              width="100%"
              isDisabled={isReadOnly}
              value={item.requestSource ?? NONE_VALUE}
              options={[
                { value: NONE_VALUE, label: '—' },
                ...REQUEST_SOURCE_OPTIONS.map((option) => ({
                  value: option.value,
                  label: t(option.label),
                  color: option.color,
                })),
              ]}
              onChange={(value) =>
                onUpdate({ requestSource: value === NONE_VALUE ? null : value })
              }
            />
          </label>
          {item.issueType === 'BUG' && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <ProductSectionLabel>{t('Bug severity')}</ProductSectionLabel>
              <TaskBoardSelect
                ariaLabel={t('Bug severity')}
                width="100%"
                isDisabled={isReadOnly}
                value={item.bugSeverity ?? NONE_VALUE}
                options={[
                  { value: NONE_VALUE, label: '—' },
                  ...BUG_SEVERITY_OPTIONS.map((option) => ({
                    value: option.value,
                    label: t(option.label),
                    color: option.color,
                  })),
                ]}
                onChange={(value) =>
                  onUpdate({ bugSeverity: value === NONE_VALUE ? null : value })
                }
              />
            </label>
          )}
        </div>
      )}

      <ProductSectionLabel>{t('User story')}</ProductSectionLabel>
      <UserStoryEditor
        userStory={item.userStory}
        isReadOnly={isReadOnly}
        onChange={(userStory) => onUpdate({ userStory })}
      />

      <ProductSectionLabel>
        {t('Acceptance criteria ({done}/{total})', {
          done: (item.acceptanceCriteria ?? []).filter(
            (criterion) => criterion.isDone,
          ).length,
          total: item.acceptanceCriteria?.length ?? 0,
        })}
      </ProductSectionLabel>
      <AcceptanceCriteriaEditor
        criteria={item.acceptanceCriteria}
        isReadOnly={isReadOnly}
        onChange={(acceptanceCriteria) => onUpdate({ acceptanceCriteria })}
      />

      <ProductSectionLabel>
        {t('Why now · definition of success')}
      </ProductSectionLabel>
      <ProductTextArea
        ariaLabel={t('Why now')}
        value={item.whyNow ?? ''}
        isDisabled={isReadOnly}
        placeholder={t(
          'Why does this matter, and why now? Customer quotes, data…',
        )}
        onCommit={(whyNow) => onUpdate({ whyNow })}
      />
      <ProductCommitTextInput
        ariaLabel={t('Success metric')}
        value={item.successMetric ?? ''}
        isDisabled={isReadOnly}
        placeholder={t(
          'Success metric: a yes/no goal, a number to move, a behaviour to watch',
        )}
        onCommit={(successMetric) => onUpdate({ successMetric })}
      />

      <ProductSectionLabel>{t('Blocked by')}</ProductSectionLabel>
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
        }}
      >
        {blockerIds.map((blockerId) => {
          const blocker = linkedIssuesById.get(blockerId);
          const isOpen =
            blocker !== undefined &&
            blocker.stage !== 'ARCHIVED' &&
            !context.doneStatusIds.has(blocker.statusId ?? '');

          return (
            <span
              key={blockerId}
              style={{ alignItems: 'center', display: 'inline-flex', gap: 2 }}
            >
              <button
                type="button"
                onClick={() => onOpenIssue(blockerId)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <TaskChip
                  tone={isOpen ? 'danger' : 'default'}
                  icon={isOpen ? <IconLock size={11} /> : undefined}
                  title={blocker?.title ?? undefined}
                >
                  {blocker?.issueKey ?? t('Unknown issue')}
                </TaskChip>
              </button>
              {!isReadOnly && (
                <TaskIconButton
                  label={t('Remove blocker')}
                  onClick={() =>
                    onUpdate({
                      blockedByIssueIds: blockerIds.filter(
                        (candidate) => candidate !== blockerId,
                      ),
                    })
                  }
                >
                  <IconX size={12} />
                </TaskIconButton>
              )}
            </span>
          );
        })}
        {blockerIds.length === 0 && (
          <span style={PRODUCT_MUTED_STYLE}>
            {t('Nothing blocks this item.')}
          </span>
        )}
        {!isReadOnly &&
          (isAddingBlocker ? (
            <div style={{ flex: '1 1 260px' }}>
              <TaskIssueSearch
                value={blockerSearch}
                onChange={setBlockerSearch}
                onSelectIssue={(picked: BoardIssue) => {
                  setBlockerSearch('');
                  setIsAddingBlocker(false);
                  onUpdate({ blockedByIssueIds: [...blockerIds, picked.id] });
                }}
                ariaLabel={t('Blocking issue')}
                placeholder={t('Search the issue this one waits on…')}
                excludeIds={[item.id, ...blockerIds]}
                maxWidth="100%"
                size="small"
                shouldAutoFocus
                onDismiss={() => setIsAddingBlocker(false)}
              />
            </div>
          ) : (
            <TaskButton
              size="small"
              variant="ghost"
              onClick={() => setIsAddingBlocker(true)}
            >
              <IconPlus size={13} />
              {t('Add blocker')}
            </TaskButton>
          ))}
      </div>

      {isItem && (
        <>
          <div style={{ alignItems: 'center', display: 'flex', gap: 10 }}>
            <ProductSectionLabel>
              {t('Definition of Ready · {passed}/{total}', {
                passed: readiness.passedCount,
                total: readiness.totalCount,
              })}
            </ProductSectionLabel>
            <TaskProgressBar
              width={120}
              total={Math.max(1, readiness.totalCount)}
              segments={[
                {
                  value: readiness.passedCount,
                  color: readiness.isReady
                    ? readTagColor('green').text
                    : readTagColor('orange').text,
                  label: t('Ready'),
                },
              ]}
            />
          </div>
          <ReadinessChecklist
            readiness={readiness}
            isReadOnly={isReadOnly}
            onToggle={(criterionId, isMet) =>
              onUpdate({
                readinessChecks: {
                  ...(item.readinessChecks ?? {}),
                  [criterionId]: isMet,
                },
              })
            }
          />
          <ProductSectionLabel>
            {t('Priority · {template}', { template: template.name })}
          </ProductSectionLabel>
          <ProductScoreEditor
            item={item}
            template={template}
            settings={context.settings}
            isReadOnly={isReadOnly}
            onChangeInputs={(inputs) =>
              onUpdate({
                priorityScores: {
                  ...(item.priorityScores ?? {}),
                  [template.id]: inputs,
                },
              })
            }
            onChangeReasoning={(scoreReasoning) => onUpdate({ scoreReasoning })}
          />
        </>
      )}
    </section>
  );
};
