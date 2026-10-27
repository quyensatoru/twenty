import { t } from 'twenty-sdk/front-component';
import { IconCheck, IconInfoCircle } from 'twenty-ui/icon';

import {
  BUG_SEVERITY_OPTIONS,
  STALE_ITEM_MONTHS,
} from '../../../constants/product-backlog';
import { readEpicColor } from '../../../utils/epic-color.util';
import { type BacklogHealthFilterId } from '../../../utils/product-backlog/backlog-health.util';
import { sumStoryPoints } from '../../../utils/product-backlog/backlog-metrics.util';
import { computeBacklogDeep } from '../../../utils/product-backlog/item-readiness.util';
import { rankItemsByTemplate } from '../../../utils/product-backlog/prioritization-templates.util';
import { TaskButton } from '../../components/task-button';
import { TaskProgressBar } from '../../components/task-progress-bar';
import {
  readTagColor,
  TASK_THIN_SCROLLBAR_STYLE,
  TASK_TOKENS,
} from '../../components/task-tokens';
import { useBacklogHealth } from '../hooks/use-backlog-health';
import { type ProductViewProps } from '../types/product-view-props';
import {
  PRODUCT_MUTED_STYLE,
  PRODUCT_TEXT_STYLE,
  PRODUCT_TONE_COLOR,
  type ProductTone,
  ProductBarList,
  ProductCard,
  ProductKpi,
  ProductSignalRow,
} from './product-ui';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const READY_TOP_TARGET = 0.6;
const REVIEW_DUE_DAYS = 7;

const readDeepTone = (value: number): ProductTone =>
  value >= 0.7 ? 'good' : value >= 0.4 ? 'warning' : 'danger';

type ProductInsightsViewProps = ProductViewProps & {
  onShowHealthFilter: (filterId: BacklogHealthFilterId) => void;
};

