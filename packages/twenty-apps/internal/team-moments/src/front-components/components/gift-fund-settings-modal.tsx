import { useState } from 'react';

import { type OccasionPlanRow } from '../../types/moments-records';
import { formatVnd, parseVndInput } from '../../utils/occasion-plan.util';
import { MomentsButton } from './moments-button';
import { MomentsField } from './moments-field';
import { MomentsModal } from './moments-modal';
import { MomentsTextField } from './moments-text-field';
import { MOMENTS_TOKENS } from './moments-tokens';

type GiftFundSettings = Pick<OccasionPlanRow, 'giftGoal' | 'giftIdea' | 'bankCode' | 'accountNumber' | 'accountName'>;

type GiftFundSettingsModalProps = {
  plan: OccasionPlanRow | null;
  onClose: () => void;
  onSave: (settings: GiftFundSettings) => Promise<boolean>;
};

export const GiftFundSettingsModal = ({ plan, onClose, onSave }: GiftFundSettingsModalProps) => {
  const [goal, setGoal] = useState(plan?.giftGoal ? formatVnd(plan.giftGoal) : '');
  const [giftIdea, setGiftIdea] = useState(plan?.giftIdea ?? '');
  const [bankCode, setBankCode] = useState(plan?.bankCode ?? '');
  const [accountNumber, setAccountNumber] = useState(plan?.accountNumber ?? '');
  const [accountName, setAccountName] = useState(plan?.accountName ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    const giftGoal = goal.trim().length === 0 ? null : parseVndInput(goal);

    if (goal.trim().length > 0 && giftGoal === null) {
      setError('Mục tiêu nhập dạng 1000000, 1tr hoặc 500k.');

      return;
    }

    if ((bankCode.trim().length > 0) !== (accountNumber.trim().length > 0)) {
      setError('Cần cả ngân hàng và số tài khoản để tạo mã QR.');

      return;
    }

    setIsSaving(true);

    const isSaved = await onSave({
      giftGoal,
      giftIdea: giftIdea.trim() || null,
      bankCode: bankCode.trim().toUpperCase() || null,
      accountNumber: accountNumber.replace(/\s+/g, '') || null,
      accountName: accountName.trim() || null,
    });

    setIsSaving(false);

    if (isSaved) {
      onClose();
    }
  };

  return (
    <MomentsModal
      title="Quỹ quà tặng"
      onClose={onClose}
      footer={
        <>
          <MomentsButton variant="secondary" onClick={onClose}>Huỷ</MomentsButton>
          <MomentsButton variant="primary" isDisabled={isSaving} onClick={() => void save()}>Lưu</MomentsButton>
        </>
      }
    >
      {error === null ? null : <span style={{ color: MOMENTS_TOKENS.danger, fontSize: 12 }}>{error}</span>}
      <MomentsField label="Mục tiêu" hint="Ví dụ 1tr, 500k hoặc 1000000">
        <MomentsTextField ariaLabel="Mục tiêu quỹ" value={goal} onChange={setGoal} />
      </MomentsField>
      <MomentsField label="Món quà dự kiến">
        <MomentsTextField ariaLabel="Món quà dự kiến" value={giftIdea} onChange={setGiftIdea} placeholder="Tai nghe, bánh kem, hoa..." />
      </MomentsField>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '120px minmax(0, 1fr)' }}>
        <MomentsField label="Ngân hàng" hint="Mã VietQR: VCB, TCB, MB...">
          <MomentsTextField ariaLabel="Ngân hàng" value={bankCode} onChange={setBankCode} />
        </MomentsField>
        <MomentsField label="Số tài khoản">
          <MomentsTextField ariaLabel="Số tài khoản" value={accountNumber} onChange={setAccountNumber} />
        </MomentsField>
      </div>
      <MomentsField label="Chủ tài khoản">
        <MomentsTextField ariaLabel="Chủ tài khoản" value={accountName} onChange={setAccountName} />
      </MomentsField>
    </MomentsModal>
  );
};
