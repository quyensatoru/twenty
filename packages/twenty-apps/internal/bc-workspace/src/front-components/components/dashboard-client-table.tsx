import { Fragment, type ReactNode, useState } from 'react';
import { t, useLocale } from 'twenty-sdk/front-component';
import {
  IconChevronDown,
  IconChevronRight,
  IconExternalLink,
  IconMessage,
} from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';

import { type BcContextMember } from '../../types/bc-context';
import { type ClientAppEntry, type ClientRow } from '../../types/dashboard';
import {
  type SortState,
  type SortValue,
  sortRecords,
} from '../../utils/sort-records.util';
import { openCrispConversation } from '../utils/client-navigation.util';
import { formatDate, formatNumber } from '../utils/format.util';
import {
  CELL_STYLE,
  HoverRow,
  SortableHeaderCell,
  stopRowClick,
  TABLE_STYLE,
} from './bc-table';
import {
  AppBadge,
  AppHealthTag,
  RelationshipStatusTag,
  ReviewStateLabel,
  SubscriptionLifecycleTag,
} from './bc-tags';
import { BC_TOKENS, spacing } from './bc-theme';
import { ClientPicLabel, ClientPicSelect } from './client-pic';

// Tall enough for the per-app chat button, so every app line stays level.
const APP_LINE_HEIGHT = 28;

export const DEFAULT_CLIENT_SORT: SortState = { key: 'lastBcContact', direction: 'DESC' };

type DashboardClientTableProps = {
  rows: ClientRow[];
  sort: SortState;
  onSortChange: (sort: SortState) => void;
  selectedId: string | null;
  onSelect: (vipClientId: string) => void;
  members: BcContextMember[];
  canReassignPic: boolean;
  onReassignPic: (vipClientId: string, picId: string | null) => void;
  isMobile: boolean;
};

// One line per app so product, plan and review of the same app stay level
// across the three columns.
const AppLines = ({
  apps,
  render,
}: {
  apps: ClientAppEntry[];
  render: (app: ClientAppEntry) => ReactNode;
}) =>
  apps.length === 0 ? (
    <span style={{ color: BC_TOKENS.textTertiary }}>—</span>
  ) : (
    <span style={{ display: 'flex', flexDirection: 'column' }}>
      {apps.map((app) => (
        <span
          key={app.merchantId}
          style={{ alignItems: 'center', display: 'flex', height: APP_LINE_HEIGHT }}
        >
          {render(app)}
        </span>
      ))}
    </span>
  );

const SubText = ({ children }: { children: ReactNode }) => (
  <span
    style={{
      color: BC_TOKENS.textTertiary,
      display: 'block',
      fontSize: BC_TOKENS.fontSizeSm,
      maxWidth: 240,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }}
  >
    {children}
  </span>
);

const readUsageLabel = (app: ClientAppEntry, locale: string): string =>
  app.usage === null
    ? '—'
    : `${formatNumber(app.usage.used, locale)} / ${formatNumber(app.usage.limit, locale)}${
        app.usage.limit > 0 ? ` · ${Math.round((app.usage.used / app.usage.limit) * 100)}%` : ''
      }`;

const LIFECYCLE_ORDER = { TRIAL: 1, ACTIVE: 0, CANCELLED: 2, UNINSTALLED: 3 } as const;
const HEALTH_ORDER = { AT_RISK: 0, HEALTHY: 1, INACTIVE: 2 } as const;
const REVIEW_ORDER = { NEEDS_REVIEW: 0, REVIEWED: 1, NOT_ELIGIBLE: 2 } as const;

const readAppSortValue = (app: ClientAppEntry & { id: string }, key: string): SortValue => {
  switch (key) {
    case 'app':
      return app.appName;
    case 'plan':
      return app.planLabel;
    case 'subscription':
      return LIFECYCLE_ORDER[app.lifecycle];
    case 'health':
      return HEALTH_ORDER[app.health];
    case 'review':
      return REVIEW_ORDER[app.review];
    case 'usage':
      return app.usage === null || app.usage.limit <= 0 ? null : app.usage.used / app.usage.limit;
    default:
      return null;
  }
};

