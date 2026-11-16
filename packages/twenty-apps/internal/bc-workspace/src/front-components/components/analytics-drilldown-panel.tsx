import { useState } from 'react';
import {
  type AppPath,
  copyToClipboard,
  enqueueSnackbar,
  navigate,
  t,
} from 'twenty-sdk/front-component';
import { IconCopy, IconExternalLink, IconSearch } from 'twenty-ui/icon';
import { Tag } from 'twenty-ui/primitives/data-display';
import { Banner, Loader } from 'twenty-ui/primitives/feedback';
import { Button } from 'twenty-ui/primitives/input';

import { METRIC_DEFINITIONS } from '../../constants/metric-definitions';
import {
  type AnalyticsMetricKey,
  type AnalyticsRequest,
  type DrilldownCellValue,
  type DrilldownColumn,
  type KpiValue,
} from '../../types/analytics';
import { type SortState } from '../../utils/sort-records.util';
import { useAnalyticsDebouncedValue } from '../hooks/use-analytics-debounced-value';
import {
  loadDrilldownExport,
  useAnalyticsDrilldown,
} from '../hooks/use-analytics-drilldown';
import { buildCsv, formatReportingDate } from '../utils/analytics-date.util';
import {
  findDrilldownOption,
  formatKpiValue,
} from '../utils/analytics-display.util';
import { formatCurrency } from '../utils/format.util';
import { readErrorText } from '../utils/post-app-route.util';
import { ReviewLink } from './analytics-tables';
import { BcTextInput } from './bc-text-input';
import { BcInfoTip } from './bc-info-tip';
import { BcSidePanel } from './bc-side-panel';
import {
  CELL_STYLE,
  HoverRow,
  SortableHeaderCell,
  TABLE_STYLE,
  TablePagination,
} from './bc-table';
import { AppBadge } from './bc-tags';
import { BC_TOKENS, spacing } from './bc-theme';
import { stopRowClick } from './bc-table';

type TagColor = Parameters<typeof Tag>[0]['color'];

// Fixed cell texts the server sends in English; literal t() calls keep them
// in the translation catalog.
const TRANSLATED_TEXT: Record<string, () => string> = {
  Completed: () => t('Completed'),
  'Not completed': () => t('Not completed'),
  Yes: () => t('Yes'),
  No: () => t('No'),
  'Outreach before the attribution window shown': () =>
    t('Outreach before the attribution window shown'),
  'No BC review request before publication': () =>
    t('No BC review request before publication'),
  'BC review request before publication': () =>
    t('BC review request before publication'),
  'BC upsell outreach before the upgrade': () =>
    t('BC upsell outreach before the upgrade'),
  'No BC upsell outreach before the upgrade': () =>
    t('No BC upsell outreach before the upgrade'),
  'Manual correction': () => t('Manual correction'),
};

const readCellText = (value: DrilldownCellValue): string =>
  typeof value === 'string' &&
  Object.prototype.hasOwnProperty.call(TRANSLATED_TEXT, value)
    ? TRANSLATED_TEXT[value]()
    : String(value);

