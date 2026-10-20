import { useState } from 'react';

import { type Occurrence } from '../../types/occurrence';
import { formatIsoDate, parseIsoDate } from '../../utils/moments-date.util';
import { KIND_ORDER, KIND_STYLES } from './kind-styles';
import { MOMENTS_TOKENS } from './moments-tokens';

type MonthCalendarProps = {
  todayIso: string;
  occurrences: Occurrence[];
};

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export const MonthCalendar = ({ todayIso, occurrences }: MonthCalendarProps) => {
  const today = parseIsoDate(todayIso);
  const [offset, setOffset] = useState(0);

  if (today === null) {
    return null;
  }

  const monthIndex = today.month - 1 + offset;
  const year = today.year + Math.floor(monthIndex / 12);
  const month = (((monthIndex % 12) + 12) % 12) + 1;
  const firstWeekday = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const colorByDay = new Map<string, string>();

  for (const occurrence of occurrences) {
    if (!colorByDay.has(occurrence.date)) {
      colorByDay.set(occurrence.date, KIND_STYLES[occurrence.kind].solid);
    }
  }

  const navButtonStyle = {
    background: MOMENTS_TOKENS.backgroundTertiary,
    border: 'none',
    borderRadius: 4,
    color: MOMENTS_TOKENS.textPrimary,
    cursor: 'pointer',
    height: 24,
    width: 24,
  } as const;

  return (
    <div style={{ borderRadius: 8, boxShadow: `0 0 0 1px ${MOMENTS_TOKENS.border}`, fontFamily: MOMENTS_TOKENS.fontFamily, padding: 14 }}>
      <div style={{ alignItems: 'center', display: 'flex', marginBottom: 10 }}>
        <span style={{ color: MOMENTS_TOKENS.textPrimary, fontSize: 13, fontWeight: 600 }}>Tháng {month}, {year}</span>
        <span style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          <button type="button" aria-label="Tháng trước" onClick={() => setOffset(offset - 1)} style={navButtonStyle}>‹</button>
          <button type="button" aria-label="Tháng sau" onClick={() => setOffset(offset + 1)} style={navButtonStyle}>›</button>
        </span>
      </div>
      <div style={{ color: MOMENTS_TOKENS.textSecondary, display: 'grid', fontSize: 11, gap: 2, gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', marginBottom: 4, textAlign: 'center' }}>
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div style={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', textAlign: 'center' }}>
        {Array.from({ length: firstWeekday }, (_, index) => (
          <span key={`blank-${index}`} style={{ height: 30 }} />
        ))}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1;
          const isoDate = formatIsoDate({ year, month, day });
          const isToday = isoDate === todayIso;
          const dot = colorByDay.get(isoDate);

          return (
            <div
              key={isoDate}
              style={{
                alignItems: 'center',
                background: isToday ? MOMENTS_TOKENS.inverted : 'transparent',
                borderRadius: 4,
                color: isToday ? MOMENTS_TOKENS.invertedText : MOMENTS_TOKENS.textPrimary,
                display: 'flex',
                flexDirection: 'column',
                fontSize: 12,
                fontWeight: isToday ? 600 : 400,
                gap: 2,
                height: 30,
                justifyContent: 'center',
              }}
            >
              {day}
              <span style={{ background: dot ?? 'transparent', borderRadius: '50%', height: 4, width: 4 }} />
            </div>
          );
        })}
      </div>
      <div style={{ color: MOMENTS_TOKENS.textSecondary, display: 'flex', flexWrap: 'wrap', fontSize: 11, gap: 10, marginTop: 10 }}>
        {KIND_ORDER.map((kind) => (
          <span key={kind} style={{ alignItems: 'center', display: 'flex', gap: 4 }}>
            <span style={{ background: KIND_STYLES[kind].solid, borderRadius: '50%', height: 6, width: 6 }} />
            {KIND_STYLES[kind].label}
          </span>
        ))}
      </div>
    </div>
  );
};
