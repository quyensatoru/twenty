import { useState } from 'react';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';
import {
  IconAlertTriangle,
  IconLayoutDashboard,
  IconMessage,
  IconPlus,
  IconSettings,
  IconUsers,
} from 'twenty-ui/icon';
import { Banner } from 'twenty-ui/primitives/feedback';
import { Button } from 'twenty-ui/primitives/input';

import { CLIENT_SAVE_ROUTE_PATH } from '../../constants/route-paths';
import { type BcContextResult } from '../../types/bc-context';
import {
  type ClientListFilters,
  type DashboardKpi,
} from '../../types/dashboard';
import { type SortState } from '../../utils/sort-records.util';
import { useBcContext } from '../hooks/use-bc-context';
import { useDashboardClients } from '../hooks/use-dashboard-clients';
import { useIsMobile } from '../hooks/use-is-mobile';
import { postAppRoute, readErrorText } from '../utils/post-app-route.util';
import { BcKpiCard } from './bc-kpi-card';
import { BcPageHeader, EmptyState, NoBcAccess, readScopeLabel } from './bc-page';
import { BcSettingsPanel } from './bc-settings-panel';
import { TablePagination } from './bc-table';
import { BcThemeRoot } from './bc-theme-root';
import { BC_TOKENS, spacing, THIN_SCROLLBAR_STYLE } from './bc-theme';
import { ClientDetailPanel } from './client-detail-panel';
import { DashboardAddClientPanel } from './dashboard-add-client-panel';
import { DashboardClientTable } from './dashboard-client-table';
import { EMPTY_CLIENT_FILTERS, DashboardToolbar, hasActiveClientFilters } from './dashboard-toolbar';

const PAGE_SIZE = 25;

type SidePanel = { kind: 'DETAIL'; vipClientId: string } | { kind: 'ADD' } | { kind: 'SETTINGS' } | null;

const TableSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    {Array.from({ length: 8 }, (_, index) => (
      <div
        key={index}
        style={{
          alignItems: 'center',
          borderBottom: `1px solid ${BC_TOKENS.borderLight}`,
          display: 'flex',
          gap: spacing(4),
          height: 52,
          padding: `0 ${spacing(4)}`,
        }}
      >
        {[200, 60, 80, 90, 120, 90, 80].map((width, cellIndex) => (
          <span
            key={cellIndex}
            style={{ background: BC_TOKENS.backgroundTertiary, borderRadius: BC_TOKENS.radiusSmall, height: 12, width }}
          />
        ))}
      </div>
    ))}
  </div>
);