// One client's apps, so sorting stays in the page.
const ClientAppsSubTable = ({ apps }: { apps: ClientAppEntry[] }) => {
  const locale = useLocale();
  const [sort, setSort] = useState<SortState>(null);
  const subHeader = { position: 'static' as const, background: 'transparent' };
  const sortedApps = sortRecords(
    apps.map((app) => ({ ...app, id: app.merchantId })),
    sort,
    readAppSortValue,
  );
  const header = (label: string, sortKey: string, isLast = false) => (
    <SortableHeaderCell
      label={label}
      sortKey={sortKey}
      sort={sort}
      onSortChange={setSort}
      style={isLast ? { ...subHeader, borderRight: 'none' } : subHeader}
    />
  );

  return (
    <table style={{ ...TABLE_STYLE, border: `1px solid ${BC_TOKENS.borderLight}`, borderRadius: BC_TOKENS.radiusSmall }}>
      <thead>
        <tr>
          {header(t('App'), 'app')}
          {header(t('Plan'), 'plan')}
          {header(t('Subscription'), 'subscription')}
          {header(t('App health'), 'health')}
          {header(t('Review'), 'review')}
          {header(t('Usage'), 'usage', true)}
        </tr>
      </thead>
      <tbody>
        {sortedApps.map((app) => (
          <tr key={app.merchantId}>
            <td style={CELL_STYLE}>
              <AppBadge appName={app.appName} />
            </td>
            <td style={CELL_STYLE}>{app.planLabel ?? '—'}</td>
            <td style={CELL_STYLE}>
              <SubscriptionLifecycleTag value={app.lifecycle} />
            </td>
            <td style={CELL_STYLE}>
              <AppHealthTag value={app.health} />
            </td>
            <td style={CELL_STYLE}>
              <ReviewStateLabel value={app.review} />
            </td>
            <td style={{ ...CELL_STYLE, borderRight: 'none' }}>{readUsageLabel(app, locale)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// Each app's own chat: the CRM conversation, plus the Crisp inbox itself.
const AppChatLink = ({ app }: { app: ClientAppEntry }) =>
  app.chat === null ? (
    <span style={{ color: BC_TOKENS.textTertiary }}>—</span>
  ) : (
    <span
      onClick={stopRowClick}
      style={{ alignItems: 'center', display: 'inline-flex', gap: spacing(0.5) }}
    >
      <Button
        variant="ghost"
        color="neutral"
        size="sm"
        title={app.chat.preview ?? undefined}
        startIcon={<IconMessage size={14} />}
        onClick={() => {
          if (app.chat !== null) {
            openCrispConversation(app.chat.conversationId);
          }
        }}
      >
        {t('View chat')}
      </Button>
      {app.chat.crispUrl !== null && (
        <a
          href={app.chat.crispUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={t('Open in Crisp')}
          title={t('Open in Crisp')}
          style={{ color: BC_TOKENS.textTertiary, display: 'inline-flex' }}
        >
          <IconExternalLink size={14} />
        </a>
      )}
    </span>
  );

const ReviewSummary = ({ row }: { row: ClientRow }) => (
  <span style={{ display: 'flex', flexDirection: 'column' }}>
    <AppLines apps={row.apps} render={(app) => <ReviewStateLabel value={app.review} />} />
    {row.apps.length > 0 && (
      <SubText>
        {t('{reviewed}/{eligible} reviewed', {
          reviewed: row.reviewedCount,
          eligible: row.eligibleReviewCount,
        })}
      </SubText>
    )}
  </span>
);

const ClientRowView = ({
  row,
  isSelected,
  isExpanded,
  onToggle,
  onSelect,
  members,
  canReassignPic,
  onReassignPic,
}: {
  row: ClientRow;
  isSelected: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
  members: BcContextMember[];
  canReassignPic: boolean;
  onReassignPic: (picId: string | null) => void;
}) => {
  const locale = useLocale();
  const topCell = { ...CELL_STYLE, verticalAlign: 'top' as const, paddingTop: spacing(2), paddingBottom: spacing(2) };

  return (
    <Fragment>
      <HoverRow isSelected={isSelected} onClick={onSelect}>
        <td style={topCell}>
          <span style={{ alignItems: 'flex-start', display: 'flex', gap: spacing(1) }}>
            <span onClick={stopRowClick}>
              <Button
                variant="ghost"
                color="neutral"
                size="sm"
                aria-label={isExpanded ? t('Hide apps') : t('Show apps')}
                aria-expanded={isExpanded}
                startIcon={
                  isExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />
                }
                onClick={onToggle}
              />
            </span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontWeight: BC_TOKENS.fontWeightMedium }}>
                {row.name}
              </span>
              {row.shopDomain !== null && <SubText>{row.shopDomain}</SubText>}
            </span>
          </span>
        </td>
        <td style={topCell}>
          <AppLines apps={row.apps} render={(app) => <AppBadge appName={app.appName} />} />
        </td>
        <td style={topCell}>
          <AppLines apps={row.apps} render={(app) => <AppChatLink app={app} />} />
        </td>
        <td style={topCell}>
          <AppLines apps={row.apps} render={(app) => app.planLabel ?? '—'} />
        </td>
        <td style={topCell}>
          {canReassignPic ? (
            <span onClick={stopRowClick}>
              <ClientPicSelect
                picId={row.picId}
                picName={row.picName}
                members={members}
                onChange={onReassignPic}
              />
            </span>
          ) : (
            <ClientPicLabel name={row.picName} />
          )}
        </td>
        <td style={topCell}>
          <span style={{ display: 'block' }}>{formatDate(row.lastBcContactAt, locale)}</span>
          {row.lastBcContactByName !== null && (
            <SubText>{t('by {name}', { name: row.lastBcContactByName })}</SubText>
          )}
        </td>
        <td style={topCell}>
          <RelationshipStatusTag value={row.status} />
        </td>
        <td style={{ ...topCell, borderRight: 'none' }}>
          <ReviewSummary row={row} />
        </td>
      </HoverRow>
      {isExpanded && (
        <tr>
          <td
            colSpan={8}
            style={{
              ...CELL_STYLE,
              background: BC_TOKENS.backgroundSecondary,
              borderRight: 'none',
              padding: `${spacing(2)} ${spacing(3)} ${spacing(3)}`,
              whiteSpace: 'normal',
            }}
          >
            <span
              style={{
                color: BC_TOKENS.textTertiary,
                display: 'block',
                fontSize: BC_TOKENS.fontSizeSm,
                marginBottom: spacing(2),
              }}
            >
              {t('Subscription and app health are tracked per app. Only the overall client status shows on the main row.')}
            </span>
            {row.apps.length === 0 ? (
              <span style={{ color: BC_TOKENS.textTertiary }}>
                {t('No app install is linked to this client yet.')}
              </span>
            ) : (
              <ClientAppsSubTable apps={row.apps} />
            )}
          </td>
        </tr>
      )}
    </Fragment>
  );
};

const ClientCard = ({
  row,
  isSelected,
  onSelect,
}: {
  row: ClientRow;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const locale = useLocale();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      style={{
        background: isSelected ? BC_TOKENS.backgroundSelected : 'transparent',
        borderBottom: `1px solid ${BC_TOKENS.borderLight}`,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: spacing(2),
        padding: `${spacing(3)} ${spacing(4)}`,
      }}
    >
      <span style={{ alignItems: 'center', display: 'flex', gap: spacing(2), justifyContent: 'space-between' }}>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: 'block', fontWeight: BC_TOKENS.fontWeightMedium }}>{row.name}</span>
          {row.shopDomain !== null && <SubText>{row.shopDomain}</SubText>}
        </span>
        <RelationshipStatusTag value={row.status} />
      </span>
      {row.apps.map((app) => (
        <span
          key={app.merchantId}
          style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: spacing(2) }}
        >
          <AppBadge appName={app.appName} />
          <span>{app.planLabel ?? '—'}</span>
          <SubscriptionLifecycleTag value={app.lifecycle} />
          <ReviewStateLabel value={app.review} />
          <AppChatLink app={app} />
        </span>
      ))}
      <span style={{ color: BC_TOKENS.textTertiary, display: 'flex', fontSize: BC_TOKENS.fontSizeSm, gap: spacing(3) }}>
        <span>{row.picName ?? t('Unassigned')}</span>
        <span>
          {t('Last BC contact')}: {formatDate(row.lastBcContactAt, locale)}
        </span>
      </span>
    </div>
  );
};

export const DashboardClientTable = ({
  rows,
  sort,
  onSortChange,
  selectedId,
  onSelect,
  members,
  canReassignPic,
  onReassignPic,
  isMobile,
}: DashboardClientTableProps) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  if (isMobile) {
    return (
      <div>
        {rows.map((row) => (
          <ClientCard
            key={row.id}
            row={row}
            isSelected={row.id === selectedId}
            onSelect={() => onSelect(row.id)}
          />
        ))}
      </div>
    );
  }

  const toggle = (vipClientId: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);

      if (next.has(vipClientId)) {
        next.delete(vipClientId);
      } else {
        next.add(vipClientId);
      }

      return next;
    });
  };

  const header = (label: string, sortKey?: string, style?: object) => (
    <SortableHeaderCell
      label={label}
      sortKey={sortKey}
      sort={sort}
      defaultSort={DEFAULT_CLIENT_SORT}
      onSortChange={onSortChange}
      style={style}
    />
  );

  return (
    <table style={{ ...TABLE_STYLE, minWidth: 1080 }}>
      <thead>
        <tr>
          {header(t('Client'), 'client', { minWidth: 240 })}
          {header(t('Product'), 'product')}
          {header(t('Crisp'))}
          {header(t('Plan'), 'plan')}
          {header(t('PIC'), 'pic')}
          {header(t('Last BC contact'), 'lastBcContact')}
          {header(t('Status'), 'status')}
          {header(t('Review'), 'review', { borderRight: 'none' })}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <ClientRowView
            key={row.id}
            row={row}
            isSelected={row.id === selectedId}
            isExpanded={expandedIds.has(row.id)}
            onToggle={() => toggle(row.id)}
            onSelect={() => onSelect(row.id)}
            members={members}
            canReassignPic={canReassignPic}
            onReassignPic={(picId) => onReassignPic(row.id, picId)}
          />
        ))}
      </tbody>
    </table>
  );
};
