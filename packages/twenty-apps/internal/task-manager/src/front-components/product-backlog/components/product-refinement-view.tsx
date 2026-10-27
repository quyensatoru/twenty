import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import {
  IconArchive,
  IconArrowUp,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconExternalLink,
  IconArrowsSplit2,
} from 'twenty-ui/icon';

import {
  type ProductBacklogData,
  type ProductItem,
} from '../../../types/product-backlog';
import { type PageInset } from '../../../types/task-board';
import { type RefinementHorizon } from '../../../utils/product-backlog/backlog-health.util';
import { IssueTypeGlyph } from '../../components/task-board-card';
import { TaskButton } from '../../components/task-button';
import { TaskProgressBar } from '../../components/task-progress-bar';
import {
  readTagColor,
  TASK_THIN_SCROLLBAR_STYLE,
  TASK_TOKENS,
} from '../../components/task-tokens';
import { type ProductBacklogActions } from '../hooks/use-product-backlog';
import { type ProductBacklogModel } from '../hooks/use-product-backlog-model';
import {
  AcceptanceCriteriaEditor,
  ReadinessChecklist,
  StoryPointPicker,
  UserStoryEditor,
} from './product-item-editors';
import { ProductSplitDialog } from './product-split-dialog';
import {
  PRODUCT_MUTED_STYLE,
  PRODUCT_TEXT_STYLE,
  ProductCheckRow,
  ProductCommitTextInput,
  ProductEmpty,
  ProductReadinessDot,
  ProductScoreBadge,
  ProductSectionLabel,
} from './product-ui';

type ProductRefinementViewProps = {
  data: ProductBacklogData;
  model: ProductBacklogModel;
  actions: ProductBacklogActions;
  inset: PageInset;
  isMobile: boolean;
  horizon: RefinementHorizon;
  onOpenItem: (issueId: string) => void;
  reload: () => Promise<void>;
};

