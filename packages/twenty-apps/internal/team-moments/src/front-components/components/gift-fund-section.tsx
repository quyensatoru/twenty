import { useState } from 'react';

import { type Occurrence } from '../../types/occurrence';
import { type MemberSummary, type OccasionPlanRow } from '../../types/moments-records';
import {
  buildVietQrImageUrl,
  formatVnd,
  formatVndShort,
  parseVndInput,
  sumContributions,
} from '../../utils/occasion-plan.util';
import { MomentsButton } from './moments-button';
import { MomentsTextField } from './moments-text-field';
import { MOMENTS_TOKENS } from './moments-tokens';
import { SideSection } from './side-section';

type GiftFundSectionProps = {
  occurrence: Occurrence;
  plan: OccasionPlanRow | null;
  currentMember: MemberSummary | null;
  onEditSettings: () => void;
  onContribute: (amount: number) => Promise<boolean>;
  onWithdraw: () => Promise<boolean>;
};

const removeDiacritics = (text: string): string =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');

export const GiftFundSection = ({ occurrence, plan, currentMember, onEditSettings, onContribute, onWithdraw }: GiftFundSectionProps) => {
  const [amountText, setAmountText] = useState('');
  const [amountKey, setAmountKey] = useState(0);
  const [isShowingQr, setIsShowingQr] = useState(false);
  const [isShowingList, setIsShowingList] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contributions = plan?.contributions ?? [];
  const total = sumContributions(contributions);
  const goal = plan?.giftGoal ?? null;
  const progress = goal !== null && goal > 0 ? Math.min(1, total / goal) : null;
  const myContribution = currentMember === null ? undefined : contributions.find((contribution) => contribution.memberId === currentMember.id);
  const hasBank = (plan?.bankCode ?? '').length > 0 && (plan?.accountNumber ?? '').length > 0;
  const parsedAmount = parseVndInput(amountText);
  // Bank transfer notes are safest without diacritics.
  const transferNote = removeDiacritics(`${currentMember?.name ?? ''} gop qua ${occurrence.title}`);

  const contribute = async () => {
    if (parsedAmount === null) {
      setError('Nhập số tiền, ví dụ 100k.');

      return;
    }

    if (await onContribute(parsedAmount)) {
      setAmountText('');
      setAmountKey((current) => current + 1);
      setError(null);
    }
  };

  if (plan === null || (goal === null && !hasBank && contributions.length === 0)) {
    return (
      <SideSection title="Quỹ quà tặng">
        <span style={{ color: MOMENTS_TOKENS.textSecondary, fontSize: 13, lineHeight: 1.5 }}>
          Chưa có quỹ. Đặt mục tiêu và tài khoản nhận để mọi người góp qua mã QR.
        </span>
        <div>
          <MomentsButton variant="secondary" onClick={onEditSettings}>Mở quỹ quà</MomentsButton>
        </div>
      </SideSection>
    );
  }

  return (
    <SideSection
      title="Quỹ quà tặng"
      aside={
        <button type="button" onClick={onEditSettings} style={{ background: 'transparent', border: 'none', color: MOMENTS_TOKENS.accent, cursor: 'pointer', fontSize: 12, padding: 0 }}>
          Sửa
        </button>
      }
    >
      <div style={{ alignItems: 'baseline', display: 'flex', gap: 6 }}>
        <span style={{ color: MOMENTS_TOKENS.textPrimary, fontSize: 18, fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{formatVnd(total)}</span>
        {goal === null ? null : <span style={{ color: MOMENTS_TOKENS.textSecondary, fontSize: 13 }}>/ {formatVndShort(goal)}</span>}
      </div>
      {progress === null ? null : (
        <div style={{ background: MOMENTS_TOKENS.backgroundTertiary, borderRadius: 4, height: 8 }}>
          <div style={{ background: '#F76B15', borderRadius: 4, height: 8, width: `${Math.round(progress * 100)}%` }} />
        </div>
      )}
      <span style={{ color: MOMENTS_TOKENS.textSecondary, fontSize: 12 }}>
        {plan.giftIdea ? `Quà dự kiến: ${plan.giftIdea} · ` : ''}
        {contributions.length} người đã góp
      </span>

      {myContribution === undefined ? null : (
        <div style={{ alignItems: 'center', background: '#E9F7EF', borderRadius: 6, color: '#1A5C38', display: 'flex', fontSize: 12, gap: 8, padding: '6px 10px' }}>
          Bạn đã góp {formatVnd(myContribution.amount)}
          <button type="button" onClick={() => void onWithdraw()} style={{ background: 'transparent', border: 'none', color: '#1A5C38', cursor: 'pointer', fontSize: 12, marginLeft: 'auto', textDecoration: 'underline' }}>
            Huỷ
          </button>
        </div>
      )}

      {hasBank ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <MomentsButton variant="secondary" onClick={() => setIsShowingQr(!isShowingQr)}>{isShowingQr ? 'Ẩn mã QR' : 'Chuyển khoản qua QR'}</MomentsButton>
          {isShowingQr ? (
            <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <img
                alt="Mã QR chuyển khoản"
                src={buildVietQrImageUrl({
                  bankCode: plan.bankCode ?? '',
                  accountNumber: plan.accountNumber ?? '',
                  accountName: plan.accountName,
                  amount: parsedAmount,
                  note: transferNote,
                })}
                style={{ background: '#ffffff', borderRadius: 8, maxWidth: 240, width: '100%' }}
              />
              <span style={{ color: MOMENTS_TOKENS.textSecondary, fontSize: 12, textAlign: 'center' }}>
                {plan.bankCode} · {plan.accountNumber}{plan.accountName ? ` · ${plan.accountName}` : ''}
                <br />
                Nhập số tiền bên dưới để QR điền sẵn.
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: 6 }}>
        <div style={{ flex: 1 }}>
          <MomentsTextField key={amountKey} ariaLabel="Số tiền góp" value={amountText} onChange={setAmountText} onEnter={() => void contribute()} placeholder="Số tiền, ví dụ 100k" />
        </div>
        <MomentsButton variant="dark" isDisabled={currentMember === null} onClick={() => void contribute()}>
          {myContribution === undefined ? 'Tôi đã góp' : 'Cập nhật'}
        </MomentsButton>
      </div>
      {error === null ? null : <span style={{ color: MOMENTS_TOKENS.danger, fontSize: 12 }}>{error}</span>}

      {contributions.length === 0 ? null : (
        <>
          <button type="button" onClick={() => setIsShowingList(!isShowingList)} style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', color: MOMENTS_TOKENS.accent, cursor: 'pointer', fontSize: 12, padding: 0 }}>
            {isShowingList ? 'Ẩn danh sách' : 'Xem ai đã góp'}
          </button>
          {isShowingList ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {contributions.map((contribution) => (
                <div key={contribution.memberId} style={{ color: MOMENTS_TOKENS.textPrimary, display: 'flex', fontSize: 12 }}>
                  <span>{contribution.name}</span>
                  <span style={{ color: MOMENTS_TOKENS.textSecondary, fontVariantNumeric: 'tabular-nums', marginLeft: 'auto' }}>{formatVnd(contribution.amount)}</span>
                </div>
              ))}
            </div>
          ) : null}
        </>
      )}
    </SideSection>
  );
};
