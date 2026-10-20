import { type Occurrence } from '../../types/occurrence';
import { formatLongDate } from '../utils/format-occurrence.util';
import { MomentsButton } from './moments-button';
import { MOMENTS_TOKENS } from './moments-tokens';

type TodayHeroProps = {
  todayIso: string;
  occurrences: Occurrence[];
  onOpen: (occurrence: Occurrence) => void;
};

const PETAL_ANGLES = [0, 72, 144, 216, 288];

export const TodayHero = ({ todayIso, occurrences, onOpen }: TodayHeroProps) => {
  const [first] = occurrences;
  const title = occurrences.length === 1 ? first.title : `Hôm nay có ${occurrences.length} dịp đặc biệt`;

  return (
    <div
      style={{
        background: '#6E1A42',
        borderRadius: 12,
        color: '#FFF5F8',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: MOMENTS_TOKENS.fontFamily,
        gap: 10,
        minHeight: 220,
        overflow: 'hidden',
        padding: '24px 24px 22px',
        position: 'relative',
      }}
    >
      <svg width="230" height="230" viewBox="0 0 200 200" aria-hidden="true" style={{ position: 'absolute', right: -40, top: -30 }}>
        <g fill="none" stroke="#F7A8C8" strokeWidth="1.4">
          {PETAL_ANGLES.map((angle) => (
            <ellipse key={angle} cx="100" cy="62" rx="20" ry="38" transform={`rotate(${angle} 100 100)`} />
          ))}
        </g>
        <circle cx="100" cy="100" r="10" fill="#F7A8C8" />
      </svg>
      <div style={{ alignItems: 'center', display: 'flex', fontSize: 12, fontWeight: 600, gap: 8, letterSpacing: '0.06em', position: 'relative' }}>
        <span style={{ background: '#FFF5F8', borderRadius: 10, color: '#6E1A42', padding: '2px 8px' }}>HÔM NAY</span>
        <span style={{ opacity: 0.85 }}>{formatLongDate(todayIso)}</span>
      </div>
      <h2 style={{ fontFamily: MOMENTS_TOKENS.displayFontFamily, fontSize: 32, fontWeight: 600, lineHeight: 1.15, margin: '4px 0 0', maxWidth: 420, position: 'relative' }}>
        {title}
      </h2>
      <div style={{ color: '#F9D3E2', display: 'flex', flexDirection: 'column', gap: 4, position: 'relative' }}>
        {occurrences.length > 1
          ? occurrences.map((occurrence) => <span key={occurrence.key}>{occurrence.title}</span>)
          : <span>Dành một phút gửi lời chúc và ký thiệp chung nhé.</span>}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 'auto', position: 'relative' }}>
        {occurrences.slice(0, 3).map((occurrence) => (
          <MomentsButton key={occurrence.key} variant="hero" onClick={() => onOpen(occurrence)}>
            {occurrences.length > 1 ? `Vào phòng: ${occurrence.title}` : 'Vào phòng chúc mừng'}
          </MomentsButton>
        ))}
      </div>
    </div>
  );
};
