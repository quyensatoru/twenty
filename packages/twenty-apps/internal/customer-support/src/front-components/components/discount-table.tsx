import { useRef, useState } from 'react';
import { t } from 'twenty-sdk/front-component';

import { type DiscountListItem } from '../../types/discount';
import {
  readDiscountShop,
  readElapsedShare,
} from '../utils/discount-display.util';
import {
  AppBadge,
  readOfferLabel,
  readPeriodLabel,
  readTargetLabel,
  readValidityLabel,
} from './discount-parts';
import {
  type DiscountActionHandlers,
  DiscountRowActions,
} from './discount-row-actions';
import { DiscountMerchantLink } from './discount-merchant-link';
import { DiscountSyncPill } from './discount-sync-pill';
import { DISCOUNT_TOKENS, spacing } from './discount-theme';

export type DiscountRowActionProps = DiscountActionHandlers & {
  canEdit: boolean;
  resendingId: string | null;
};

type DiscountTableProps = DiscountRowActionProps & {
  discounts: DiscountListItem[];
  today: string;
  selectedId: string | null;
  isMobile: boolean;
  onSelect: (discountId: string) => void;
};

// Pinned to the right edge so the actions stay in reach when the table
// scrolls sideways beside an open side panel.
export const ACTIONS_CELL_STYLE = {
  borderLeft: `1px solid ${DISCOUNT_TOKENS.borderLight}`,
  position: 'sticky',
  right: 0,
  textAlign: 'right',
  width: 1,
} as const;

// Mirrors Twenty's record table: 32px rows, light cell borders, tertiary
// header text without uppercase.
export const HEADER_CELL_STYLE = {
  background: DISCOUNT_TOKENS.background,
  borderBottom: `1px solid ${DISCOUNT_TOKENS.borderLight}`,
  borderRight: `1px solid ${DISCOUNT_TOKENS.borderLight}`,
  color: DISCOUNT_TOKENS.textTertiary,
  fontSize: DISCOUNT_TOKENS.fontSizeMd,
  fontWeight: DISCOUNT_TOKENS.fontWeightMedium,
  height: 32,
  padding: `0 ${spacing(2)}`,
  position: 'sticky',
  textAlign: 'left',
  top: 0,
  whiteSpace: 'nowrap',
  zIndex: 1,
} as const;

export const CELL_STYLE = {
  borderBottom: `1px solid ${DISCOUNT_TOKENS.borderLight}`,
  borderRight: `1px solid ${DISCOUNT_TOKENS.borderLight}`,
  fontSize: DISCOUNT_TOKENS.fontSizeMd,
  height: 32,
  padding: `${spacing(1)} ${spacing(2)}`,
  verticalAlign: 'middle',
  whiteSpace: 'nowrap',
} as const;

export const TABLE_STYLE = {
  borderCollapse: 'separate',
  borderSpacing: 0,
  minWidth: 880,
  width: '100%',
} as const;

// Shared with the loading skeleton so both show the same columns.
export const DiscountTableHeader = ({ hasActions }: { hasActions: boolean }) => (
  <thead>
    <tr>
      <th style={HEADER_CELL_STYLE}>{t('Code')}</th>
      <th style={HEADER_CELL_STYLE}>{t('App')}</th>
      <th style={HEADER_CELL_STYLE}>{t('Offer')}</th>
      <th style={HEADER_CELL_STYLE}>{t('For')}</th>
      <th style={HEADER_CELL_STYLE}>{t('Valid')}</th>
      <th style={HEADER_CELL_STYLE}>{t('Used')}</th>
      <th style={HEADER_CELL_STYLE}>{t('Status on app')}</th>
      <th style={{ ...HEADER_CELL_STYLE, borderRight: 'none' }}>{t('Created by')}</th>
      {hasActions && (
        <th style={{ ...HEADER_CELL_STYLE, ...ACTIONS_CELL_STYLE, borderRight: 'none', zIndex: 2 }} />
      )}
    </tr>
  </thead>
);

const SubText = ({ children }: { children: string }) => (
  <span
    style={{
      color: DISCOUNT_TOKENS.textTertiary,
      display: 'block',
      fontSize: DISCOUNT_TOKENS.fontSizeSm,
      maxWidth: 220,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }}
  >
    {children}
  </span>
);

