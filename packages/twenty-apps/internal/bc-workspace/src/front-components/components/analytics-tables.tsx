import { type ReactNode, useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconExternalLink, IconSearch } from 'twenty-ui/icon';

import {
  type AnalyticsRevenueRow,
  type AnalyticsReviewRow,
  type AnalyticsTeamRow,
} from '../../types/analytics';
import {
  paginate,
  type SortState,
  sortRecords,
} from '../../utils/sort-records.util';
import { formatReportingDate } from '../utils/analytics-date.util';
import { formatCurrency } from '../utils/format.util';
import {
  CELL_STYLE,
  HoverRow,
  SortableHeaderCell,
  stopRowClick,
  TABLE_STYLE,
  TablePagination,
} from './bc-table';
import { AppBadge } from './bc-tags';
import { BcTextInput } from './bc-text-input';
import { BC_TOKENS, spacing } from './bc-theme';

const PAGE_SIZE = 20;

type ColumnSpec<TRow> = {
  key: string;
  label: string;
  align?: 'left' | 'right';
  render: (row: TRow) => ReactNode;
};

// The whole dataset is in the analytics payload, so sorting here still sorts
// every row before the page is cut.
const SortedTable = <TRow extends { id: string }>({
  rows,
  columns,
  defaultSort,
  readValue,
  emptyLabel,
  onRowClick,
  searchKeys,
}: {
  rows: TRow[];
  columns: ColumnSpec<TRow>[];
  defaultSort: SortState;
  readValue: (row: TRow, key: string) => string | number | null;
  emptyLabel: string;
  onRowClick?: (row: TRow) => void;
  // Columns the search box looks in; no search box without them.
  searchKeys?: string[];
}) => {
  const [sort, setSort] = useState<SortState>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const query = search.trim().toLowerCase();
  const matching =
    query.length === 0 || searchKeys === undefined
      ? rows
      : rows.filter((row) =>
          searchKeys.some((key) =>
            String(readValue(row, key) ?? '')
              .toLowerCase()
              .includes(query),
          ),
        );
  const sorted = sortRecords(matching, sort, readValue, defaultSort);
  const paged = paginate(sorted, page, PAGE_SIZE);

  if (rows.length === 0) {
    return (
      <div
        style={{
          color: BC_TOKENS.textTertiary,
          padding: spacing(4),
          textAlign: 'center',
        }}
      >
        {emptyLabel}
      </div>
    );
  }

  return (
    <div>
      {searchKeys !== undefined && (
        <div style={{ marginBottom: spacing(2), maxWidth: 280 }}>
          <BcTextInput
            type="search"
            value={search}
            ariaLabel={t('Search this table')}
            placeholder={t('Search this table')}
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
              setSearch(value);
              setPage(1);
            }}
          />
        </div>
      )}
      {sorted.length === 0 && (
        <div
          style={{
            color: BC_TOKENS.textTertiary,
            padding: spacing(4),
            textAlign: 'center',
          }}
        >
          {t('No row matches this search.')}
        </div>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table style={TABLE_STYLE}>
          <thead>
            <tr>
              {columns.map((column, index) => (
                <SortableHeaderCell
                  key={column.key}
                  label={column.label}
                  sortKey={column.key}
                  sort={sort}
                  defaultSort={defaultSort}
                  align={column.align}
                  onSortChange={(next) => {
                    setSort(next);
                    setPage(1);
                  }}
                  style={
                    index === columns.length - 1
                      ? { borderRight: 'none' }
                      : undefined
                  }
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.items.map((row) => (
              <HoverRow
                key={row.id}
                onClick={
                  onRowClick === undefined ? undefined : () => onRowClick(row)
                }
              >
                {columns.map((column, index) => (
                  <td
                    key={column.key}
                    style={{
                      ...CELL_STYLE,
                      textAlign: column.align ?? 'left',
                      ...(index === columns.length - 1
                        ? { borderRight: 'none' }
                        : {}),
                    }}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </HoverRow>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination
        page={paged.page}
        pageCount={paged.pageCount}
        total={paged.total}
        onPageChange={setPage}
      />
    </div>
  );
};

// Opens the specific review, never the app listing; a missing link stays
// visibly missing.
export const ReviewLink = ({ url }: { url: string | null }) =>
  url === null || url.length === 0 ? (
    <span style={{ color: BC_TOKENS.textTertiary }}>{t('Not linked')}</span>
  ) : (
    <a
      href={url}
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
      {t('Open review')}
      <IconExternalLink size={12} />
    </a>
  );

const Stars = ({ rating }: { rating: number | null }) =>
  rating === null ? (
    <span style={{ color: BC_TOKENS.textTertiary }}>—</span>
  ) : (
    <span aria-label={t('{rating} out of 5', { rating })}>
      {'★'.repeat(Math.round(rating))}
      <span style={{ color: BC_TOKENS.textLight }}>
        {'★'.repeat(Math.max(0, 5 - Math.round(rating)))}
      </span>
      <span style={{ color: BC_TOKENS.textTertiary, marginLeft: spacing(1) }}>
        {rating}/5
      </span>
    </span>
  );

export const AnalyticsReviewsTable = ({
  reviews,
  locale,
  timezone,
}: {
  reviews: AnalyticsReviewRow[];
  locale: string;
  timezone: string;
}) => (
  <SortedTable
    rows={reviews}
    searchKeys={['clientName', 'appName', 'creditedMemberName']}
    defaultSort={{ key: 'publishedAt', direction: 'DESC' }}
    readValue={(row, key) => {
      switch (key) {
        case 'clientName':
          return row.clientName;
        case 'appName':
          return row.appName;
        case 'rating':
          return row.rating;
        case 'publishedAt':
          return row.publishedAt;
        case 'creditedMemberName':
          return row.creditedMemberName;
        default:
          return row.reviewUrl === null ? 0 : 1;
      }
    }}
    emptyLabel={t('No BC-acquired review in this period.')}
    columns={[
      {
        key: 'clientName',
        label: t('Client'),
        render: (row) => row.clientName,
      },
      {
        key: 'appName',
        label: t('App'),
        render: (row) => <AppBadge appName={row.appName} />,
      },
      {
        key: 'rating',
        label: t('Rating'),
        render: (row) => <Stars rating={row.rating} />,
      },
      {
        key: 'publishedAt',
        label: t('Review date'),
        render: (row) => formatReportingDate(row.publishedAt, locale, timezone),
      },
      {
        key: 'creditedMemberName',
        label: t('Credited BC'),
        render: (row) => row.creditedMemberName ?? '—',
      },
      {
        key: 'reviewUrl',
        label: t('Shopify review'),
        render: (row) => <ReviewLink url={row.reviewUrl} />,
      },
    ]}
  />
);

const TEAM_COLUMNS: { key: keyof AnalyticsTeamRow; label: string }[] = [
  { key: 'managedClients', label: 'Managed clients' },
  { key: 'clientsContacted', label: 'Clients contacted' },
  { key: 'meetingsCompleted', label: 'Meetings' },
  { key: 'reviewsAcquired', label: 'Reviews' },
  { key: 'bcInfluencedUpgrades', label: 'BC upgrades' },
  { key: 'issuesResolved', label: 'Issues resolved' },
  { key: 'tasksCompleted', label: 'Tasks completed' },
  { key: 'openTasks', label: 'Open tasks' },
];

export const AnalyticsTeamTable = ({
  rows,
  onSelectMember,
}: {
  rows: AnalyticsTeamRow[];
  onSelectMember: (memberId: string) => void;
}) => (
  <SortedTable
    rows={rows}
    searchKeys={['memberName']}
    defaultSort={{ key: 'memberName', direction: 'ASC' }}
    readValue={(row, key) => row[key as keyof AnalyticsTeamRow]}
    emptyLabel={t('No BC in this team yet.')}
    onRowClick={(row) => onSelectMember(row.id)}
    columns={[
      { key: 'memberName', label: t('BC'), render: (row) => row.memberName },
      ...TEAM_COLUMNS.map((column) => ({
        key: column.key,
        label: t(column.label),
        align: 'right' as const,
        render: (row: AnalyticsTeamRow) => row[column.key],
      })),
    ]}
  />
);

export const AnalyticsRevenueTable = ({
  rows,
  currency,
  locale,
}: {
  rows: AnalyticsRevenueRow[];
  currency: string;
  locale: string;
}) => (
  <SortedTable
    rows={rows}
    searchKeys={['clientName', 'appNames', 'picName']}
    defaultSort={{ key: 'lifetimeRevenue', direction: 'DESC' }}
    readValue={(row, key) => {
      switch (key) {
        case 'clientName':
          return row.clientName;
        case 'appNames':
          return row.appNames.join(', ');
        case 'picName':
          return row.picName;
        default:
          return row.lifetimeRevenue;
      }
    }}
    emptyLabel={t('No client in this portfolio.')}
    columns={[
      {
        key: 'clientName',
        label: t('Client'),
        render: (row) => row.clientName,
      },
      {
        key: 'appNames',
        label: t('Apps'),
        render: (row) => (
          <span style={{ display: 'inline-flex', gap: spacing(1) }}>
            {row.appNames.map((appName) => (
              <AppBadge key={appName} appName={appName} />
            ))}
          </span>
        ),
      },
      { key: 'picName', label: t('PIC'), render: (row) => row.picName ?? '—' },
      {
        key: 'lifetimeRevenue',
        label: t('Historical lifetime revenue'),
        align: 'right',
        render: (row) =>
          row.lifetimeRevenue === null ? (
            <span style={{ color: BC_TOKENS.textTertiary }}>
              {t('No payments recorded')}
            </span>
          ) : (
            formatCurrency(row.lifetimeRevenue, currency, locale)
          ),
      },
    ]}
  />
);
