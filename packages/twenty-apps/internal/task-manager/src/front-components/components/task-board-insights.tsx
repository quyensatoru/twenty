import { useMemo } from 'react';
import { t, useLocale } from 'twenty-sdk/front-component';

import { type PageInset } from '../../types/task-board';
import {
  buildSprintBurndown,
  sumStoryPoints,
} from '../../utils/product-backlog/backlog-metrics.util';
import {
  BurndownChart,
  VelocityChart,
} from '../product-backlog/components/product-charts';
import {
  PRODUCT_MUTED_STYLE,
  PRODUCT_TEXT_STYLE,
  type ProductTone,
  ProductBarList,
  ProductCard,
  ProductKpi,
  ProductSignalRow,
} from '../product-backlog/components/product-ui';
import { useProductBacklog } from '../product-backlog/hooks/use-product-backlog';
import { useProductBacklogModel } from '../product-backlog/hooks/use-product-backlog-model';
import { formatSprintDateRange } from '../utils/format-sprint-date-range.util';
import { TaskBacklogSkeleton } from './task-board-skeleton';
import { TaskButton } from './task-button';
import { TaskMessage } from './task-message';
import { TaskProgressBar } from './task-progress-bar';
import { readTagColor, TASK_THIN_SCROLLBAR_STYLE } from './task-tokens';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
// Committing more than this share above velocity puts carry-over at risk.
const OVERCOMMIT_RATIO = 1.15;
const REVIEW_PILE_UP_COUNT = 4;

type TaskBoardInsightsProps = {
  projectId: string;
  // Bumped by the board after a write, so the numbers follow the cards.
  refreshKey: number;
  inset: PageInset;
  isMobile: boolean;
  onPlanSprint: (() => void) | null;
};

