import { useState } from 'react';

import { type Occurrence } from '../../types/occurrence';
import { parseIsoDate } from '../../utils/moments-date.util';
import { describeOccurrence, formatDaysLeft } from '../utils/format-occurrence.util';
import { KIND_STYLES } from './kind-styles';
import { KindTag } from './kind-tag';
import { MemberAvatar } from './member-avatar';
import { MOMENTS_TOKENS } from './moments-tokens';

type OccurrenceRowProps = {
  occurrence: Occurrence;
  onOpen: () => void;
};

export const OccurrenceRow = ({ occurrence, onOpen }: OccurrenceRowProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const date = parseIsoDate(occurrence.date);
  const style = KIND_STYLES[occurrence.kind];

  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        alignItems: 'center',
        background: isHovered ? MOMENTS_TOKENS.backgroundHover : MOMENTS_TOKENS.background,
        border: 'none',
        borderBottom: `1px solid ${MOMENTS_TOKENS.borderLight}`,
        color: MOMENTS_TOKENS.textPrimary,
        cursor: 'pointer',
        display: 'flex',
        fontFamily: MOMENTS_TOKENS.fontFamily,
        gap: 14,
        padding: '12px 14px',
        textAlign: 'left',
        width: '100%',
      }}
    >
      <div style={{ borderRadius: 6, boxShadow: `0 0 0 1px ${MOMENTS_TOKENS.border}`, flex: 'none', overflow: 'hidden', textAlign: 'center', width: 44 }}>
        <div style={{ background: style.solid, color: '#ffffff', fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', padding: '2px 0' }}>
          TH {date?.month ?? ''}
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, padding: '3px 0 4px' }}>{String(date?.day ?? '').padStart(2, '0')}</div>
      </div>
      {occurrence.memberId === null ? (
        <span aria-hidden="true" style={{ alignItems: 'center', background: style.soft, borderRadius: '50%', color: style.text, display: 'flex', flex: 'none', fontSize: 11, fontWeight: 700, height: 32, justifyContent: 'center', width: 32 }}>
          {style.short}
        </span>
      ) : (
        <MemberAvatar name={occurrence.memberName ?? ''} seed={occurrence.memberId} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{occurrence.title}</div>
        <div style={{ color: MOMENTS_TOKENS.textSecondary, fontSize: 13, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {describeOccurrence(occurrence)}
        </div>
      </div>
      <KindTag kind={occurrence.kind} />
      <span style={{ color: occurrence.daysLeft === 0 ? style.text : MOMENTS_TOKENS.textPrimary, fontSize: 13, fontVariantNumeric: 'tabular-nums', fontWeight: 600, textAlign: 'right', width: 92 }}>
        {formatDaysLeft(occurrence.daysLeft)}
      </span>
    </button>
  );
};
