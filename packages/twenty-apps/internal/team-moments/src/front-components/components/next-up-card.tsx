import { type Occurrence } from '../../types/occurrence';
import { ictDateTimeToMillis } from '../../utils/moments-date.util';
import { describeOccurrence } from '../utils/format-occurrence.util';
import { Countdown } from './countdown';
import { KIND_STYLES } from './kind-styles';
import { KindTag } from './kind-tag';
import { MemberAvatar } from './member-avatar';
import { MomentsButton } from './moments-button';
import { MOMENTS_TOKENS } from './moments-tokens';

type NextUpCardProps = {
  occurrence: Occurrence | null;
  onOpen: (occurrence: Occurrence) => void;
};

export const NextUpCard = ({ occurrence, onOpen }: NextUpCardProps) => (
  <div style={{ background: MOMENTS_TOKENS.background, borderRadius: 12, boxShadow: `0 0 0 1px ${MOMENTS_TOKENS.border}`, display: 'flex', flexDirection: 'column', fontFamily: MOMENTS_TOKENS.fontFamily, gap: 14, padding: '20px 24px' }}>
    <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
      <span style={{ color: MOMENTS_TOKENS.textTertiary, fontSize: 12, fontWeight: 600, letterSpacing: '0.06em' }}>SỰ KIỆN TIẾP THEO</span>
      {occurrence === null ? null : <span style={{ marginLeft: 'auto' }}><KindTag kind={occurrence.kind} /></span>}
    </div>
    {occurrence === null ? (
      <div style={{ color: MOMENTS_TOKENS.textSecondary, fontSize: 13, lineHeight: 1.5 }}>
        Chưa có sự kiện nào sắp tới. Thêm ngày sinh, ngày vào làm ở tab Thành viên hoặc tạo một sự kiện mới.
      </div>
    ) : (
      <>
        <div style={{ alignItems: 'center', display: 'flex', gap: 12 }}>
          {occurrence.memberId === null ? (
            <span aria-hidden="true" style={{ alignItems: 'center', background: KIND_STYLES[occurrence.kind].soft, borderRadius: '50%', color: KIND_STYLES[occurrence.kind].text, display: 'flex', fontSize: 13, fontWeight: 700, height: 44, justifyContent: 'center', width: 44 }}>
              {KIND_STYLES[occurrence.kind].short}
            </span>
          ) : (
            <MemberAvatar name={occurrence.memberName ?? ''} seed={occurrence.memberId} size={44} />
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ color: MOMENTS_TOKENS.textPrimary, fontSize: 18, fontWeight: 600 }}>{occurrence.title}</div>
            <div style={{ color: MOMENTS_TOKENS.textSecondary, fontSize: 13, marginTop: 2 }}>{describeOccurrence(occurrence)}</div>
          </div>
        </div>
        <Countdown targetMillis={ictDateTimeToMillis(occurrence.date, occurrence.startTime ?? '00:00')} size="large" />
        <div>
          <MomentsButton variant="dark" onClick={() => onOpen(occurrence)}>Mở phòng chúc mừng</MomentsButton>
        </div>
      </>
    )}
  </div>
);