const DrilldownCell = ({
  column,
  value,
  currency,
  locale,
  timezone,
}: {
  column: DrilldownColumn;
  value: DrilldownCellValue;
  currency: string;
  locale: string;
  timezone: string;
}) => {
  if (column.kind === 'link') {
    return <ReviewLink url={typeof value === 'string' ? value : null} />;
  }

  if (value === null || value === '') {
    return <span style={{ color: BC_TOKENS.textTertiary }}>—</span>;
  }

  switch (column.kind) {
    case 'url':
      return (
        <a
          href={String(value)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={stopRowClick}
          style={{
            alignItems: 'center',
            color: BC_TOKENS.accent,
            display: 'inline-flex',
            gap: spacing(1),
            textDecoration: 'none',
          }}
        >
          {t('Open')}
          <IconExternalLink size={12} />
        </a>
      );
    case 'date':
      return <>{formatReportingDate(String(value), locale, timezone)}</>;
    case 'currency':
      return <>{formatCurrency(Number(value), currency, locale)}</>;
    case 'app':
      return <AppBadge appName={String(value)} />;
    case 'status': {
      const option = findDrilldownOption(column.optionSet, String(value));

      return option === undefined ? (
        <>{String(value)}</>
      ) : (
        <Tag color={option.color as TagColor}>{t(option.label)}</Tag>
      );
    }
    default:
      return <>{readCellText(value)}</>;
  }
};

// Spreadsheet-friendly values: ISO dates, raw numbers, translated labels.
const readCsvValue = (
  column: DrilldownColumn,
  value: DrilldownCellValue,
): string => {
  if (value === null) {
    return '';
  }

  if (column.kind === 'status') {
    const option = findDrilldownOption(column.optionSet, String(value));

    return option === undefined ? String(value) : t(option.label);
  }

  return readCellText(value);
};

// Docked beside the page, which scrolls in its own container: opening or
// switching metrics never moves the reader's scroll position.
export const AnalyticsDrilldownPanel = ({
  request,
  metricKey,
  kpi,
  currency,
  locale,
  timezone,
  width,
  onClose,
}: {
  request: AnalyticsRequest;
  metricKey: AnalyticsMetricKey;
  kpi: KpiValue | undefined;
  currency: string;
  locale: string;
  timezone: string;
  width: number | string;
  onClose: () => void;
}) => {
  const [sort, setSort] = useState<SortState>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [isCopying, setIsCopying] = useState(false);
  const search = useAnalyticsDebouncedValue(searchInput.trim(), 300);
  const { data, isLoading, error } = useAnalyticsDrilldown({
    request,
    metricKey,
    sort,
    page,
    search,
  });
  const definition = METRIC_DEFINITIONS[metricKey];
  const label = t(definition.label);

  // The sandbox cannot hand the browser a file, so the full set goes to the
  // clipboard as CSV, ready to paste into a spreadsheet.
  const copyCsv = async () => {
    setIsCopying(true);

    try {
      const exported = await loadDrilldownExport({
        request,
        metricKey,
        sort,
        search,
      });
      const csv = buildCsv(
        exported.columns.map((column) => t(column.label)),
        exported.rows.map((row) =>
          exported.columns.map((column) =>
            readCsvValue(column, row.cells[column.key] ?? null),
          ),
        ),
      );

      await copyToClipboard(csv);
      void enqueueSnackbar({
        message: exported.isTruncated
          ? t('Copied the first {count} rows as CSV.', {
              count: exported.rows.length,
            })
          : t('Copied {count} rows as CSV.', { count: exported.rows.length }),
        variant: 'success',
      });
    } catch (copyError) {
      void enqueueSnackbar({
        message: readErrorText(copyError),
        variant: 'error',
      });
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <BcSidePanel
      title={label}
      aside={<BcInfoTip label={label} metric={definition} />}
      width={width}
      ariaLabel={t('{metric} records', { metric: label })}
      onClose={onClose}
    >
      <div
        style={{
          borderBottom: `1px solid ${BC_TOKENS.borderLight}`,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing(1),
          padding: `${spacing(3)} ${spacing(4)}`,
        }}
      >
        <span
          style={{ fontSize: 24, fontWeight: BC_TOKENS.fontWeightSemiBold }}
        >
          {formatKpiValue(metricKey, kpi, currency, locale)}
        </span>
        <span
          style={{
            color: BC_TOKENS.textTertiary,
            fontSize: BC_TOKENS.fontSizeSm,
          }}
        >
          {t(definition.timeBasis)}
          {data !== null &&
            ` · ${
              data.unit === 'clients'
                ? t('{count} clients', { count: data.total })
                : t('{count} records', { count: data.total })
            }`}
        </span>
        {data?.note != null && (
          <span
            style={{
              color: BC_TOKENS.textSecondary,
              fontSize: BC_TOKENS.fontSizeSm,
            }}
          >
            {t(data.note)}
          </span>
        )}
      </div>
      {data !== null && data.columns.length > 0 && (
        <div
          style={{
            alignItems: 'center',
            borderBottom: `1px solid ${BC_TOKENS.borderLight}`,
            display: 'flex',
            gap: spacing(2),
            padding: `${spacing(2)} ${spacing(4)}`,
          }}
        >
          <span style={{ flex: 1, minWidth: 0 }}>
            <BcTextInput
              type="search"
              value={searchInput}
              ariaLabel={t('Search records')}
              placeholder={t('Search records')}
              startElement={
                <span
                  style={{
                    color: BC_TOKENS.textTertiary,
                    display: 'inline-flex',
                    paddingLeft: spacing(2),
                  }}
                >
                  <IconSearch size={14} />
                </span>
              }
              onChange={(value) => {
                setSearchInput(value);
                setPage(1);
              }}
            />
          </span>
          <Button
            variant="outline"
            color="neutral"
            size="sm"
            startIcon={<IconCopy size={14} />}
            loading={isCopying}
            disabled={isCopying || data.total === 0}
            onClick={() => void copyCsv()}
          >
            {t('Copy as CSV')}
          </Button>
        </div>
      )}
      {error !== null && (
        <div style={{ padding: spacing(4) }}>
          <Banner color="danger" variant="secondary">
            {error}
          </Banner>
        </div>
      )}
      {data === null && error === null && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: spacing(8),
          }}
        >
          <Loader />
        </div>
      )}
      {data !== null && data.columns.length > 0 && (
        <div
          style={{
            opacity: isLoading ? 0.6 : 1,
            transition: 'opacity 150ms ease-in-out',
          }}
        >
          {data.rows.length === 0 ? (
            <div
              style={{
                color: BC_TOKENS.textTertiary,
                padding: spacing(8),
                textAlign: 'center',
              }}
            >
              {search.length > 0
                ? t('No record matches this search.')
                : t('No record behind this metric for the selected filters.')}
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={TABLE_STYLE}>
                  <thead>
                    <tr>
                      {data.columns.map((column, index) => (
                        <SortableHeaderCell
                          key={column.key}
                          label={t(column.label)}
                          sortKey={column.key}
                          sort={sort}
                          defaultSort={data.defaultSort}
                          align={
                            column.kind === 'number' ||
                            column.kind === 'currency'
                              ? 'right'
                              : 'left'
                          }
                          onSortChange={(next) => {
                            setSort(next);
                            setPage(1);
                          }}
                          style={
                            index === data.columns.length - 1
                              ? { borderRight: 'none' }
                              : undefined
                          }
                        />
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row) => (
                      <HoverRow
                        key={row.id}
                        onClick={
                          row.vipClientId === null
                            ? undefined
                            : () =>
                                void navigate(
                                  `/object/vipClient/${row.vipClientId}` as AppPath,
                                )
                        }
                      >
                        {data.columns.map((column, index) => (
                          <td
                            key={column.key}
                            style={{
                              ...CELL_STYLE,
                              textAlign:
                                column.kind === 'number' ||
                                column.kind === 'currency'
                                  ? 'right'
                                  : 'left',
                              ...(index === data.columns.length - 1
                                ? { borderRight: 'none' }
                                : {}),
                            }}
                          >
                            <DrilldownCell
                              column={column}
                              value={row.cells[column.key] ?? null}
                              currency={currency}
                              locale={locale}
                              timezone={timezone}
                            />
                          </td>
                        ))}
                      </HoverRow>
                    ))}
                  </tbody>
                </table>
              </div>
              <TablePagination
                page={data.page}
                pageCount={data.pageCount}
                total={data.total}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      )}
    </BcSidePanel>
  );
};
