import { t } from 'twenty-sdk/front-component';
import { Tag } from 'twenty-ui/primitives/data-display';

import { type DiscountSyncStatus } from '../../constants/discount';

const SYNC_STATUS_COLORS = {
  DRAFT: 'gray',
  PENDING: 'amber',
  APPLIED: 'green',
  REJECTED: 'red',
  FAILED: 'orange',
  NOT_CONNECTED: 'gray',
} as const;

export const readSyncStatusLabel = (
  syncStatus: DiscountSyncStatus | null,
): string => {
  switch (syncStatus) {
    case 'DRAFT':
      return t('Draft');
    case 'PENDING':
      return t('Sending');
    case 'APPLIED':
      return t('Applied');
    case 'REJECTED':
      return t('Rejected');
    case 'FAILED':
      return t('Not delivered');
    case 'NOT_CONNECTED':
      return t('Not connected');
    default:
      return t('Unconfirmed');
  }
};

type DiscountSyncPillProps = {
  syncStatus: DiscountSyncStatus | null;
  title?: string;
};

// Discounts created before the page existed have no status: Twenty's web hook
// sent them and nobody heard back.
export const DiscountSyncPill = ({ syncStatus, title }: DiscountSyncPillProps) => (
  <Tag
    color={syncStatus === null ? 'gray' : SYNC_STATUS_COLORS[syncStatus]}
    variant={syncStatus === null ? 'outline' : 'soft'}
    weight="medium"
    preventShrink
    title={
      title ??
      (syncStatus === null
        ? t('Made before the CRM tracked what apps answer. Send it again to check that the app has it.')
        : undefined)
    }
  >
    {readSyncStatusLabel(syncStatus)}
  </Tag>
);
