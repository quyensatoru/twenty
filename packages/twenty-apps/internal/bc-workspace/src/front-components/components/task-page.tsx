import { useRef, useState } from 'react';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';
import { IconCheckbox, IconPlus } from 'twenty-ui/icon';
import { Banner } from 'twenty-ui/primitives/feedback';
import { Button } from 'twenty-ui/primitives/input';

import { TASK_SAVE_ROUTE_PATH } from '../../constants/route-paths';
import { type TaskStatus } from '../../types/bc-records';
import {
  type TaskDetailResult,
  type TaskKpiFilter,
  type TaskListRow,
} from '../../types/tasks';
import { type SortState } from '../../utils/sort-records.util';
import { useBcContext } from '../hooks/use-bc-context';
import { useIsMobile } from '../hooks/use-is-mobile';
import { useTaskList } from '../hooks/use-task-list';
import { postAppRoute, readErrorText } from '../utils/post-app-route.util';
import {
  buildTaskListRequest,
  DEFAULT_TASK_FILTERS,
  type TaskFilterState,
} from '../utils/task-filters.util';
import { BcKpiCard, BcKpiGrid } from './bc-kpi-card';
import { BcPageHeader, EmptyState, NoBcAccess, readScopeLabel } from './bc-page';
import { TablePagination } from './bc-table';
import { BcThemeRoot } from './bc-theme-root';
import { BC_TOKENS, spacing, THIN_SCROLLBAR_STYLE } from './bc-theme';
import { ClientDetailPanel } from './client-detail-panel';
import { TaskDetailPanel } from './task-detail-panel';
import { TaskFilters } from './task-filters';
import { TaskFormPanel } from './task-form-panel';
import { TaskTable } from './task-table';

type PanelState =
  | { kind: 'task'; taskId: string }
  | { kind: 'create' }
  | { kind: 'client'; vipClientId: string; returnTaskId: string | null }
  | null;

const SEARCH_DEBOUNCE_MS = 300;

