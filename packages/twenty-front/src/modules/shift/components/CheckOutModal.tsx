import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Button } from 'twenty-ui/primitives/input';
import { Dialog } from 'twenty-ui/primitives/surfaces';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { TextArea } from '@/ui/input/components/TextArea';
import { DialogInstance } from '@/ui/layout/dialog/components/DialogInstance';
import { useDialog } from '@/ui/layout/dialog/hooks/useDialog';

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

const StyledFooter = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing['2']};
  justify-content: flex-end;
`;

type CheckOutModalProps = {
  modalInstanceId: string;
  shiftName: string;
  onConfirm: (handoverNote: string | null) => Promise<void>;
};

export const CheckOutModal = ({
  modalInstanceId,
  shiftName,
  onConfirm,
}: CheckOutModalProps) => {
  const { t } = useLingui();
  const { closeDialog } = useDialog();
  const [handoverNote, setHandoverNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetAndClose = () => {
    setHandoverNote('');
    closeDialog(modalInstanceId);
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(handoverNote.trim() === '' ? null : handoverNote.trim());
      resetAndClose();
    } catch {
      // The page handler already surfaced the error snackbar; keep the modal
      // open with the typed handover note intact so the member can retry.
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
            <Dialog.Title>{t`Check out`}</Dialog.Title>
            <StyledSubtitle>{shiftName}</StyledSubtitle>
            <TextArea
              textAreaId={`${modalInstanceId}-handover-note`}
              label={t`Handover note — pending conversations`}
              placeholder={t`Anything the next shift should pick up? (optional)`}
              value={handoverNote}
              onChange={setHandoverNote}
              minRows={3}
              maxRows={8}
            />
            <StyledFooter>
              <Button
                variant="outline"
                onClick={resetAndClose}
                disabled={isSubmitting}
              >
                {t`Cancel`}
              </Button>
              <Button
                variant="solid"
                color="accent"
                onClick={handleConfirm}
                disabled={isSubmitting}
              >
                {t`Confirm check out`}
              </Button>
            </StyledFooter>
          </StyledContent>
        </Dialog.Popup>
      )}
    </DialogInstance>
  );
};
