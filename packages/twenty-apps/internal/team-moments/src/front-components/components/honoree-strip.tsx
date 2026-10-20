import { type Occurrence } from '../../types/occurrence';
import { MemberAvatar } from './member-avatar';
import { MOMENTS_TOKENS } from './moments-tokens';

type HonoreeStripProps = {
  occurrence: Occurrence;
  memberNames: Record<string, string>;
};

const VISIBLE_HONOREES = 12;

// For an occasion meant for a group (20/10, 8/3), who exactly is being
// celebrated, taken from each member's gender in their profile.
export const HonoreeStrip = ({ occurrence, memberNames }: HonoreeStripProps) => {
  if (occurrence.audience === 'EVERYONE') {
    return null;
  }

  const names = occurrence.honoreeIds.map((memberId) => ({ memberId, name: memberNames[memberId] ?? 'Thành viên' }));
  const group = occurrence.audience === 'WOMEN' ? 'chị em' : 'anh em';

  return (
    <div style={{ alignItems: 'center', borderBottom: `1px solid ${MOMENTS_TOKENS.border}`, display: 'flex', flexWrap: 'wrap', fontFamily: MOMENTS_TOKENS.fontFamily, gap: 10, padding: '12px 24px' }}>
      <span style={{ color: MOMENTS_TOKENS.textSecondary, fontSize: 13 }}>
        {names.length === 0
          ? `Chưa biết ai là ${group}. Khai giới tính ở tab Thành viên để app biết cần chúc ai.`
          : `Dành cho ${names.length} ${group}:`}
      </span>
      {names.slice(0, VISIBLE_HONOREES).map(({ memberId, name }) => (
        <span key={memberId} style={{ alignItems: 'center', background: MOMENTS_TOKENS.backgroundTertiary, borderRadius: 14, color: MOMENTS_TOKENS.textPrimary, display: 'inline-flex', fontSize: 12, gap: 6, padding: '2px 10px 2px 2px' }}>
          <MemberAvatar name={name} seed={memberId} size={22} />
          {name}
        </span>
      ))}
      {names.length > VISIBLE_HONOREES ? (
        <span style={{ color: MOMENTS_TOKENS.textSecondary, fontSize: 12 }}>+{names.length - VISIBLE_HONOREES}</span>
      ) : null}
    </div>
  );
};
