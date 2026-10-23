import { type ReactNode } from 'react';
import { t } from 'twenty-sdk/front-component';
import {
  IconPercentage,
} from 'twenty-ui/icon';
import { Banner } from 'twenty-ui/primitives/feedback';

import {
  type AppErrorItem,
  type DiscountListItem,
  type DiscountSyncLogItem,
} from '../../types/discount';
import { formatDateTime } from '../utils/format-inbox-time.util';
import {
  AppBadge,
  readOfferLabel,
  readPeriodLabel,
  readTargetLabel,
} from './discount-parts';
import {
  type DiscountActionHandlers,
  DiscountRowActions,
} from './discount-row-actions';
import { DiscountMerchantLink } from './discount-merchant-link';
import { DiscountSidePanel } from './discount-side-panel';
import { readSingleShop } from './discount-table';
import { SyncTimelineSkeleton } from './discount-skeleton';
import { DiscountSyncPill, readSyncStatusLabel } from './discount-sync-pill';
import { DISCOUNT_TOKENS, readColorScale, spacing } from './discount-theme';

export const readFieldLabel = (field: string | null): string | null => {
  switch (field) {
    case 'discountCode':
      return t('Code');
    case 'discountValue':
    case 'discountType':
      return t('Value');
    case 'limitInIntervals':
      return t('Billing cycles');
    case 'limitUsage':
      return t('Uses');
    case 'startDate':
    case 'endDate':
      return t('Valid dates');
    case 'assignedDomains':
    case 'merchantId':
    case 'scope':
      return t('Shops');
    case 'appId':
      return t('App');
    default:
      return field;
  }
};

export const AppErrorList = ({ errors }: { errors: AppErrorItem[] }) => (
  <ul
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: spacing(1),
      margin: 0,
      paddingLeft: spacing(4),
    }}
  >
    {errors.map((error, index) => {
      const label = readFieldLabel(error.field);

      return (
        <li key={index}>
          {label !== null && (
            <span style={{ fontWeight: DISCOUNT_TOKENS.fontWeightMedium }}>{label}: </span>
          )}
          {error.message}
        </li>
      );
    })}
  </ul>
);

const RESULT_COLORS: Record<string, string> = {
  APPLIED: 'green',
  REJECTED: 'red',
  ACCEPTED: 'amber',
  ERROR: 'orange',
  TIMEOUT: 'orange',
  NOT_CONNECTED: 'gray',
};

const readResultLabel = (log: DiscountSyncLogItem): string => {
  const app = log.appName ?? '';

  switch (log.result) {
    case 'APPLIED':
      return t('{app} applied it', { app });
    case 'REJECTED':
      return t('{app} rejected it', { app });
    case 'ACCEPTED':
      return t('{app} will answer later', { app });
    case 'TIMEOUT':
      return t('{app} did not answer', { app });
    case 'NOT_CONNECTED':
      return t('{app} is not connected', { app });
    default:
      return t('Could not reach {app}', { app });
  }
};

const readActionLabel = (log: DiscountSyncLogItem): string => {
  switch (log.action) {
    case 'CREATE':
      return t('Create');
    case 'DELETE':
      return t('Delete');
    default:
      return t('Update');
  }
};

const SectionTitle = ({ children }: { children: ReactNode }) => (
  <span
    style={{
      color: DISCOUNT_TOKENS.textTertiary,
      fontSize: DISCOUNT_TOKENS.fontSizeSm,
      fontWeight: DISCOUNT_TOKENS.fontWeightMedium,
    }}
  >
    {children}
  </span>
);

