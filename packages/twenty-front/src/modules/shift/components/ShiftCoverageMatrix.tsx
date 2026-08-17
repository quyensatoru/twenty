import { Fragment, useState } from 'react';

import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import {
  type CoverageMatrix,
  coverageCellKey,
} from '@/shift/utils/shiftCoverage';
import { getWeekdayIndex } from '@/shift/utils/shiftWeek';

const ROW_LABEL_WIDTH = '64px';
const FIRST_WEEKEND_INDEX = 5;
const HOURS_PER_BLOCK = 6;

const StyledScroll = styled.div`
  overflow-x: auto;
`;

const StyledGrid = styled.div`
  display: grid;
  min-width: min-content;
`;

const StyledCorner = styled.div`
  background: ${themeCssVariables.background.secondary};
  border-bottom: 1px solid ${themeCssVariables.border.color.medium};
  left: 0;
  position: sticky;
  z-index: 2;
`;

const StyledDayHead = styled.div<{ isToday: boolean; isWeekend: boolean }>`
  align-items: center;
  background: ${({ isToday, isWeekend }) =>
    isToday
      ? themeCssVariables.background.transparent.blue
      : isWeekend
        ? themeCssVariables.background.tertiary
        : themeCssVariables.background.secondary};
  border-bottom: 1px solid ${themeCssVariables.border.color.medium};
  border-left: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: ${themeCssVariables.spacing['1']};
`;

const StyledDayName = styled.span<{ isToday: boolean }>`
  color: ${({ isToday }) =>
    isToday
      ? themeCssVariables.color.blue
      : themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledDayDate = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: 10px;
`;

const StyledRowLabel = styled.div<{
  isBlockStart: boolean;
  isHovered: boolean;
}>`
  align-items: center;
  background: ${({ isHovered }) =>
    isHovered
      ? themeCssVariables.background.tertiary
      : themeCssVariables.background.secondary};
  border-top: 1px solid
    ${({ isBlockStart }) =>
      isBlockStart
        ? themeCssVariables.border.color.medium
        : themeCssVariables.border.color.light};
  color: ${({ isHovered }) =>
    isHovered
      ? themeCssVariables.font.color.primary
      : themeCssVariables.font.color.secondary};
  display: flex;
  font-size: ${themeCssVariables.font.size.xs};
  font-variant-numeric: tabular-nums;
  font-weight: ${({ isHovered }) =>
    isHovered
      ? themeCssVariables.font.weight.semiBold
      : themeCssVariables.font.weight.regular};
  left: 0;
  padding: 0 ${themeCssVariables.spacing['2']};
  position: sticky;
  width: ${ROW_LABEL_WIDTH};
  z-index: 1;
`;

const StyledCell = styled.div<{
  covered: boolean;
  isBlockStart: boolean;
  isRowHovered: boolean;
}>`
  align-items: center;
  background: ${({ covered }) =>
    covered
      ? themeCssVariables.tag.background.green
      : themeCssVariables.tag.background.red};
  border-left: 1px solid ${themeCssVariables.border.color.light};
  border-top: 1px solid
    ${({ isBlockStart }) =>
      isBlockStart
        ? themeCssVariables.border.color.medium
        : themeCssVariables.border.color.light};
  color: ${({ covered }) =>
    covered
      ? themeCssVariables.tag.text.green
      : themeCssVariables.tag.text.red};
  display: flex;
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  justify-content: center;
  min-height: 22px;
  min-width: 40px;
  position: relative;

  // Hovering any cell lifts the whole hour band; a translucent overlay reads on
  // both the green and red cell tints and adapts to the theme.
  &::after {
    background: ${({ isRowHovered }) =>
      isRowHovered
        ? themeCssVariables.background.transparent.light
        : 'transparent'};
    content: '';
    inset: 0;
    pointer-events: none;
    position: absolute;
  }
`;

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
  const { t } = useLingui();
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  return (
    <StyledScroll>
      <StyledGrid
        onMouseLeave={() => setHoveredHour(null)}
        style={{
          gridTemplateColumns: `${ROW_LABEL_WIDTH} repeat(${days.length}, minmax(40px, 1fr))`,
        }}
      >
        <StyledCorner />
        {days.map((day) => {
          const weekdayIndex = getWeekdayIndex(day);

          return (
            <StyledDayHead
              key={day}
              isToday={day === today}
              isWeekend={weekdayIndex >= FIRST_WEEKEND_INDEX}
            >
              <StyledDayName isToday={day === today}>
                {weekdayLabels[weekdayIndex]}
              </StyledDayName>
              <StyledDayDate>{day.slice(8)}</StyledDayDate>
            </StyledDayHead>
          );
        })}

        {matrix.rows.map((row) => {
          const isBlockStart = row.hour % HOURS_PER_BLOCK === 0;

          const isRowHovered = hoveredHour === row.hour;

          return (
            <Fragment key={row.hour}>
              <StyledRowLabel
                isBlockStart={isBlockStart}
                isHovered={isRowHovered}
                onMouseEnter={() => setHoveredHour(row.hour)}
              >
                {row.label}
              </StyledRowLabel>
              {days.map((day) => {
                const cell = matrix.cells[coverageCellKey(day, row.hour)];
                const covered = cell.count > 0;

                return (
                  <StyledCell
                    key={`${row.hour}-${day}`}
                    covered={covered}
                    isBlockStart={isBlockStart}
                    isRowHovered={isRowHovered}
                    onMouseEnter={() => setHoveredHour(row.hour)}
                    title={
                      covered ? cell.memberNames.join(', ') : t`No coverage`
                    }
                  >
                    {covered ? cell.count : ''}
                  </StyledCell>
                );
              })}
            </Fragment>
          );
        })}
      </StyledGrid>
    </StyledScroll>
  );
};
