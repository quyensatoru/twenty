import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconLock } from 'twenty-ui/icon';

import { type ShiftTemplateRow } from '../../types/shift-template-row';
import { type ShiftDayRegistrationResult } from '../utils/register-shifts.util';
import { ShiftButton } from './shift-button';
import { ShiftCheckbox } from './shift-checkbox';
import { ShiftCodeChip } from './shift-code-chip';
import { ShiftModal } from './shift-modal';
import { SHIFT_TOKENS } from './shift-tokens';

type ShiftRegisterDayModalProps = {
  dayLabel: string;
  templates: ShiftTemplateRow[];
  registeredTemplateIds: Set<string>;
  isRegistering: boolean;
  onRegister: (templateIds: string[]) => Promise<ShiftDayRegistrationResult>;
  onClose: () => void;
};

export const ShiftRegisterDayModal = ({
  dayLabel,
  templates,
  registeredTemplateIds,
  isRegistering,
  onRegister,
  onClose,
}: ShiftRegisterDayModalProps) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [errorByTemplateId, setErrorByTemplateId] = useState<
    Record<string, string>
  >({});

  const toggleTemplate = (templateId: string) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);

      if (next.has(templateId)) {
        next.delete(templateId);
      } else {
        next.add(templateId);
      }

      return next;
    });
  };

  const handleConfirm = async () => {
    const templateIds = [...selectedIds];

    if (templateIds.length === 0) {
      return;
    }

    const { errors } = await onRegister(templateIds);

    if (errors.length === 0) {
      onClose();

      return;
    }

    // Keep the modal open with only the failed templates still checked, so a
    // retry is one click away; surface each rejection inline.
    const nextErrorByTemplateId: Record<string, string> = {};
    const failedIds = new Set<string>();

    for (const error of errors) {
      nextErrorByTemplateId[error.templateId] = error.message;
      failedIds.add(error.templateId);
    }

    setErrorByTemplateId(nextErrorByTemplateId);
    setSelectedIds(failedIds);
  };

  const selectedCount = selectedIds.size;

  return (
    <ShiftModal
      title={t('Register shifts')}
      subtitle={dayLabel}
      onClose={onClose}
      footer={
        <>
          <ShiftButton onClick={onClose} isDisabled={isRegistering}>
            {t('Close')}
          </ShiftButton>
          <ShiftButton
            variant="primary"
            onClick={() => void handleConfirm()}
            isDisabled={selectedCount === 0 || isRegistering}
          >
            {t('Register {count} shift(s)', { count: selectedCount })}
          </ShiftButton>
        </>
      }
    >
      {templates.length === 0 ? (
        <p
          style={{
            color: SHIFT_TOKENS.textTertiary,
            fontSize: 13,
            margin: 0,
          }}
        >
          {t('No shifts available for this day.')}
        </p>
      ) : (
        templates.map((template) => {
          const isRegistered = registeredTemplateIds.has(template.id);
          const isChecked = isRegistered || selectedIds.has(template.id);
          const templateError = errorByTemplateId[template.id];

          return (
            <div
              key={template.id}
              style={{
                alignItems: 'center',
                border: `1px solid ${SHIFT_TOKENS.borderLight}`,
                borderRadius: SHIFT_TOKENS.radius,
                display: 'flex',
                gap: 12,
                opacity: isRegistered ? 0.7 : 1,
                padding: '8px 12px',
              }}
            >
              <ShiftCheckbox
                checked={isChecked}
                isDisabled={isRegistered}
                ariaLabel={t('Register {code}', { code: template.code })}
                onChange={() => toggleTemplate(template.id)}
              />
              <div
                style={{
                  display: 'flex',
                  flex: 1,
                  flexDirection: 'column',
                  gap: 4,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    alignItems: 'center',
                    color: SHIFT_TOKENS.textPrimary,
                    display: 'flex',
                    fontSize: 13,
                    fontWeight: 500,
                    gap: 8,
                  }}
                >
                  <ShiftCodeChip
                    code={template.code}
                    color={template.color}
                  />
                  {template.name}
                </div>
                <span
                  style={{ color: SHIFT_TOKENS.textTertiary, fontSize: 11 }}
                >
                  {`${template.startTime} – ${template.endTime}`}
                </span>
                {templateError === undefined ? null : (
                  <span
                    style={{
                      border: `1px solid ${SHIFT_TOKENS.red}`,
                      borderRadius: SHIFT_TOKENS.radius,
                      color: SHIFT_TOKENS.textSecondary,
                      fontSize: 12,
                      padding: '4px 8px',
                    }}
                  >
                    {templateError}
                  </span>
                )}
              </div>
              {isRegistered ? (
                <span
                  style={{
                    alignItems: 'center',
                    color: SHIFT_TOKENS.textTertiary,
                    display: 'inline-flex',
                    fontSize: 11,
                    gap: 4,
                  }}
                >
                  <IconLock size={12} />
                  {t('Registered')}
                </span>
              ) : null}
            </div>
          );
        })
      )}
    </ShiftModal>
  );
};
