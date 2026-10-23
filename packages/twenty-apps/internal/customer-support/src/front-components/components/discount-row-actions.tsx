import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import {
  IconCopyPlus,
  IconPencil,
  IconRefresh,
  IconTrash,
} from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';

import { type DiscountListItem } from '../../types/discount';
import { spacing } from './discount-theme';

export type DiscountActionHandlers = {
  onResend: (discount: DiscountListItem) => void;
  onEdit: (discount: DiscountListItem) => void;
  onDuplicate: (discount: DiscountListItem) => void;
  onDelete: (discount: DiscountListItem) => Promise<void>;
};

type DiscountRowActionsProps = DiscountActionHandlers & {
  discount: DiscountListItem;
  isResending: boolean;
  // Icons only in table rows, labelled buttons in the side panel.
  isCompact: boolean;
};

const needsResend = (discount: DiscountListItem): boolean =>
  discount.syncStatus === 'REJECTED' ||
  discount.syncStatus === 'FAILED' ||
  discount.syncStatus === 'NOT_CONNECTED';

export const DiscountRowActions = ({
  discount,
  isResending,
  isCompact,
  onResend,
  onEdit,
  onDuplicate,
  onDelete,
}: DiscountRowActionsProps) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const label = (text: string) => (isCompact ? undefined : text);

  if (isConfirmingDelete) {
    return (
      <span style={{ alignItems: 'center', display: 'inline-flex', gap: spacing(1) }}>
        <Button variant="ghost" color="neutral" size="sm" onClick={() => setIsConfirmingDelete(false)}>
          {t('Keep')}
        </Button>
        <Button
          variant="solid"
          color="danger"
          size="sm"
          startIcon={<IconTrash size={14} />}
          onClick={() => {
            void onDelete(discount).finally(() => setIsConfirmingDelete(false));
          }}
        >
          {t('Delete')}
        </Button>
      </span>
    );
  }

  const isProblem = needsResend(discount);

  return (
    <span style={{ alignItems: 'center', display: 'inline-flex', gap: spacing(0.5) }}>
      {discount.syncStatus !== 'DRAFT' && (
        <Button
          variant={isProblem ? 'soft' : 'ghost'}
          color={isProblem ? 'accent' : 'neutral'}
          size="sm"
          aria-label={t('Send again')}
          title={t('Send again')}
          startIcon={<IconRefresh size={14} />}
          loading={isResending}
          disabled={isResending}
          onClick={() => onResend(discount)}
        >
          {label(t('Send again'))}
        </Button>
      )}
      <Button
        variant="ghost"
        color="neutral"
        size="sm"
        aria-label={t('Edit')}
        title={t('Edit')}
        startIcon={<IconPencil size={14} />}
        onClick={() => onEdit(discount)}
      >
        {label(t('Edit'))}
      </Button>
      <Button
        variant="ghost"
        color="neutral"
        size="sm"
        aria-label={t('Duplicate')}
        title={t('Duplicate')}
        startIcon={<IconCopyPlus size={14} />}
        onClick={() => onDuplicate(discount)}
      >
        {label(t('Duplicate'))}
      </Button>
      <Button
        variant="ghost"
        color="danger"
        size="sm"
        aria-label={t('Delete')}
        title={t('Delete')}
        startIcon={<IconTrash size={14} />}
        onClick={() => setIsConfirmingDelete(true)}
      >
        {label(t('Delete'))}
      </Button>
    </span>
  );
};
