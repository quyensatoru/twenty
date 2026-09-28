import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';

import { ShiftButton } from './shift-button';
import { ShiftField } from './shift-field';
import { ShiftModal } from './shift-modal';
import { ShiftTextArea } from './shift-text-area';

type CheckOutModalProps = {
  shiftName: string;
  onConfirm: (handoverNote: string | null) => Promise<void>;
  onClose: () => void;
};

export const CheckOutModal = ({
  shiftName,
  onConfirm,
  onClose,
}: CheckOutModalProps) => {
  const [handoverNote, setHandoverNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(handoverNote.trim() === '' ? null : handoverNote.trim());
      onClose();
    } catch {
      // The page handler already surfaced the error snackbar; keep the modal
      // open with the typed handover note intact so the member can retry.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ShiftModal
      title={t('Check out')}
      subtitle={shiftName}
      onClose={onClose}
      footer={
        <>
          <ShiftButton onClick={onClose} isDisabled={isSubmitting}>
            {t('Cancel')}
          </ShiftButton>
          <ShiftButton
            variant="primary"
            onClick={() => void handleConfirm()}
            isDisabled={isSubmitting}
          >
            {t('Confirm check out')}
          </ShiftButton>
        </>
      }
    >
      <ShiftField label={t('Handover note — pending conversations')}>
        <ShiftTextArea
          value={handoverNote}
          onChange={setHandoverNote}
          rows={4}
          ariaLabel={t('Handover note — pending conversations')}
          placeholder={t(
            'Anything the next shift should pick up? (optional)',
          )}
        />
      </ShiftField>
    </ShiftModal>
  );
};