const SyncTimeline = ({ logs }: { logs: DiscountSyncLogItem[] }) => {
  if (logs.length === 0) {
    return (
      <span style={{ color: DISCOUNT_TOKENS.textTertiary }}>
        {t('Not sent from the CRM yet. Discounts made before this page went through the old web hook, which kept no answer.')}
      </span>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {logs.map((log, index) => (
        <div key={log.id} style={{ display: 'flex', gap: spacing(3) }}>
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              flexDirection: 'column',
              width: 10,
            }}
          >
            <span
              style={{
                background: readColorScale(RESULT_COLORS[log.result ?? 'ERROR']).solid,
                borderRadius: '50%',
                flexShrink: 0,
                height: 8,
                marginTop: 5,
                width: 8,
              }}
            />
            {index < logs.length - 1 && (
              <span style={{ background: DISCOUNT_TOKENS.borderLight, flex: 1, width: 1 }} />
            )}
          </div>
          <div
            style={{
              display: 'flex',
              flex: 1,
              flexDirection: 'column',
              gap: 2,
              minWidth: 0,
              paddingBottom: spacing(4),
            }}
          >
            <span style={{ fontWeight: DISCOUNT_TOKENS.fontWeightMedium }}>
              {readActionLabel(log)} · {readResultLabel(log)}
            </span>
            <span style={{ color: DISCOUNT_TOKENS.textTertiary, fontSize: DISCOUNT_TOKENS.fontSizeSm }}>
              {[
                formatDateTime(log.createdAt),
                log.httpStatus === null ? null : `HTTP ${log.httpStatus}`,
                log.durationMs === null ? null : `${log.durationMs} ms`,
                log.triggeredBy,
              ]
                .filter((part) => part !== null && part !== '')
                .join(' · ')}
            </span>
            {log.errors.length > 0 && log.result !== 'APPLIED' && (
              <div style={{ color: DISCOUNT_TOKENS.textSecondary, fontSize: DISCOUNT_TOKENS.fontSizeSm }}>
                <AppErrorList errors={log.errors} />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// The label column width of Twenty's record show page fields.
const PropertyRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <div
    style={{
      alignItems: 'center',
      display: 'grid',
      gap: spacing(2),
      gridTemplateColumns: '104px minmax(0, 1fr)',
      minHeight: 32,
    }}
  >
    <span style={{ color: DISCOUNT_TOKENS.textTertiary }}>{label}</span>
    <span style={{ minWidth: 0 }}>{children}</span>
  </div>
);

type DiscountDetailPanelProps = {
  discount: DiscountListItem;
  syncLogs: DiscountSyncLogItem[] | null;
  canEdit: boolean;
  isResending: boolean;
  onClose: () => void;
} & DiscountActionHandlers & {
  width: number | string;
};

export const DiscountDetailPanel = ({
  discount,
  syncLogs,
  canEdit,
  isResending,
  onClose,
  onEdit,
  onDuplicate,
  onResend,
  onDelete,
  width,
}: DiscountDetailPanelProps) => {
  const hasProblem =
    discount.syncStatus === 'REJECTED' ||
    discount.syncStatus === 'FAILED' ||
    discount.syncStatus === 'NOT_CONNECTED';
  const lastErrors =
    syncLogs?.find((log) => log.result !== 'APPLIED')?.errors ?? [];
  const appName = discount.appName ?? '';

  return (
    <DiscountSidePanel
      ariaLabel={t('Discount details')}
      width={width}
      onClose={onClose}
      icon={<IconPercentage size={16} />}
      title={
        <span>
          {discount.discountCode.length > 0 ? discount.discountCode : '—'}
        </span>
      }
      aside={<DiscountSyncPill syncStatus={discount.syncStatus} />}
    >
      {canEdit && (
        <div
          style={{
            borderBottom: `1px solid ${DISCOUNT_TOKENS.borderLight}`,
            padding: `${spacing(2)} ${spacing(3)}`,
          }}
        >
          <DiscountRowActions
            discount={discount}
            isCompact={false}
            isResending={isResending}
            onResend={onResend}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(5), padding: spacing(4) }}>
        <span style={{ color: DISCOUNT_TOKENS.textTertiary, fontSize: DISCOUNT_TOKENS.fontSizeSm }}>
          {[discount.reason, discount.createdByName, formatDateTime(discount.createdAt)]
            .filter((part) => typeof part === 'string' && part.length > 0)
            .join(' · ')}
        </span>

        {hasProblem && (
          <Banner color={discount.syncStatus === 'NOT_CONNECTED' ? 'blue' : 'danger'} variant="secondary">
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(1.5) }}>
              <span style={{ fontWeight: DISCOUNT_TOKENS.fontWeightMedium }}>
                {discount.syncStatus === 'NOT_CONNECTED'
                  ? t('{app} has no discount endpoint yet', { app: appName })
                  : `${appName}: ${readSyncStatusLabel(discount.syncStatus)}`}
              </span>
              {lastErrors.length > 0 ? (
                <AppErrorList errors={lastErrors} />
              ) : (
                discount.syncError !== null && <span>{discount.syncError}</span>
              )}
              {discount.syncStatus === 'FAILED' && discount.nextSyncAt !== null && (
                <span>{t('Retrying automatically {time}', { time: formatDateTime(discount.nextSyncAt) })}</span>
              )}
            </div>
          </Banner>
        )}

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <PropertyRow label={t('App')}>
            <AppBadge appName={discount.appName} />
          </PropertyRow>
          <PropertyRow label={t('For')}>
            {discount.scope === 'MULTI' ? (
              <span style={{ display: 'flex', flexWrap: 'wrap', gap: spacing(1) }}>
                {discount.assignedDomains.map((domain) => (
                  <DiscountMerchantLink key={domain} shop={domain} merchantId={null} appId={discount.appId} />
                ))}
              </span>
            ) : (
              readSingleShop(discount) === null ? (
                readTargetLabel(discount)
              ) : (
                <DiscountMerchantLink
                  shop={readSingleShop(discount) as string}
                  merchantId={discount.merchantId}
                  appId={discount.appId}
                />
              )
            )}
          </PropertyRow>
          <PropertyRow label={t('Offer')}>{readOfferLabel(discount)}</PropertyRow>
          <PropertyRow label={t('Valid')}>{readPeriodLabel(discount)}</PropertyRow>
          <PropertyRow label={t('Used')}>
            {`${discount.timesUsed ?? 0} / ${discount.limitUsage ?? '∞'}`}
          </PropertyRow>
          <PropertyRow label={t('Code active')}>
            {discount.status ? t('Yes') : t('No, turned off')}
          </PropertyRow>
          {discount.externalId !== null && (
            <PropertyRow label={t('ID on app')}>
              <span style={{ color: DISCOUNT_TOKENS.textSecondary }}>
                {discount.externalId}
              </span>
            </PropertyRow>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(3) }}>
          <SectionTitle>{t('Sent to the app')}</SectionTitle>
          {syncLogs === null ? (
            <SyncTimelineSkeleton />
          ) : (
            <SyncTimeline logs={syncLogs} />
          )}
        </div>
      </div>
    </DiscountSidePanel>
  );
};