// One item at a time from the top of the backlog that is not ready yet: write
// the story and its criteria, estimate it, tick what is ready, move on.
export const ProductRefinementView = ({
  data,
  model,
  actions,
  inset,
  isMobile,
  horizon,
  onOpenItem,
  reload,
}: ProductRefinementViewProps) => {
  const [isWholeBacklog, setIsWholeBacklog] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [splitItem, setSplitItem] = useState<ProductItem | null>(null);
  const queue = isWholeBacklog
    ? model.backlogItems.filter((item) => !model.readinessOf(item).isReady)
    : horizon.notReadyItems;
  const currentIndex = Math.max(
    0,
    queue.findIndex((item) => item.id === currentId),
  );
  const current = queue[currentIndex];
  const readyTopCount = horizon.topItems.length - horizon.notReadyItems.length;
  const canWrite = data.canWrite;

  const goTo = (index: number) =>
    setCurrentId(
      queue[Math.min(Math.max(index, 0), queue.length - 1)]?.id ?? null,
    );

  const markReadyAndNext = (item: ProductItem) => {
    const readiness = model.readinessOf(item);
    const manualChecks = Object.fromEntries(
      readiness.checks
        .filter((check) => !check.isAutomatic)
        .map((check) => [check.id, true]),
    );
    const next =
      queue[currentIndex + 1] ??
      queue.find((candidate) => candidate.id !== item.id);

    void actions.updateItem(item.id, {
      readinessChecks: { ...(item.readinessChecks ?? {}), ...manualChecks },
      refinedAt: new Date().toISOString(),
    });
    setCurrentId(next?.id ?? null);
  };

  return (
    <div
      style={{
        display: 'flex',
        flex: 1,
        flexDirection: isMobile ? 'column' : 'row',
        gap: 16,
        minHeight: 0,
        overflow: isMobile ? 'auto' : 'hidden',
        padding: `8px ${inset.right}px 16px ${inset.left}px`,
      }}
    >
      <aside
        style={{
          display: 'flex',
          flex: isMobile ? '0 0 auto' : '0 0 280px',
          flexDirection: 'column',
          gap: 6,
          minHeight: 0,
          overflowY: 'auto',
          ...TASK_THIN_SCROLLBAR_STYLE,
        }}
      >
        <ProductSectionLabel>
          {t('To refine · {count}', { count: queue.length })}
        </ProductSectionLabel>
        <span style={PRODUCT_MUTED_STYLE}>
          {isWholeBacklog
            ? t('Every backlog item not yet ready')
            : t(
                'Top of the backlog, about 3 sprints ({points} pt), not yet ready',
                {
                  points: horizon.horizonPoints,
                },
              )}
        </span>
        {!isWholeBacklog && (
          <>
            <TaskProgressBar
              width="100%"
              height={4}
              total={Math.max(1, horizon.topItems.length)}
              segments={[
                {
                  value: readyTopCount,
                  color: readTagColor('green').text,
                  label: t('Ready'),
                },
              ]}
            />
            <span style={PRODUCT_MUTED_STYLE}>
              {t('{ready} of {total} top items ready', {
                ready: readyTopCount,
                total: horizon.topItems.length,
              })}
            </span>
          </>
        )}
        <ProductCheckRow
          label={t('Whole backlog')}
          isChecked={isWholeBacklog}
          onToggle={() => {
            setIsWholeBacklog(!isWholeBacklog);
            setCurrentId(null);
          }}
        />
        {queue.map((item) => {
          const isCurrent = item.id === current?.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrentId(item.id)}
              style={{
                ...PRODUCT_TEXT_STYLE,
                alignItems: 'center',
                background: isCurrent
                  ? TASK_TOKENS.backgroundSelected
                  : 'transparent',
                border: 'none',
                borderRadius: TASK_TOKENS.radiusSmall,
                cursor: 'pointer',
                display: 'flex',
                fontSize: 12,
                gap: 6,
                padding: '5px 6px',
                textAlign: 'left',
              }}
            >
              <ProductReadinessDot percent={model.readinessOf(item).percent} />
              <span style={{ ...PRODUCT_MUTED_STYLE, flexShrink: 0 }}>
                {item.issueKey}
              </span>
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.title ?? t('(No title)')}
              </span>
            </button>
          );
        })}
      </aside>

      <section
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          gap: 12,
          minHeight: 0,
          minWidth: 0,
          overflowY: 'auto',
          ...TASK_THIN_SCROLLBAR_STYLE,
        }}
      >
        {current === undefined ? (
          <ProductEmpty
            title={t('Nothing left to refine')}
            description={t(
              'The top of the backlog meets the Definition of Ready: it is ready for Sprint Planning.',
            )}
          />
        ) : (
          <>
            <div style={{ alignItems: 'center', display: 'flex', gap: 6 }}>
              <span style={PRODUCT_MUTED_STYLE}>
                {t('Item {index} of {total}', {
                  index: currentIndex + 1,
                  total: queue.length,
                })}
              </span>
              <span style={{ flex: 1 }} />
              <TaskButton
                size="small"
                variant="ghost"
                isDisabled={currentIndex === 0}
                onClick={() => goTo(currentIndex - 1)}
              >
                <IconChevronLeft size={14} />
                {t('Previous')}
              </TaskButton>
              <TaskButton
                size="small"
                variant="ghost"
                isDisabled={currentIndex >= queue.length - 1}
                onClick={() => goTo(currentIndex + 1)}
              >
                {t('Skip')}
                <IconChevronRight size={14} />
              </TaskButton>
            </div>
            <RefinementCard
              key={current.id}
              item={current}
              model={model}
              actions={actions}
              canWrite={canWrite}
              onOpenItem={onOpenItem}
              onReady={() => markReadyAndNext(current)}
              onSplit={() => setSplitItem(current)}
              onMoveToTop={() =>
                void actions.rankItem({
                  issueId: current.id,
                  sprintId: null,
                  beforeIssueId:
                    model.backlogItems.find((item) => item.id !== current.id)
                      ?.id ?? null,
                })
              }
              onArchive={() => {
                setCurrentId(queue[currentIndex + 1]?.id ?? null);
                void actions.setStage([current.id], 'ARCHIVED');
              }}
            />
          </>
        )}
      </section>

      {splitItem !== null && (
        <twenty-overlay>
          <ProductSplitDialog
            item={splitItem}
            onClose={() => setSplitItem(null)}
            onSplit={() => {
              setSplitItem(null);
              void reload();
            }}
          />
        </twenty-overlay>
      )}
    </div>
  );
};