export const TaskPage = () => {
  const isMobile = useIsMobile();
  const { context, error: contextError } = useBcContext();
  const [filters, setFilters] = useState<TaskFilterState>(DEFAULT_TASK_FILTERS);
  const [appliedSearch, setAppliedSearch] = useState('');
  const [sort, setSort] = useState<SortState>(null);
  const [page, setPage] = useState(1);
  const [panel, setPanel] = useState<PanelState>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const timeZone = context?.settings.reportingTimezone ?? 'UTC';
  const request =
    context === null || context.scope.role === 'NONE'
      ? null
      : buildTaskListRequest({
          filters: { ...filters, search: appliedSearch },
          sort,
          page,
          timeZone,
          nowMs: Date.now(),
        });
  const { data, isLoading, error, reload, patchRow } = useTaskList(request);

  const changeFilters = (next: TaskFilterState) => {
    setFilters(next);

    if (next.search !== filters.search) {
      if (searchTimer.current !== null) {
        clearTimeout(searchTimer.current);
      }

      searchTimer.current = setTimeout(() => {
        setAppliedSearch(next.search);
        setPage(1);
      }, SEARCH_DEBOUNCE_MS);

      return;
    }

    setPage(1);
  };

  // A KPI card filters the table by what it counts; clicking it again shows
  // every task. It replaces the status filter, which would contradict it.
  const selectKpi = (kpi: TaskKpiFilter) => {
    setFilters({
      ...filters,
      kpi: filters.kpi === kpi ? null : kpi,
      status: null,
    });
    setPage(1);
  };

  const changeStatus = async (row: TaskListRow, status: TaskStatus) => {
    setSavingId(row.id);

    try {
      const result = await postAppRoute<TaskDetailResult & { success: true }>(
        TASK_SAVE_ROUTE_PATH,
        { taskId: row.id, status },
      );

      patchRow({
        id: row.id,
        status: result.task.status,
        completedAt: result.task.completedAt,
      });

      if (status === 'COMPLETED' && row.category === 'CLIENT_ISSUE') {
        void enqueueSnackbar({
          message: t(
            'Completing this task does not resolve the issue. Confirm the resolution from the client profile.',
          ),
          variant: 'info',
        });
      }

      void reload();
    } catch (saveError) {
      void enqueueSnackbar({ message: readErrorText(saveError), variant: 'error' });
    } finally {
      setSavingId(null);
    }
  };

  const panelWidth = isMobile ? '100%' : 440;
  const canFilterOwner =
    context !== null && (context.scope.role === 'ADMIN' || context.scope.role === 'MANAGER');
  const selectedTaskId = panel?.kind === 'task' ? panel.taskId : null;

  const panelContent =
    panel === null || context === null ? null : panel.kind === 'create' ? (
      <TaskFormPanel
        width={panelWidth}
        onClose={() => setPanel(null)}
        onCreated={(task) => {
          setPanel({ kind: 'task', taskId: task.id });
          void reload();
        }}
      />
    ) : panel.kind === 'task' ? (
      <TaskDetailPanel
        key={panel.taskId}
        taskId={panel.taskId}
        timeZone={timeZone}
        width={panelWidth}
        onClose={() => setPanel(null)}
        onSaved={() => void reload()}
        onOpenClient={(vipClientId) =>
          setPanel({ kind: 'client', vipClientId, returnTaskId: panel.taskId })
        }
      />
    ) : (
      <ClientDetailPanel
        key={panel.vipClientId}
        vipClientId={panel.vipClientId}
        context={context}
        width={isMobile ? '100%' : 520}
        onClose={() =>
          setPanel(
            panel.returnTaskId === null ? null : { kind: 'task', taskId: panel.returnTaskId },
          )
        }
        onChanged={() => void reload()}
      />
    );

  const kpis = data?.kpis ?? null;
  const kpiCards: {
    kpi: TaskKpiFilter;
    label: string;
    value: number | undefined;
    caption: string;
    tone: 'positive' | 'negative' | 'neutral';
  }[] = [
    {
      kpi: 'OPEN',
      label: t('Open tasks'),
      value: kpis?.open,
      caption: t('To Do and In Progress now'),
      tone: 'neutral',
    },
    {
      kpi: 'AUTOMATIC',
      label: t('Automatic tasks'),
      value: kpis?.automatic,
      caption: t('Created by issue, usage and lifecycle events'),
      tone: 'neutral',
    },
    {
      kpi: 'COMPLETED',
      label: t('Completed'),
      value: kpis?.completed,
      caption: t('In the selected created-date range'),
      tone: 'positive',
    },
    {
      kpi: 'HIGH_OPEN',
      label: t('High priority'),
      value: kpis?.highPriorityOpen,
      caption: t('Open tasks marked High'),
      tone: kpis !== null && kpis.highPriorityOpen > 0 ? 'negative' : 'neutral',
    },
  ];

  const list = (
    <div
      style={{
        background: BC_TOKENS.background,
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        minHeight: 0,
        minWidth: 0,
      }}
    >
      <BcPageHeader
        icon={<IconCheckbox size={16} />}
        title={t('BC Tasks')}
        scopeLabel={readScopeLabel(context)}
        isMobile={isMobile}
        actions={
          context !== null && context.scope.role !== 'NONE' ? (
            <Button
              variant="solid"
              color="accent"
              size="sm"
              startIcon={<IconPlus size={14} />}
              onClick={() => setPanel({ kind: 'create' })}
            >
              {t('New task')}
            </Button>
          ) : undefined
        }
      />
      {contextError !== null ? (
        <div style={{ padding: spacing(4) }}>
          <Banner color="danger" variant="secondary">{contextError}</Banner>
        </div>
      ) : context !== null && context.scope.role === 'NONE' ? (
        <NoBcAccess />
      ) : (
        <>
          <div style={{ flexShrink: 0, padding: `${spacing(3)} ${isMobile ? spacing(3) : spacing(4)}` }}>
            <BcKpiGrid minWidth={180}>
              {kpiCards.map((card) => (
                <BcKpiCard
                  key={card.kpi}
                  label={card.label}
                  value={card.value ?? '—'}
                  caption={card.caption}
                  tone={card.tone}
                  isSelected={filters.kpi === card.kpi}
                  actionLabel={filters.kpi === card.kpi ? t('Showing') : t('Show')}
                  onClick={() => selectKpi(card.kpi)}
                />
              ))}
            </BcKpiGrid>
          </div>
          <TaskFilters
            filters={filters}
            onChange={changeFilters}
            members={context?.members ?? []}
            canFilterOwner={canFilterOwner}
            isMobile={isMobile}
          />
          {error !== null && data !== null && (
            <div style={{ flexShrink: 0, padding: `${spacing(2)} ${spacing(4)}` }}>
              <Banner color="danger" variant="secondary">{error}</Banner>
            </div>
          )}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              opacity: isLoading && data !== null ? 0.6 : 1,
              overflow: 'auto',
              transition: 'opacity 150ms ease-in-out',
              ...THIN_SCROLLBAR_STYLE,
            }}
          >
            {data === null ? (
              error !== null ? (
                <div style={{ padding: spacing(4) }}>
                  <Banner color="danger" variant="secondary">{error}</Banner>
                </div>
              ) : (
                <EmptyState>{t('Loading tasks…')}</EmptyState>
              )
            ) : data.rows.length === 0 ? (
              <EmptyState>
                {data.scopeTotal === 0
                  ? t('No tasks yet. Create one, or wait for issue, usage and lifecycle events to add them.')
                  : t('No task matches these filters.')}
              </EmptyState>
            ) : (
              <TaskTable
                rows={data.rows}
                sort={sort}
                selectedId={selectedTaskId}
                savingId={savingId}
                isMobile={isMobile}
                timeZone={timeZone}
                onSortChange={(nextSort) => {
                  setSort(nextSort);
                  setPage(1);
                }}
                onSelect={(taskId) =>
                  setPanel(selectedTaskId === taskId ? null : { kind: 'task', taskId })
                }
                onStatusChange={(row, status) => void changeStatus(row, status)}
              />
            )}
          </div>
          {data !== null && (
            <TablePagination
              page={data.page}
              pageCount={data.pageCount}
              total={data.total}
              summary={[
                t('Showing {shown} of {total} tasks · Filtered by created date, no deadlines', {
                  shown: data.rows.length,
                  total: data.total,
                }),
                context?.scope.role === 'MANAGER'
                  ? t('Only your tasks are editable')
                  : null,
              ]
                .filter((part) => part !== null)
                .join(' · ')}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );

  return (
    <BcThemeRoot>
      <div
        style={{
          background: BC_TOKENS.background,
          boxSizing: 'border-box',
          display: 'flex',
          height: '100%',
          minHeight: 0,
          width: '100%',
        }}
      >
        {!(isMobile && panelContent !== null) && list}
        {panelContent}
      </div>
    </BcThemeRoot>
  );
};