const ElapsedBar = ({ share }: { share: number }) => (
  <span
    style={{
      background: DISCOUNT_TOKENS.backgroundTertiary,
      borderRadius: 2,
      display: 'block',
      height: 3,
      marginTop: 3,
      overflow: 'hidden',
      width: 80,
    }}
  >
    <span
      style={{
        background: DISCOUNT_TOKENS.textTertiary,
        display: 'block',
        height: '100%',
        width: `${Math.round(share * 100)}%`,
      }}
    />
  </span>
);

const readUsageLabel = (discount: DiscountListItem): string =>
  `${discount.timesUsed ?? 0} / ${discount.limitUsage ?? '∞'}`;

// A click on an action must not also open the row. The flag is cleared on
// the next tick in case the sandbox already stopped the event from bubbling.
const useActionClickGuard = () => {
  const isActionClick = useRef(false);

  return {
    markAction: () => {
      isActionClick.current = true;
      setTimeout(() => {
        isActionClick.current = false;
      }, 0);
    },
    shouldIgnoreRowClick: () => {
      const ignore = isActionClick.current;

      isActionClick.current = false;

      return ignore;
    },
  };
};

// The one shop a discount is for, when there is a single one to open.
export const readSingleShop = (discount: DiscountListItem): string | null => {
  if (discount.scope === 'ALL') {
    return null;
  }

  if (discount.scope === 'MULTI') {
    return discount.assignedDomains.length === 1
      ? discount.assignedDomains[0]
      : null;
  }

  return readDiscountShop(discount);
};

const DiscountTarget = ({
  discount,
  onLinkClick,
}: {
  discount: DiscountListItem;
  onLinkClick: () => void;
}) => {
  const shop = readSingleShop(discount);

  return shop === null ? (
    <span style={{ color: DISCOUNT_TOKENS.textSecondary }}>
      {readTargetLabel(discount)}
    </span>
  ) : (
    <span onClick={onLinkClick}>
      <DiscountMerchantLink
        shop={shop}
        merchantId={discount.merchantId}
        appId={discount.appId}
      />
    </span>
  );
};

const RowActions = ({
  discount,
  actions,
  onActionClick,
}: {
  discount: DiscountListItem;
  actions: DiscountRowActionProps;
  onActionClick: () => void;
}) => (
  <span onClick={onActionClick}>
    <DiscountRowActions
      discount={discount}
      isCompact
      isResending={actions.resendingId === discount.id}
      onResend={actions.onResend}
      onEdit={actions.onEdit}
      onDuplicate={actions.onDuplicate}
      onDelete={actions.onDelete}
    />
  </span>
);

