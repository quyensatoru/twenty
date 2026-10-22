import { useState } from 'react';

import { type Occurrence } from '../../types/occurrence';
import { type MemberSummary } from '../../types/moments-records';
import { ictDateTimeToMillis } from '../../utils/moments-date.util';
import { describeOccurrence } from '../utils/format-occurrence.util';
import { CardPanel } from './card-panel';
import { ChatPanel } from './chat-panel';
import { Countdown } from './countdown';
import { HonoreeStrip } from './honoree-strip';
import { KIND_STYLES } from './kind-styles';
import { KindTag } from './kind-tag';
import { MemberAvatar } from './member-avatar';
import { MomentsButton } from './moments-button';
import { MOMENTS_TOKENS } from './moments-tokens';
import { OccasionSidePanel } from './occasion-side-panel';

type RoomViewProps = {
  occurrence: Occurrence;
  currentMember: MemberSummary | null;
  memberNames: Record<string, string>;
  memberCount: number;
  initialTab?: RoomTab;
  onBack: () => void;
};

export type RoomTab = 'chat' | 'card';

export const RoomView = ({ occurrence, currentMember, memberNames, memberCount, initialTab = 'chat', onBack }: RoomViewProps) => {
  const [tab, setTab] = useState<RoomTab>(initialTab);
  const style = KIND_STYLES[occurrence.kind];
  // Surprise mode: the honoree cannot open their own room before the day.
  const isSurprise = occurrence.memberId !== null && occurrence.daysLeft > 0;
  const isHiddenFromViewer = isSurprise && currentMember?.id === occurrence.memberId;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontFamily: MOMENTS_TOKENS.fontFamily, height: '100%', minHeight: 0 }}>
      <div style={{ alignItems: 'center', borderBottom: `1px solid ${MOMENTS_TOKENS.border}`, display: 'flex', flexWrap: 'wrap', gap: 24, padding: '20px 24px' }}>
        <div style={{ alignItems: 'center', display: 'flex', flex: '1 1 320px', gap: 14, minWidth: 0 }}>
          <MomentsButton variant="secondary" size="small" ariaLabel="Quay lại" onClick={onBack}>‹ Quay lại</MomentsButton>
          {occurrence.memberId === null ? (
            <span aria-hidden="true" style={{ alignItems: 'center', background: style.soft, borderRadius: '50%', color: style.text, display: 'flex', flex: 'none', fontSize: 14, fontWeight: 700, height: 52, justifyContent: 'center', width: 52 }}>
              {style.short}
            </span>
          ) : (
            <MemberAvatar name={occurrence.memberName ?? ''} seed={occurrence.memberId} size={52} />
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <KindTag kind={occurrence.kind} />
              {isSurprise && !isHiddenFromViewer ? (
                <span
                  title="Người được chúc không xem được phòng chat và thiệp cho tới đúng ngày."
                  style={{ background: '#FFF4D6', borderRadius: 10, color: '#7A5300', fontSize: 12, fontWeight: 500, padding: '2px 8px' }}
                >
                  Chế độ bất ngờ: {occurrence.memberName ?? 'người được chúc'} chưa thấy phòng này
                </span>
              ) : null}
            </div>
            <h1 style={{ color: MOMENTS_TOKENS.textPrimary, fontSize: 22, fontWeight: 600, margin: '6px 0 2px' }}>{occurrence.title}</h1>
            <div style={{ color: MOMENTS_TOKENS.textSecondary, fontSize: 13 }}>{describeOccurrence(occurrence)}</div>
          </div>
        </div>
        <div style={{ flex: '0 1 300px', minWidth: 260 }}>
          {occurrence.daysLeft === 0 ? (
            <div style={{ background: style.soft, borderRadius: 8, color: style.text, fontSize: 16, fontWeight: 600, padding: '16px 18px', textAlign: 'center' }}>
              Chính là hôm nay!
            </div>
          ) : (
            <Countdown targetMillis={ictDateTimeToMillis(occurrence.date, occurrence.startTime ?? '00:00')} tone="dark" />
          )}
        </div>
      </div>

      <HonoreeStrip occurrence={occurrence} memberNames={memberNames} />

      {isHiddenFromViewer ? (
        <div style={{ alignItems: 'center', display: 'flex', flex: 1, flexDirection: 'column', gap: 8, justifyContent: 'center', padding: 48, textAlign: 'center' }}>
          <div style={{ color: MOMENTS_TOKENS.textPrimary, fontFamily: MOMENTS_TOKENS.displayFontFamily, fontSize: 26 }}>Có gì đó đang được chuẩn bị...</div>
          <div style={{ color: MOMENTS_TOKENS.textSecondary, fontSize: 14, maxWidth: 420 }}>
            Đồng đội đang chuẩn bị bất ngờ cho bạn. Phòng này sẽ mở đúng ngày.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flex: 1, flexWrap: 'wrap', minHeight: 0 }}>
          <div style={{ display: 'flex', flex: '999 1 520px', flexDirection: 'column', minHeight: 0, minWidth: 0 }}>
            <div role="tablist" aria-label="Nội dung" style={{ borderBottom: `1px solid ${MOMENTS_TOKENS.border}`, display: 'flex', gap: 4, padding: '0 20px' }}>
              {(['chat', 'card'] as const).map((key) => {
                const isSelected = key === tab;

                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setTab(key)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      boxShadow: isSelected ? `inset 0 -2px 0 ${MOMENTS_TOKENS.textPrimary}` : 'none',
                      color: isSelected ? MOMENTS_TOKENS.textPrimary : MOMENTS_TOKENS.textSecondary,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: isSelected ? 600 : 400,
                      height: 40,
                      padding: '0 10px',
                    }}
                  >
                    {key === 'chat' ? 'Phòng chat' : 'Thiệp chung'}
                  </button>
                );
              })}
            </div>
            {tab === 'chat' ? (
              <ChatPanel occurrenceKey={occurrence.key} eventTitle={occurrence.title} currentMember={currentMember} memberNames={memberNames} />
            ) : (
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                <CardPanel occurrence={occurrence} currentMember={currentMember} />
              </div>
            )}
          </div>
          <div style={{ borderLeft: `1px solid ${MOMENTS_TOKENS.border}`, flex: '1 1 320px', maxWidth: 400, minWidth: 0, overflowY: 'auto' }}>
            <OccasionSidePanel
              occurrence={occurrence}
              currentMember={currentMember}
              memberNames={memberNames}
              memberCount={memberCount}
              onOpenCard={() => setTab('card')}
            />
          </div>
        </div>
      )}
    </div>
  );
};