// How the running sprint is doing: progress, burndown, velocity and the
// signals a lead would otherwise put together in a spreadsheet.
export const TaskBoardInsights = ({
  projectId,
  refreshKey,
  inset,
  isMobile,
  onPlanSprint,
}: TaskBoardInsightsProps) => {
  const locale = useLocale();
  const { data, loadError } = useProductBacklog(projectId, refreshKey);
  const model = useProductBacklogModel(data);

  const burndown = useMemo(() => {
    const sprint = model?.activeSprint;

    if (data === null || sprint === undefined) {
      return null;
    }

    return buildSprintBurndown({
      startDate: sprint.startDate ?? '',
      endDate: sprint.endDate ?? '',
      items: data.activeSprintIssues,
      committedIssueIds: sprint.committedIssueIds ?? null,
      doneAtByIssueId: data.doneAtByIssueId,
      today: new Date(),
    });
  }, [data, model]);

  if (data === null || model === null) {
    return loadError === null ? (
      <TaskBacklogSkeleton inset={inset} />
    ) : (
      <TaskMessage text={loadError} tone="danger" />
    );
  }

  const sprint = model.activeSprint;
  const padding = `16px ${inset.right}px 24px ${inset.left}px`;
  const velocity = model.averageVelocityPoints;

  if (sprint === undefined) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          overflowY: 'auto',
          padding,
        }}
      >
        <ProductCard>
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <span style={PRODUCT_TEXT_STYLE}>{t('No sprint is running.')}</span>
            {onPlanSprint !== null && (
              <TaskButton size="small" variant="ghost" onClick={onPlanSprint}>
                {t('Open Sprint Planning')}
              </TaskButton>
            )}
          </div>
        </ProductCard>
        <ProductCard title={t('Velocity')}>
          <VelocityChart velocity={data.velocity} />
        </ProductCard>
      </div>
    );
  }

  const issues = data.activeSprintIssues;
  const doneIssues = issues.filter((issue) =>
    model.doneStatusIds.has(issue.statusId ?? ''),
  );
  const committedPoints = sumStoryPoints(issues);
  const donePoints = sumStoryPoints(doneIssues);
  const remainingPoints = committedPoints - donePoints;
  const endTime = Date.parse(sprint.endDate ?? '');
  const daysLeft = Number.isNaN(endTime)
    ? null
    : Math.max(0, Math.ceil((endTime - Date.now()) / DAY_IN_MS));
  const committedIds = new Set(sprint.committedIssueIds ?? []);
  const addedIssues =
    committedIds.size === 0
      ? []
      : issues.filter((issue) => !committedIds.has(issue.id));
  const addedPoints = sumStoryPoints(addedIssues);
  const startOfToday = new Date();

  startOfToday.setHours(0, 0, 0, 0);

  const overdueIssues = issues.filter(
    (issue) =>
      typeof issue.dueDate === 'string' &&
      !model.doneStatusIds.has(issue.statusId ?? '') &&
      Date.parse(issue.dueDate) < startOfToday.getTime(),
  );
  const reviewingCount = issues.filter((issue) =>
    (model.statusesById.get(issue.statusId ?? '')?.name ?? '')
      .toUpperCase()
      .includes('REVIEW'),
  ).length;

  const signals: { tone: ProductTone; text: string }[] = [];

  if (velocity > 0 && committedPoints > velocity * OVERCOMMIT_RATIO) {
    signals.push({
      tone: 'danger',
      text: t(
        '{name} commits {committed} pt, above the average velocity of {velocity} pt: carry-over is likely.',
        {
          name: sprint.name ?? '',
          committed: committedPoints,
          velocity,
        },
      ),
    });
  }

  if (reviewingCount > REVIEW_PILE_UP_COUNT) {
    signals.push({
      tone: 'warning',
      text: t('{count} issues waiting in review: consider a WIP limit.', {
        count: reviewingCount,
      }),
    });
  }

  if (overdueIssues.length > 0) {
    signals.push({
      tone: 'warning',
      text: t('{count} issues overdue: {keys}.', {
        count: overdueIssues.length,
        keys: overdueIssues.map((issue) => issue.issueKey ?? '').join(', '),
      }),
    });
  }

  if (daysLeft !== null && daysLeft > 0 && velocity > 0) {
    const neededPerDay = remainingPoints / daysLeft;
    const usualPerDay = velocity / 10;

    if (neededPerDay > usualPerDay * 1.5) {
      signals.push({
        tone: 'warning',
        text: t(
          '{remaining} pt left in {days} days: about {perDay} pt a day, faster than the usual pace.',
          {
            remaining: remainingPoints,
            days: daysLeft,
            perDay: Math.ceil(neededPerDay),
          },
        ),
      });
    }
  }

  if (addedPoints > 0) {
    signals.push({
      tone: 'warning',
      text: t('Scope grew by {points} pt after the sprint started.', {
        points: addedPoints,
      }),
    });
  }

  const statuses = [...data.issueStatuses].sort(
    (left, right) => (left.position ?? 0) - (right.position ?? 0),
  );

  return (
    <div
      style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        gap: 16,
        minHeight: 0,
        overflowY: 'auto',
        padding,
        ...TASK_THIN_SCROLLBAR_STYLE,
      }}
    >
      <div
        style={{
          alignItems: 'baseline',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <span style={{ ...PRODUCT_TEXT_STYLE, fontSize: 16, fontWeight: 600 }}>
          {sprint.name}
        </span>
        <span style={PRODUCT_MUTED_STYLE}>
          {formatSprintDateRange({
            startDate: sprint.startDate,
            endDate: sprint.endDate,
            locale,
          })}
          {typeof sprint.goal === 'string' && sprint.goal !== ''
            ? ` · ${sprint.goal}`
            : ''}
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <ProductKpi
          label={t('Progress')}
          value={`${donePoints} / ${committedPoints} pt`}
          note={t('{done} of {total} issues done', {
            done: doneIssues.length,
            total: issues.length,
          })}
        />
        <ProductKpi
          label={t('Days left')}
          value={daysLeft ?? '–'}
          note={t('{points} pt not done', { points: remainingPoints })}
        />
        <ProductKpi
          label={t('Average velocity (3 sprints)')}
          value={`${velocity} pt`}
          note={t('This sprint commits {points} pt', {
            points: committedPoints,
          })}
          tone={
            velocity > 0 && committedPoints > velocity * OVERCOMMIT_RATIO
              ? 'danger'
              : undefined
          }
        />
        <ProductKpi
          label={t('Scope change')}
          value={`+${addedPoints} pt`}
          note={t('{count} issues added after start', {
            count: addedIssues.length,
          })}
        />
        <ProductKpi
          label={t('Overdue')}
          value={overdueIssues.length}
          note={t('of {count} issues', { count: issues.length })}
        />
      </div>
      <TaskProgressBar
        width="100%"
        height={6}
        total={Math.max(1, committedPoints)}
        segments={[
          {
            value: donePoints,
            color: readTagColor('green').text,
            label: t('Done'),
          },
        ]}
      />
      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
        }}
      >
        <ProductCard title={t('Burndown')}>
          <BurndownChart rows={burndown?.rows ?? []} />
        </ProductCard>
        <ProductCard title={t('Velocity')}>
          <VelocityChart velocity={data.velocity} />
        </ProductCard>
        <ProductCard title={t('Issues by status')}>
          <ProductBarList
            rows={statuses.map((status) => {
              const inStatus = issues.filter(
                (issue) => issue.statusId === status.id,
              );

              return {
                label: status.name ?? '',
                value: inStatus.length,
                color: readTagColor(status.color).text,
                note: `· ${sumStoryPoints(inStatus)} pt`,
              };
            })}
          />
        </ProductCard>
        <ProductCard title={t('Delivery signals')}>
          {signals.length === 0 ? (
            <ProductSignalRow tone="good" text={t('The sprint is on pace.')} />
          ) : (
            signals.map((signal) => (
              <ProductSignalRow
                key={signal.text}
                tone={signal.tone}
                text={signal.text}
              />
            ))
          )}
        </ProductCard>
      </div>
    </div>
  );
};
