import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';

import { MIN_CANCEL_REASON_LENGTH } from '../../utils/validate-attendance-action.util';
import { ShiftButton } from './shift-button';
import { ShiftField } from './shift-field';
import { ShiftModal } from './shift-modal';
import { ShiftSelect } from './shift-select';
import { ShiftTextArea } from './shift-text-area';
import { SHIFT_TOKENS } from './shift-tokens';

// Values must match the route's CANCEL_CATEGORIES.
type CancelCategory = 'SICK' | 'PERSONAL' | 'SWAP' | 'OTHER';

type CancelShiftModalProps = {
  shiftName: string;
  isInProgress: boolean;
  onConfirm: (reason: string, category: string) => Promise<void>;
  onClose: () => void;
};

export const CancelShiftModal = ({
  shiftName,
  isInProgress,
  onConfirm,
  onClose,
}: CancelShiftModalProps) => {
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState<CancelCategory>('SICK');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoryOptions: { value: CancelCategory; label: string }[] = [
    { value: 'SICK', label: t('Sick leave') },
    { value: 'PERSONAL', label: t('Personal') },
    { value: 'SWAP', label: t('Shift swap') },
    { value: 'OTHER', label: t('Other') },
  ];

  const trimmedLength = reason.trim().length;
  const isReasonValid = trimmedLength >= MIN_CANCEL_REASON_LENGTH;

  const handleConfirm = async () => {
    if (!isReasonValid) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(reason.trim(), category);
      onClose();
    } catch {
      // The page handler already surfaced the error snackbar; keep the modal
      // open with the typed reason and category intact so the member can retry.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ShiftModal
      title={t('Cancel shift')}
      subtitle={shiftName}
      onClose={onClose}
      footer={
        <>
          <ShiftButton onClick={onClose} isDisabled={isSubmitting}>
            {t('Keep shift')}
          </ShiftButton>
          <ShiftButton
            variant="danger"
            onClick={() => void handleConfirm()}
            isDisabled={isSubmitting || !isReasonValid}
          >
            {t('Cancel shift')}
          </ShiftButton>
        </>
      }
    >
      {isInProgress ? (
        <p
          style={{
            color: SHIFT_TOKENS.red,
            fontSize: 13,
            fontWeight: 500,
            margin: 0,
          }}
        >
          {t('This shift is in progress.')}
        </p>
      ) : null}
      <ShiftField label={t('Reason')}>
        <ShiftTextArea
          value={reason}
          onChange={setReason}
          rows={4}
          ariaLabel={t('Reason')}
          placeholder={t(
            'Explain why this shift is being cancelled (min 10 characters)',
          )}
        />
        <span
          style={{
            color: isReasonValid
              ? SHIFT_TOKENS.textTertiary
              : SHIFT_TOKENS.red,
            fontSize: 11,
            textAlign: 'right',
          }}
        >
          {`${trimmedLength}/${MIN_CANCEL_REASON_LENGTH}`}
        </span>
      </ShiftField>
      <ShiftField label={t('Category')}>
        <ShiftSelect
          value={category}
          options={categoryOptions}
          onChange={setCategory}
          ariaLabel={t('Category')}
        />
      </ShiftField>
    </ShiftModal>
  );
};
