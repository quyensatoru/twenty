import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Button, type SelectOption } from 'twenty-ui/primitives/input';
import { Dialog } from 'twenty-ui/primitives/surfaces';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { Select } from '@/ui/input/components/Select';
import { TextArea } from '@/ui/input/components/TextArea';
import { DialogInstance } from '@/ui/layout/dialog/components/DialogInstance';
import { useDialog } from '@/ui/layout/dialog/hooks/useDialog';

const MIN_REASON_LENGTH = 10;

// Values must match the server CANCEL_CATEGORIES = ['SICK','PERSONAL','SWAP','OTHER'].
type CancelCategory = 'SICK' | 'PERSONAL' | 'SWAP' | 'OTHER';

const StyledContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing['4']};
`;

const StyledSubtitle = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.md};
  margin: 0;
`;

const StyledWarning = styled.p`
  color: ${themeCssVariables.color.red};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  margin: 0;
`;

const StyledField = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing['1']};
`;

const StyledCounter = styled.span<{ isValid: boolean }>`
  color: ${({ isValid }) =>
    isValid
      ? themeCssVariables.font.color.tertiary
      : themeCssVariables.color.red};
  font-size: ${themeCssVariables.font.size.xs};
  text-align: right;
`;

const StyledFooter = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing['2']};
  justify-content: flex-end;
`;

type CancelShiftModalProps = {
  modalInstanceId: string;
  shiftName: string;
  isInProgress: boolean;
  onConfirm: (reason: string, category: string) => Promise<void>;
};

export const CancelShiftModal = ({
  modalInstanceId,
  shiftName,
  isInProgress,
  onConfirm,
}: CancelShiftModalProps) => {
  const { t } = useLingui();
  const { closeDialog } = useDialog();
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState<CancelCategory>('SICK');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoryOptions: SelectOption<CancelCategory>[] = [
    { value: 'SICK', label: t`Sick leave` },
    { value: 'PERSONAL', label: t`Personal` },
    { value: 'SWAP', label: t`Shift swap` },
    { value: 'OTHER', label: t`Other` },
  ];

  const trimmedLength = reason.trim().length;
  const isReasonValid = trimmedLength >= MIN_REASON_LENGTH;

  const resetAndClose = () => {
    setReason('');
    setCategory('SICK');
    closeDialog(modalInstanceId);
  };

  const handleConfirm = async () => {
    if (!isReasonValid) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(reason.trim(), category);
      resetAndClose();
    } catch {
      // The page handler already surfaced the error snackbar; keep the modal
      // open with the typed reason and category intact so the member can retry.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogInstance
      dialogId={modalInstanceId}
      dismissible
      onClose={resetAndClose}
      renderInDocumentBody
    >
      {({ container, backdrop, viewportProps, onKeyDown }) => (
        <Dialog.Popup
          {...{ container, backdrop, viewportProps, onKeyDown }}
          size="md"
          data-globally-prevent-click-outside
          style={{
            padding: 'var(--t-spacing-6)',
            borderRadius: 'var(--t-spacing-1)',
          }}
        >
          <StyledContent>
            <Dialog.Title>{t`Cancel shift`}</Dialog.Title>
            <StyledSubtitle>{shiftName}</StyledSubtitle>
            {isInProgress && (
              <StyledWarning>{t`This shift is in progress.`}</StyledWarning>
            )}
            <StyledField>
              <TextArea
                textAreaId={`${modalInstanceId}-reason`}
                label={t`Reason`}
                placeholder={t`Explain why this shift is being cancelled (min ${MIN_REASON_LENGTH} characters)`}
                value={reason}
                onChange={setReason}
                minRows={3}
                maxRows={8}
              />
              <StyledCounter isValid={isReasonValid}>
                {trimmedLength}/{MIN_REASON_LENGTH}
              </StyledCounter>
            </StyledField>
            <Select
              dropdownId={`${modalInstanceId}-category`}
              label={t`Category`}
              options={categoryOptions}
              value={category}
              onChange={setCategory}
              fullWidth
            />
            <StyledFooter>
              <Button
                variant="outline"
                onClick={resetAndClose}
                disabled={isSubmitting}
              >
                {t`Keep shift`}
              </Button>
              <Button
                variant="solid"
                color="danger"
                onClick={handleConfirm}
                disabled={isSubmitting || !isReasonValid}
              >
                {t`Cancel shift`}
              </Button>
            </StyledFooter>
          </StyledContent>
        </Dialog.Popup>
      )}
    </DialogInstance>
  );
};
