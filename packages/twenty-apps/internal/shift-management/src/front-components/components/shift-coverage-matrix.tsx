import { Fragment, useState } from 'react';
import { t } from 'twenty-sdk/front-component';

import { getWeekdayIndex } from '../../utils/shift-calendar.util';
import {
  type CoverageMatrix,
  coverageCellKey,
} from '../../utils/shift-coverage.util';
import { SHIFT_TOKENS } from './shift-tokens';

const ROW_LABEL_WIDTH = 64;
const FIRST_WEEKEND_INDEX = 5;
const HOURS_PER_BLOCK = 6;

type ShiftCoverageMatrixProps = {
  matrix: CoverageMatrix;
  days: string[];
  weekdayLabels: string[];
  today: string;
};

export const ShiftCoverageMatrix = ({
  matrix,
  days,
  weekdayLabels,
  today,
}: ShiftCoverageMatrixProps) => {
  // Hovering any cell lifts the whole hour band. A front component cannot ship
  // a stylesheet, so the band highlight is state driven by the forwarded
  // mouseenter/mouseleave events rather than a :hover rule.
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  return (
    <div style={{ overflowX: 'auto' }}>
      <div
        onMouseLeave={() => setHoveredHour(null)}
        style={{
          display: 'grid',
          fontFamily: SHIFT_TOKENS.fontFamily,
          gridTemplateColumns: `${ROW_LABEL_WIDTH}px repeat(${days.length}, minmax(40px, 1fr))`,
          minWidth: 'min-content',
        }}
      >
        <div
          style={{
            background: SHIFT_TOKENS.backgroundSecondary,
            borderBottom: `1px solid ${SHIFT_TOKENS.border}`,
            left: 0,
            position: 'sticky',
            zIndex: 2,
          }}
        />
        {days.map((day) => {
          const weekdayIndex = getWeekdayIndex(day);
          const isToday = day === today;

          return (
            <div
              key={day}
              style={{
                alignItems: 'center',
                background: isToday
                  ? SHIFT_TOKENS.backgroundBlue
                  : weekdayIndex >= FIRST_WEEKEND_INDEX
                    ? SHIFT_TOKENS.backgroundTertiary
                    : SHIFT_TOKENS.backgroundSecondary,
                borderBottom: `1px solid ${SHIFT_TOKENS.border}`,
                borderLeft: `1px solid ${SHIFT_TOKENS.borderLight}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                padding: 4,
              }}
            >
              <span
                style={{
                  color: isToday
                    ? SHIFT_TOKENS.accent
                    : SHIFT_TOKENS.textSecondary,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {weekdayLabels[weekdayIndex]}
              </span>
              <span
                style={{ color: SHIFT_TOKENS.textTertiary, fontSize: 10 }}
              >
                {day.slice(8)}
              </span>
            </div>
          );
        })}

        {matrix.rows.map((row) => {
          const isBlockStart = row.hour % HOURS_PER_BLOCK === 0;
          const isRowHovered = hoveredHour === row.hour;
          const topBorder = `1px solid ${isBlockStart ? SHIFT_TOKENS.border : SHIFT_TOKENS.borderLight}`;

          return (
            <Fragment key={row.hour}>
              <div
                onMouseEnter={() => setHoveredHour(row.hour)}
                style={{
                  alignItems: 'center',
                  background: isRowHovered
                    ? SHIFT_TOKENS.backgroundTertiary
                    : SHIFT_TOKENS.backgroundSecondary,
                  borderTop: topBorder,
                  color: isRowHovered
                    ? SHIFT_TOKENS.textPrimary
                    : SHIFT_TOKENS.textSecondary,
                  display: 'flex',
                  fontSize: 11,
                  fontWeight: isRowHovered ? 600 : 400,
                  left: 0,
                  padding: '0 8px',
                  position: 'sticky',
                  width: ROW_LABEL_WIDTH,
                  zIndex: 1,
                }}
              >
                {row.label}
              </div>
              {days.map((day) => {
                const cell = matrix.cells[coverageCellKey(day, row.hour)];
                const isCovered = cell.count > 0;

                return (
                  <div
                    key={`${row.hour}-${day}`}
                    onMouseEnter={() => setHoveredHour(row.hour)}
                    title={
                      isCovered
                        ? cell.memberNames.join(', ')
                        : t('No coverage')
                    }
                    style={{
                      alignItems: 'center',
                      background: isCovered
                        ? SHIFT_TOKENS.greenSoft
                        : SHIFT_TOKENS.redSoft,
                      borderLeft: `1px solid ${SHIFT_TOKENS.borderLight}`,
                      borderTop: topBorder,
                      color: isCovered
                        ? SHIFT_TOKENS.greenText
                        : SHIFT_TOKENS.redText,
                      display: 'flex',
                      fontSize: 11,
                      fontWeight: 600,
                      justifyContent: 'center',
                      minHeight: 22,
                      minWidth: 40,
                      opacity: isRowHovered ? 0.85 : 1,
                    }}
                  >
                    {isCovered ? cell.count : ''}
                  </div>
                );
              })}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
};
