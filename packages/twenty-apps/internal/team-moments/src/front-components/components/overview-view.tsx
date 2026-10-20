import { useState } from 'react';

import { type Occurrence, type OccurrenceKind } from '../../types/occurrence';
import { groupOccurrences } from '../utils/format-occurrence.util';
import { KIND_ORDER, KIND_STYLES } from './kind-styles';
import { MonthCalendar } from './month-calendar';
import { MOMENTS_TOKENS } from './moments-tokens';
import { NextUpCard } from './next-up-card';
import { OccurrenceRow } from './occurrence-row';
import { TodayHero } from './today-hero';

type OverviewViewProps = {
  todayIso: string;
  occurrences: Occurrence[];
  onOpen: (occurrence: Occurrence) => void;
};

type KindFilter = OccurrenceKind | 'ALL';

export const OverviewView = ({ todayIso, occurrences, onOpen }: OverviewViewProps) => {
  const [filter, setFilter] = useState<KindFilter>('ALL');
  const todays = occurrences.filter((occurrence) => occurrence.daysLeft === 0);
  const nextUp = occurrences.find((occurrence) => occurrence.daysLeft > 0) ?? null;
  const visible = occurrences.filter((occurrence) => filter === 'ALL' || occurrence.kind === filter);
  const chips: { key: KindFilter; label: string; count: number }[] = [
    { key: 'ALL', label: 'Tất cả', count: occurrences.length },
    ...KIND_ORDER.map((kind) => ({
      key: kind,
      label: KIND_STYLES[kind].label,
      count: occurrences.filter((occurrence) => occurrence.kind === kind).length,
    })),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontFamily: MOMENTS_TOKENS.fontFamily, gap: 20, padding: '20px 24px 32px' }}>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
        {todays.length > 0 ? <TodayHero todayIso={todayIso} occurrences={todays} onOpen={onOpen} /> : null}
        <NextUpCard occurrence={nextUp} onOpen={onOpen} />
      </div>

      <div style={{ alignItems: 'flex-start', display: 'flex', flexWrap: 'wrap', gap: 20 }}>
        <div style={{ display: 'flex', flex: '999 1 520px', flexDirection: 'column', gap: 14, minWidth: 0 }}>
          <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <h3 style={{ color: MOMENTS_TOKENS.textPrimary, fontSize: 15, fontWeight: 600, margin: '0 8px 0 0' }}>Sắp diễn ra</h3>
            {chips.map((chip) => {
              const isSelected = chip.key === filter;

              return (
                <button
                  key={chip.key}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setFilter(chip.key)}
                  style={{
                    background: isSelected ? MOMENTS_TOKENS.inverted : MOMENTS_TOKENS.background,
                    border: `1px solid ${isSelected ? MOMENTS_TOKENS.inverted : MOMENTS_TOKENS.border}`,
                    borderRadius: 14,
                    color: isSelected ? MOMENTS_TOKENS.invertedText : MOMENTS_TOKENS.textSecondary,
                    cursor: 'pointer',
                    fontSize: 13,
                    height: 28,
                    padding: '0 10px',
                  }}
                >
                  {chip.label} <span style={{ opacity: 0.7 }}>{chip.count}</span>
                </button>
              );
            })}
          </div>

          {visible.length === 0 ? (
            <div style={{ borderRadius: 8, boxShadow: `0 0 0 1px ${MOMENTS_TOKENS.border}`, color: MOMENTS_TOKENS.textSecondary, fontSize: 13, padding: 24, textAlign: 'center' }}>
              Không có sự kiện nào.
            </div>
          ) : null}

          {groupOccurrences(visible).map((group) => (
            <div key={group.title} style={{ borderRadius: 8, boxShadow: `0 0 0 1px ${MOMENTS_TOKENS.border}`, overflow: 'hidden' }}>
              <div style={{ background: MOMENTS_TOKENS.backgroundSecondary, borderBottom: `1px solid ${MOMENTS_TOKENS.border}`, color: MOMENTS_TOKENS.textSecondary, fontSize: 12, fontWeight: 600, padding: '8px 14px' }}>
                {group.title}
              </div>
              {group.occurrences.map((occurrence) => (
                <OccurrenceRow key={occurrence.key} occurrence={occurrence} onOpen={() => onOpen(occurrence)} />
              ))}
            </div>
          ))}
        </div>

        <aside style={{ display: 'flex', flex: '1 1 300px', flexDirection: 'column', gap: 16, minWidth: 280 }}>
          <MonthCalendar todayIso={todayIso} occurrences={occurrences} />
        </aside>
      </div>
    </div>
  );
};