// Backlog health for the team and for whoever it reports to: every warning
// opens the items behind it, so the numbers are never a dead end.
export const ProductInsightsView = ({
  data,
  model,
  actions,
  inset,
  isMobile,
  onShowHealthFilter,
}: ProductInsightsViewProps) => {
  const { horizon, filters } = useBacklogHealth(data, model);
  const backlog = model.backlogItems;
  const velocity = model.averageVelocityPoints;
  const countOf = (filterId: BacklogHealthFilterId) =>
    backlog.filter((item) => filters[filterId].test(item)).length;
  const topReadyCount = horizon.topItems.length - horizon.notReadyItems.length;
  const topReadyShare = topReadyCount / Math.max(1, horizon.topItems.length);
  const unscoredCount = countOf('unscored');
  const noGoalCount = countOf('no-goal');
  const noWhyCount = countOf('no-why');
  const lowTierCount = countOf('low-tier');
  const staleCount = countOf('stale');
  const backlogPoints = sumStoryPoints(backlog);
  const deep = computeBacklogDeep({
    orderedItems: backlog,
    isScored: (item) => model.scoreOf(item).score !== null,
    now: new Date(),
  });
  const reviewedDaysAgo =
    data.settings.lastBacklogReviewAt === null
      ? null
      : Math.floor(
          (Date.now() - Date.parse(data.settings.lastBacklogReviewAt)) /
            DAY_IN_MS,
        );
  const share = (count: number) => count / Math.max(1, backlog.length);

  const signals: {
    tone: ProductTone;
    text: string;
    filterId: BacklogHealthFilterId;
    count: number;
  }[] = [];

  if (horizon.topItems.length > 0 && topReadyShare < READY_TOP_TARGET) {
    signals.push({
      tone: 'warning',
      text: t(
        'Only {ready} of {total} top backlog items meet the Definition of Ready: refine before planning.',
        {
          ready: topReadyCount,
          total: horizon.topItems.length,
        },
      ),
      filterId: 'not-ready-top',
      count: horizon.notReadyItems.length,
    });
  }

  if (unscoredCount > 0) {
    signals.push({
      tone: 'warning',
      text: t(
        '{count} items not scored with {template}: the backlog cannot be ordered on evidence.',
        {
          count: unscoredCount,
          template: model.template.name,
        },
      ),
      filterId: 'unscored',
      count: unscoredCount,
    });
  }

  if (share(noGoalCount) > 0.3) {
    signals.push({
      tone: 'warning',
      text: t(
        '{count} items serve no strategic goal: a sign of a dumping ground.',
        { count: noGoalCount },
      ),
      filterId: 'no-goal',
      count: noGoalCount,
    });
  }

  if (share(noWhyCount) > 0.5) {
    signals.push({
      tone: 'warning',
      text: t(
        '{count} items have no "why now": hard to explain why they are in the backlog.',
        {
          count: noWhyCount,
        },
      ),
      filterId: 'no-why',
      count: noWhyCount,
    });
  }

  if (share(lowTierCount) > 0.4) {
    signals.push({
      tone: 'warning',
      text: t(
        '{count} items sit in a low priority tier: consider archiving to keep the backlog lean.',
        {
          count: lowTierCount,
        },
      ),
      filterId: 'low-tier',
      count: lowTierCount,
    });
  }

  if (staleCount > 0) {
    signals.push({
      tone: 'warning',
      text: t(
        '{count} items untouched for over {months} months: consider archiving.',
        {
          count: staleCount,
          months: STALE_ITEM_MONTHS,
        },
      ),
      filterId: 'stale',
      count: staleCount,
    });
  }

  const ranked = rankItemsByTemplate(backlog, model.template, data.settings);
  const classifications = [
    ...new Map(
      ranked
        .filter((row) => row.classification !== null)
        .map((row) => [row.classification?.label ?? '', row.classification]),
    ).values(),
  ]
    .filter((classification) => classification !== null)
    .sort((left, right) => (left?.order ?? 0) - (right?.order ?? 0));
  const openBugs = [...data.items, ...data.activeSprintIssues].filter(
    (item) =>
      item.issueType === 'BUG' && !model.doneStatusIds.has(item.statusId ?? ''),
  );

  return (
    <div
      style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        gap: 14,
        minHeight: 0,
        overflowY: 'auto',
        padding: `12px ${inset.right}px 24px ${inset.left}px`,
        ...TASK_THIN_SCROLLBAR_STYLE,
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <ProductKpi
          label={t('Backlog')}
          value={t('{count} items', { count: backlog.length })}
          note={
            velocity > 0
              ? t('{points} pt ≈ {sprints} sprints (velocity {velocity} pt)', {
                  points: backlogPoints,
                  sprints: (backlogPoints / velocity).toFixed(1),
                  velocity,
                })
              : t('{points} pt', { points: backlogPoints })
          }
        />
        <ProductKpi
          label={t('Top 3 sprints ready')}
          value={`${topReadyCount}/${horizon.topItems.length}`}
          note={`${Math.round(topReadyShare * 100)}%`}
          tone={topReadyShare >= READY_TOP_TARGET ? 'good' : 'warning'}
          onClick={() => onShowHealthFilter('not-ready-top')}
        />
        <ProductKpi
          label={t('Not estimated')}
          value={countOf('unestimated')}
          note={
            countOf('oversized') > 0
              ? t('{count} items too big to fit a sprint', {
                  count: countOf('oversized'),
                })
              : t('No oversized items')
          }
          tone={countOf('oversized') > 0 ? 'warning' : 'good'}
          onClick={() =>
            onShowHealthFilter(
              countOf('unestimated') > 0 ? 'unestimated' : 'oversized',
            )
          }
        />
        <ProductKpi
          label={t('Blocked')}
          value={countOf('blocked')}
          note={t('waiting on a dependency')}
          tone={countOf('blocked') > 0 ? 'warning' : 'good'}
          onClick={() => onShowHealthFilter('blocked')}
        />
      </div>

      <ProductCard
        title={t('Backlog health')}
        trailing={
          <span
            style={{
              alignItems: 'center',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <span
              style={{
                ...PRODUCT_MUTED_STYLE,
                color:
                  reviewedDaysAgo !== null && reviewedDaysAgo <= REVIEW_DUE_DAYS
                    ? TASK_TOKENS.textTertiary
                    : PRODUCT_TONE_COLOR.warning,
              }}
            >
              {reviewedDaysAgo === null
                ? t('Never reviewed')
                : reviewedDaysAgo === 0
                  ? t('Reviewed today')
                  : t('Reviewed {days} days ago', { days: reviewedDaysAgo })}
            </span>
            {data.canWrite && (
              <TaskButton
                size="small"
                variant="ghost"
                onClick={() =>
                  void actions.updateSettings({
                    lastBacklogReviewAt: new Date().toISOString(),
                  })
                }
              >
                <IconCheck size={13} />
                {t('Mark as reviewed')}
              </TaskButton>
            )}
            <span style={PRODUCT_MUTED_STYLE}>DEEP</span>
            <strong
              style={{
                ...PRODUCT_TEXT_STYLE,
                color: PRODUCT_TONE_COLOR[readDeepTone(deep.overall)],
              }}
            >
              {Math.round(deep.overall * 100)}%
            </strong>
          </span>
        }
      >
        <div
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: isMobile
              ? '1fr'
              : 'minmax(0, 1.4fr) minmax(0, 1fr)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {signals.length === 0 ? (
              <ProductSignalRow
                tone="good"
                text={t(
                  'The backlog is healthy: lean, prioritised, and its top is ready.',
                )}
              />
            ) : (
              signals.map((signal) => (
                <ProductSignalRow
                  key={signal.filterId}
                  tone={signal.tone}
                  text={signal.text}
                  action={
                    <TaskButton
                      size="small"
                      variant="ghost"
                      onClick={() => onShowHealthFilter(signal.filterId)}
                    >
                      {t('See {count} items →', { count: signal.count })}
                    </TaskButton>
                  }
                />
              ))
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {deep.parts.map((part) => (
              <div
                key={part.key}
                style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
              >
                <div style={{ ...PRODUCT_TEXT_STYLE, display: 'flex' }}>
                  <strong style={{ flex: 1 }}>{t(part.name)}</strong>
                  <span>{Math.round(part.value * 100)}%</span>
                </div>
                <TaskProgressBar
                  width="100%"
                  height={6}
                  total={100}
                  segments={[
                    {
                      value: Math.round(part.value * 100),
                      color: PRODUCT_TONE_COLOR[readDeepTone(part.value)],
                      label: t(part.name),
                    },
                  ]}
                />
                <span style={PRODUCT_MUTED_STYLE}>{t(part.hint)}</span>
              </div>
            ))}
          </div>
        </div>
      </ProductCard>

      <div
        style={{
          display: 'grid',
          gap: 14,
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
        }}
      >
        <ProductCard title={t('Story points by epic')}>
          <ProductBarList
            rows={[
              ...data.epics.map((epic) => ({
                label: epic.name ?? t('Untitled epic'),
                value: sumStoryPoints(
                  backlog.filter((item) => item.epicId === epic.id),
                ),
                color: readTagColor(readEpicColor(epic)).text,
                note: 'pt',
              })),
              {
                label: t('No epic'),
                value: sumStoryPoints(
                  backlog.filter((item) => typeof item.epicId !== 'string'),
                ),
                color: TASK_TOKENS.textLight,
                note: 'pt',
              },
            ]}
          />
        </ProductCard>
        <ProductCard title={t('Items by strategic goal')}>
          <ProductBarList
            rows={[
              ...data.settings.goals.map((goal) => ({
                label: goal.name,
                value: backlog.filter(
                  (item) => item.strategicGoalId === goal.id,
                ).length,
                color: readTagColor(goal.color).text,
              })),
              {
                label: t('No goal'),
                value: noGoalCount,
                color: TASK_TOKENS.textLight,
              },
            ]}
          />
        </ProductCard>
        <ProductCard title={t('Open bugs by severity')}>
          <ProductBarList
            rows={[
              ...BUG_SEVERITY_OPTIONS.map((option) => ({
                label: t(option.label),
                value: openBugs.filter(
                  (bug) => bug.bugSeverity === option.value,
                ).length,
                color: readTagColor(option.color).text,
              })),
              {
                label: t('Not rated'),
                value: openBugs.filter(
                  (bug) => typeof bug.bugSeverity !== 'string',
                ).length,
                color: TASK_TOKENS.textLight,
              },
            ]}
          />
          <span
            style={{
              ...PRODUCT_MUTED_STYLE,
              alignItems: 'center',
              display: 'flex',
              gap: 4,
            }}
          >
            <IconInfoCircle size={13} />
            {t(
              'Critical is fixed now, not queued; less critical may never be fixed.',
            )}
          </span>
        </ProductCard>
        <ProductCard
          title={t('By {template}', { template: model.template.name })}
        >
          <ProductBarList
            rows={[
              ...classifications.map((classification) => ({
                label: t(classification?.label ?? ''),
                value: ranked.filter(
                  (row) => row.classification?.label === classification?.label,
                ).length,
                color: readTagColor(classification?.color ?? 'gray').text,
              })),
              ...(unscoredCount > 0
                ? [
                    {
                      label: t('Not scored'),
                      value: unscoredCount,
                      color: TASK_TOKENS.textLight,
                    },
                  ]
                : []),
            ]}
          />
        </ProductCard>
      </div>
    </div>
  );
};