const DiscountRow = ({
  discount,
  today,
  isSelected,
  onSelect,
  actions,
}: {
  discount: DiscountListItem;
  today: string;
  isSelected: boolean;
  onSelect: () => void;
  actions: DiscountRowActionProps;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { markAction, shouldIgnoreRowClick } = useActionClickGuard();
  const share = readElapsedShare(discount, today);
  const background = isSelected
    ? DISCOUNT_TOKENS.backgroundSelected
    : isHovered
      ? DISCOUNT_TOKENS.backgroundHover
      : 'transparent';

  return (
    <tr
      onClick={() => {
        if (!shouldIgnoreRowClick()) {
          onSelect();
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ background, cursor: 'pointer' }}
    >
      <td style={CELL_STYLE}>
        <span style={{ display: 'block', fontWeight: DISCOUNT_TOKENS.fontWeightMedium }}>
          {discount.discountCode.length > 0 ? discount.discountCode : '—'}
        </span>
        {discount.reason !== null && discount.reason.length > 0 && (
          <SubText>{discount.reason}</SubText>
        )}
      </td>
      <td style={CELL_STYLE}>
        <AppBadge appName={discount.appName} />
      </td>
      <td style={CELL_STYLE}>{readOfferLabel(discount)}</td>
      <td style={CELL_STYLE}>
        <DiscountTarget discount={discount} onLinkClick={markAction} />
      </td>
      <td style={CELL_STYLE}>
        <span style={{ display: 'block' }}>{readPeriodLabel(discount)}</span>
        {share !== null && share > 0 && share < 1 ? (
          <ElapsedBar share={share} />
        ) : (
          <SubText>{readValidityLabel(discount, today)}</SubText>
        )}
      </td>
      <td style={{ ...CELL_STYLE, fontVariantNumeric: 'tabular-nums' }}>
        {readUsageLabel(discount)}
      </td>
      <td style={CELL_STYLE}>
        <DiscountSyncPill
          syncStatus={discount.syncStatus}
          title={discount.syncError ?? undefined}
        />
      </td>
      <td style={{ ...CELL_STYLE, borderRight: 'none', color: DISCOUNT_TOKENS.textSecondary }}>
        {discount.createdByName ?? ''}
      </td>
      {actions.canEdit && (
        <td
          style={{
            ...CELL_STYLE,
            ...ACTIONS_CELL_STYLE,
            // The hover and selected tints are translucent; layered on the
            // page color so the scrolled columns do not show through.
            background:
              isSelected || isHovered
                ? `linear-gradient(${background}, ${background}), ${DISCOUNT_TOKENS.background}`
                : DISCOUNT_TOKENS.background,
            borderRight: 'none',
            padding: `0 ${spacing(1)}`,
          }}
        >
          <RowActions discount={discount} actions={actions} onActionClick={markAction} />
        </td>
      )}
    </tr>
  );
};

const DiscountCard = ({
  discount,
  today,
  isSelected,
  onSelect,
  actions,
}: {
  discount: DiscountListItem;
  today: string;
  isSelected: boolean;
  onSelect: () => void;
  actions: DiscountRowActionProps;
}) => {
  const { markAction, shouldIgnoreRowClick } = useActionClickGuard();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        if (!shouldIgnoreRowClick()) {
          onSelect();
        }
      }}
      style={{
        background: isSelected ? DISCOUNT_TOKENS.backgroundSelected : 'transparent',
        borderBottom: `1px solid ${DISCOUNT_TOKENS.borderLight}`,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: spacing(1.5),
        padding: `${spacing(3)} ${spacing(4)}`,
      }}
    >
      <span style={{ alignItems: 'center', display: 'flex', gap: spacing(2), justifyContent: 'space-between' }}>
        <span style={{ fontWeight: DISCOUNT_TOKENS.fontWeightMedium }}>
          {discount.discountCode.length > 0 ? discount.discountCode : '—'}
        </span>
        <DiscountSyncPill syncStatus={discount.syncStatus} />
      </span>
      <span
        style={{
          alignItems: 'center',
          color: DISCOUNT_TOKENS.textSecondary,
          display: 'flex',
          flexWrap: 'wrap',
          fontSize: DISCOUNT_TOKENS.fontSizeSm,
          gap: spacing(2),
        }}
      >
        <AppBadge appName={discount.appName} />
        <span>{readOfferLabel(discount)}</span>
        <DiscountTarget discount={discount} onLinkClick={markAction} />
        <span>{readValidityLabel(discount, today)}</span>
      </span>
      {actions.canEdit && (
        <RowActions discount={discount} actions={actions} onActionClick={markAction} />
      )}
    </div>
  );
};

export const DiscountTable = ({
  discounts,
  today,
  selectedId,
  isMobile,
  onSelect,
  ...actions
}: DiscountTableProps) => {
  if (isMobile) {
    return (
      <div>
        {discounts.map((discount) => (
          <DiscountCard
            key={discount.id}
            discount={discount}
            today={today}
            isSelected={discount.id === selectedId}
            onSelect={() => onSelect(discount.id)}
            actions={actions}
          />
        ))}
      </div>
    );
  }

  return (
    <table style={TABLE_STYLE}>
      <DiscountTableHeader hasActions={actions.canEdit} />
      <tbody>
        {discounts.map((discount) => (
          <DiscountRow
            key={discount.id}
            discount={discount}
            today={today}
            isSelected={discount.id === selectedId}
            onSelect={() => onSelect(discount.id)}
            actions={actions}
          />
        ))}
      </tbody>
    </table>
  );
};
