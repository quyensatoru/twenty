import { useState } from 'react';

import { type ShiftRosterEntry } from '../../types/shift-roster-entry';
import { type ShiftTemplateRow } from '../../types/shift-template-row';
import { ShiftCodeChip } from './shift-code-chip';
import { SHIFT_TOKENS } from './shift-tokens';

const WEEKEND_START_INDEX = 5;

type ShiftRegisterMonthCalendarProps = {
  weeks: (string | null)[][];
  today: string;
  weekdayHeaders: string[];
  registeredByDate: Record<string, ShiftRosterEntry[]>;
  templatesById: Record<string, ShiftTemplateRow>;
  currentMemberId: string | null;
  specialDayDates: Set<string>;
  onSelectDay: (day: string) => void;
};

type DayCellProps = {
  day: string;
  isToday: boolean;
  isPast: boolean;
  isWeekend: boolean;
  isSpecialDay: boolean;
  entries: ShiftRosterEntry[];
  templatesById: Record<string, ShiftTemplateRow>;
  currentMemberId: string | null;
  onSelectDay: (day: string) => void;
};

// A special day (holiday / OT — higher pay) is flagged across the whole cell:
// an orange wash, border and inset ring, so it reads at a glance in the grid
// and not only through the small corner dot.
const DayCell = ({
  day,
  isToday,
  isPast,
  isWeekend,
  isSpecialDay,
  entries,
  templatesById,
  currentMemberId,
  onSelectDay,
}: DayCellProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const background = isSpecialDay
    ? SHIFT_TOKENS.backgroundOrange
    : isToday
      ? SHIFT_TOKENS.backgroundBlue
      : isWeekend
        ? SHIFT_TOKENS.backgroundSecondary
        : SHIFT_TOKENS.background;

  const borderColor = isSpecialDay
    ? SHIFT_TOKENS.orange
    : isToday
      ? SHIFT_TOKENS.accent
      : isHovered && !isPast
        ? SHIFT_TOKENS.accent
        : SHIFT_TOKENS.borderLight;

  return (
    <button
      type="button"
      disabled={isPast}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        if (!isPast) {
          onSelectDay(day);
        }
      }}
      style={{
        background,
        border: `1px solid ${borderColor}`,
        boxShadow: isSpecialDay
          ? `inset 0 0 0 1px ${SHIFT_TOKENS.orange}`
          : 'none',
        boxSizing: 'border-box',
        cursor: isPast ? 'default' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: SHIFT_TOKENS.fontFamily,
        gap: 4,
        minHeight: 96,
        opacity: isPast ? 0.45 : 1,
        padding: 8,
        textAlign: 'left',
        transition: 'border-color 0.1s ease',
      }}
    >
      <span style={{ alignItems: 'center', display: 'flex', gap: 4 }}>
        <span
          style={{
            color: isToday ? SHIFT_TOKENS.accent : SHIFT_TOKENS.textPrimary,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {Number(day.slice(8, 10))}
        </span>
        {isSpecialDay ? (
          <span
            style={{
              background: SHIFT_TOKENS.orange,
              borderRadius: '50%',
              height: 6,
              width: 6,
            }}
          />
        ) : null}
      </span>
      {entries.length === 0 ? null : (
        <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {entries.map((entry) => {
            const template =
              entry.shiftTemplateId === null
                ? undefined
                : templatesById[entry.shiftTemplateId];
            const isOwn =
              currentMemberId !== null && entry.memberId === currentMemberId;
            const hasWindow =
              entry.startTime !== null && entry.endTime !== null;

            return (
              <span
                key={entry.id}
                style={{
                  alignItems: 'flex-start',
                  background: isOwn ? SHIFT_TOKENS.backgroundBlue : 'transparent',
                  borderRadius: SHIFT_TOKENS.radiusSmall,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  minWidth: 0,
                  padding: '1px 4px',
                  width: '100%',
                }}
              >
                <span
                  style={{
                    alignItems: 'center',
                    display: 'flex',
                    gap: 4,
                    minWidth: 0,
                    width: '100%',
                  }}
                >
                  <ShiftCodeChip
                    code={entry.templateCode ?? template?.code ?? '?'}
                    color={template?.color ?? null}
                  />
                  {entry.memberName === null ? null : (
                    <span
                      title={entry.memberName}
                      style={{
                        color: isOwn
                          ? SHIFT_TOKENS.textPrimary
                          : SHIFT_TOKENS.textSecondary,
                        fontSize: 11,
                        fontWeight: isOwn ? 600 : 400,
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {entry.memberName}
                    </span>
                  )}
                </span>
                {hasWindow ? (
                  <span
                    style={{
                      color: SHIFT_TOKENS.textTertiary,
                      fontSize: 11,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {`${entry.startTime}–${entry.endTime}`}
                  </span>
                ) : null}
              </span>
            );
          })}
        </span>
      )}
    </button>
  );
};

export const ShiftRegisterMonthCalendar = ({
  weeks,
  today,
  weekdayHeaders,
  registeredByDate,
  templatesById,
  currentMemberId,
  specialDayDates,
  onSelectDay,
}: ShiftRegisterMonthCalendarProps) => (
  <div
    style={{ display: 'flex', flexDirection: 'column', minWidth: 720 }}
  >
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
      {weekdayHeaders.map((label, columnIndex) => (
        <div
          key={label}
          style={{
            color:
              columnIndex >= WEEKEND_START_INDEX
                ? SHIFT_TOKENS.textTertiary
                : SHIFT_TOKENS.textSecondary,
            fontFamily: SHIFT_TOKENS.fontFamily,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.04em',
            padding: 8,
            textAlign: 'center',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </div>
      ))}
    </div>
    {weeks.map((week, weekIndex) => (
      <div
        key={week.find((day) => day !== null) ?? `week-${weekIndex}`}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}
      >
        {week.map((day, columnIndex) =>
          day === null ? (
            <div
              key={`${weekIndex}-${columnIndex}`}
              style={{
                background: SHIFT_TOKENS.backgroundSecondary,
                border: `1px solid ${SHIFT_TOKENS.borderLight}`,
                minHeight: 96,
              }}
            />
          ) : (
            <DayCell
              key={day}
              day={day}
              isToday={day === today}
              isPast={day < today}
              isWeekend={columnIndex >= WEEKEND_START_INDEX}
              isSpecialDay={specialDayDates.has(day)}
              entries={registeredByDate[day] ?? []}
              templatesById={templatesById}
              currentMemberId={currentMemberId}
              onSelectDay={onSelectDay}
            />
          ),
        )}
      </div>
    ))}
  </div>
);