const DashboardBody = ({ context, reloadContext }: { context: BcContextResult; reloadContext: () => void }) => {
  const isMobile = useIsMobile();
  const [filters, setFilters] = useState<ClientListFilters>(EMPTY_CLIENT_FILTERS);
  const [sort, setSort] = useState<SortState>(null);
  const [page, setPage] = useState(1);
  const [panel, setPanel] = useState<SidePanel>(null);
  const { data, isLoading, error, reload } = useDashboardClients({
    ...filters,
    sort,
    page,
    pageSize: PAGE_SIZE,
  });
  const scope = context.scope;
  const canAddClients = scope.role === 'ADMIN' || scope.role === 'MANAGER';
  const selectedId = panel?.kind === 'DETAIL' ? panel.vipClientId : null;

  const changeFilters = (next: ClientListFilters) => {
    setFilters(next);
    setPage(1);
  };

  const toggleKpi = (kpi: DashboardKpi) =>
    changeFilters({ ...filters, status: null, kpi: filters.kpi === kpi ? 'ALL' : kpi });

  const reassign = async (vipClientId: string, picId: string | null) => {
    try {
      await postAppRoute(CLIENT_SAVE_ROUTE_PATH, { vipClientId, picId });
      void enqueueSnackbar({ message: t('PIC updated'), variant: 'success' });
      void reload();
    } catch (saveError) {
      void enqueueSnackbar({ message: readErrorText(saveError), variant: 'error' });
    }
  };

  const kpis = data?.kpis ?? null;
  const panelWidth = isMobile ? '100%' : 480;

  const list = (
    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0, minWidth: 0 }}>
      <BcPageHeader
        icon={<IconLayoutDashboard size={16} />}
        title={t('BC Dashboard')}
        scopeLabel={readScopeLabel(context)}
        isMobile={isMobile}
        actions={
          <>
            {scope.canManageSettings && (
              <Button
                variant="ghost"
                color="neutral"
                size="sm"
                startIcon={<IconSettings size={14} />}
                onClick={() => setPanel({ kind: 'SETTINGS' })}
              >
                {t('Settings')}
              </Button>
            )}
            {canAddClients && (
              <Button
                variant="solid"
                color="accent"
                size="sm"
                startIcon={<IconPlus size={14} />}
                onClick={() => setPanel({ kind: 'ADD' })}
              >
                {t('Add VIP client')}
              </Button>
            )}
          </>
        }
      />
      <div
        style={{
          display: 'grid',
          flexShrink: 0,
          gap: spacing(2),
          // Four across when there is room, two when a side panel narrows the page.
          gridTemplateColumns: isMobile
            ? 'repeat(2, minmax(0, 1fr))'
            : 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
          padding: `${spacing(3)} ${isMobile ? spacing(3) : spacing(4)}`,
        }}
      >
        <BcKpiCard
          label={t('Total VIP clients')}
          icon={<IconUsers size={14} />}
          value={kpis?.total ?? '—'}
          caption={t('Across all products')}
          actionLabel={t('Show all')}
          isSelected={filters.kpi === 'ALL' && hasActiveClientFilters(filters) === false}
          onClick={() => changeFilters({ ...filters, status: null, kpi: 'ALL' })}
        />
        <BcKpiCard
          label={t('Active clients')}
          value={kpis?.active ?? '—'}
          caption={t('Healthy relationships')}
          actionLabel={t('Filter')}
          tone="positive"
          isSelected={filters.kpi === 'ACTIVE'}
          onClick={() => toggleKpi('ACTIVE')}
        />
        <BcKpiCard
          label={t('Need follow-up')}
          icon={<IconMessage size={14} />}
          value={kpis?.needFollowUp ?? '—'}
          caption={t('Follow-up and waiting for client')}
          actionLabel={t('Filter')}
          tone={kpis !== null && kpis.needFollowUp > 0 ? 'negative' : 'neutral'}
          isSelected={filters.kpi === 'NEED_FOLLOW_UP'}
          onClick={() => toggleKpi('NEED_FOLLOW_UP')}
        />
        <BcKpiCard
          label={t('At risk')}
          icon={<IconAlertTriangle size={14} />}
          value={kpis?.atRisk ?? '—'}
          caption={t('Prioritize these clients')}
          actionLabel={t('Filter')}
          tone={kpis !== null && kpis.atRisk > 0 ? 'negative' : 'neutral'}
          isSelected={filters.kpi === 'AT_RISK'}
          onClick={() => toggleKpi('AT_RISK')}
        />
      </div>
      <DashboardToolbar
        filters={filters}
        onChange={changeFilters}
        context={context}
        planOptions={data?.planOptions ?? []}
        isMobile={isMobile}
        actions={null}
      />
      {error !== null && (
        <div style={{ padding: `${spacing(2)} ${spacing(4)}` }}>
          <Banner color="danger" variant="secondary">
            {error}
          </Banner>
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
          isLoading ? <TableSkeleton /> : null
        ) : data.rows.length === 0 ? (
          <EmptyState>
            {data.kpis.total === 0
              ? canAddClients
                ? t('No VIP client yet. Add one from a shop that installed one of our apps.')
                : t('No VIP client is assigned to you yet.')
              : t('No client matches these filters.')}
          </EmptyState>
        ) : (
          <DashboardClientTable
            rows={data.rows}
            sort={sort}
            onSortChange={(next) => {
              setSort(next);
              setPage(1);
            }}
            selectedId={selectedId}
            onSelect={(vipClientId) =>
              setPanel(selectedId === vipClientId ? null : { kind: 'DETAIL', vipClientId })
            }
            members={context.members}
            canReassignPic={scope.canReassignPic}
            onReassignPic={(vipClientId, picId) => void reassign(vipClientId, picId)}
            isMobile={isMobile}
          />
        )}
      </div>
      {data !== null && (
        <TablePagination
          page={data.page}
          pageCount={data.pageCount}
          total={data.total}
          summary={t('Showing {shown} of {total} clients', {
            shown: data.rows.length,
            total: data.total,
          })}
          onPageChange={setPage}
        />
      )}
    </div>
  );

  const sidePanel =
    panel === null ? null : panel.kind === 'DETAIL' ? (
      <ClientDetailPanel
        key={panel.vipClientId}
        vipClientId={panel.vipClientId}
        context={context}
        width={panelWidth}
        onClose={() => setPanel(null)}
        onChanged={() => void reload()}
      />
    ) : panel.kind === 'ADD' ? (
      <DashboardAddClientPanel
        context={context}
        width={panelWidth}
        onClose={() => setPanel(null)}
        onCreated={(vipClientId) => {
          setPanel({ kind: 'DETAIL', vipClientId });
          void reload();
        }}
      />
    ) : (
      <BcSettingsPanel
        width={isMobile ? '100%' : 560}
        onClose={() => setPanel(null)}
        onChanged={() => {
          reloadContext();
          void reload();
        }}
      />
    );

  return (
    <div
      style={{
        background: BC_TOKENS.background,
        boxSizing: 'border-box',
        display: 'flex',
        height: '100%',
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden',
        width: '100%',
      }}
    >
      {!(isMobile && sidePanel !== null) && list}
      {sidePanel}
    </div>
  );
};

export const DashboardPage = () => {
  const { context, error, reload } = useBcContext();

  return (
    <BcThemeRoot>
      {error !== null && context === null && (
        <div style={{ padding: spacing(4) }}>
          <Banner color="danger" variant="secondary">
            {error}
          </Banner>
        </div>
      )}
      {context === null && error === null && <TableSkeleton />}
      {context !== null &&
        (context.scope.role === 'NONE' ? (
          <NoBcAccess />
        ) : (
          <DashboardBody context={context} reloadContext={() => void reload()} />
        ))}
    </BcThemeRoot>
  );
};