type RefinementCardProps = {
  item: ProductItem;
  model: ProductBacklogModel;
  actions: ProductBacklogActions;
  canWrite: boolean;
  onOpenItem: (issueId: string) => void;
  onReady: () => void;
  onSplit: () => void;
  onMoveToTop: () => void;
  onArchive: () => void;
};

const RefinementCard = ({
  item,
  model,
  actions,
  canWrite,
  onOpenItem,
  onReady,
  onSplit,
  onMoveToTop,
  onArchive,
}: RefinementCardProps) => {
  const readiness = model.readinessOf(item);
  const unmetAutomaticChecks = readiness.checks.filter(
    (check) => check.isAutomatic && !check.isMet,
  );
  const isReadOnly = !canWrite;

  return (
    <div
      style={{
        border: `1px solid ${TASK_TOKENS.border}`,
        borderRadius: TASK_TOKENS.radius,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        padding: 16,
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
        <IssueTypeGlyph issueType={item.issueType ?? null} />
        <span style={PRODUCT_MUTED_STYLE}>{item.issueKey}</span>
        <span style={{ flex: 1 }} />
        <ProductScoreBadge
          scored={model.scoreOf(item)}
          template={model.template}
        />
        <span
          style={{
            ...PRODUCT_MUTED_STYLE,
            color: readiness.isReady
              ? readTagColor('green').text
              : readTagColor('orange').text,
            fontWeight: 600,
          }}
        >
          {t('Ready {passed}/{total}', {
            passed: readiness.passedCount,
            total: readiness.totalCount,
          })}
        </span>
        <TaskButton
          size="small"
          variant="ghost"
          onClick={() => onOpenItem(item.id)}
        >
          <IconExternalLink size={14} />
          {t('Open')}
        </TaskButton>
      </div>
      <ProductCommitTextInput
        ariaLabel={t('Title')}
        value={item.title ?? ''}
        isDisabled={isReadOnly}
        onCommit={(title) => void actions.updateItem(item.id, { title })}
      />
      <ProductSectionLabel>{t('User story')}</ProductSectionLabel>
      <UserStoryEditor
        userStory={item.userStory}
        isReadOnly={isReadOnly}
        onChange={(userStory) =>
          void actions.updateItem(item.id, { userStory })
        }
      />
      <ProductSectionLabel>
        {t('Acceptance criteria ({count})', {
          count: item.acceptanceCriteria?.length ?? 0,
        })}
      </ProductSectionLabel>
      <AcceptanceCriteriaEditor
        criteria={item.acceptanceCriteria}
        isReadOnly={isReadOnly}
        onChange={(acceptanceCriteria) =>
          void actions.updateItem(item.id, { acceptanceCriteria })
        }
      />
      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <ProductSectionLabel>
            {t('Estimate (story points)')}
          </ProductSectionLabel>
          <StoryPointPicker
            value={item.storyPoints}
            isReadOnly={isReadOnly}
            onChange={(storyPoints) =>
              void actions.updateItem(item.id, { storyPoints })
            }
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <ProductSectionLabel>{t('Definition of Ready')}</ProductSectionLabel>
          <ReadinessChecklist
            readiness={readiness}
            isReadOnly={isReadOnly}
            onToggle={(criterionId, isMet) =>
              void actions.updateItem(item.id, {
                readinessChecks: {
                  ...(item.readinessChecks ?? {}),
                  [criterionId]: isMet,
                },
              })
            }
          />
        </div>
      </div>
      {canWrite && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <TaskButton
            variant="primary"
            size="small"
            isDisabled={unmetAutomaticChecks.length > 0}
            title={unmetAutomaticChecks
              .map((check) => t(check.text))
              .join('\n')}
            onClick={onReady}
          >
            <IconCheck size={14} />
            {t('Ready, next item')}
          </TaskButton>
          <TaskButton size="small" onClick={onSplit}>
            <IconArrowsSplit2 size={14} />
            {t('Split story / make epic')}
          </TaskButton>
          <TaskButton size="small" onClick={onMoveToTop}>
            <IconArrowUp size={14} />
            {t('Move to top of backlog')}
          </TaskButton>
          <TaskButton size="small" variant="ghost" onClick={onArchive}>
            <IconArchive size={14} />
            {t('Archive (obsolete)')}
          </TaskButton>
        </div>
      )}
    </div>
  );
};
