import { styled } from '@linaria/react';
import { isDefined } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { type ShiftRosterEntry } from '@/shift/hooks/useShiftRoster';
import { type ShiftTemplateRecord } from '@/shift/hooks/useShiftTemplates';

const WEEKEND_START_INDEX = 5;

const StyledCalendar = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 720px;
`;

const StyledRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
`;

const StyledWeekdayHeader = styled.div<{ isWeekend: boolean }>`
  color: ${({ isWeekend }) =>
    isWeekend
      ? themeCssVariables.font.color.tertiary
      : themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  letter-spacing: 0.04em;
  padding: ${themeCssVariables.spacing['2']};
  text-align: center;
  text-transform: uppercase;
`;

const StyledEmptyCell = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  min-height: 96px;
`;

const StyledDayCell = styled.button<{
  isToday: boolean;
  isPast: boolean;
  isWeekend: boolean;
  isSpecialDay: boolean;
}>`
  background: ${({ isToday, isWeekend, isSpecialDay }) =>
    isSpecialDay
      ? themeCssVariables.background.transparent.orange
      : isToday
        ? themeCssVariables.background.transparent.blue
        : isWeekend
          ? themeCssVariables.background.secondary
          : themeCssVariables.background.primary};
  border: 1px solid
    ${({ isToday, isSpecialDay }) =>
      isSpecialDay
        ? themeCssVariables.color.orange
        : isToday
          ? themeCssVariables.color.blue
          : themeCssVariables.border.color.light};
  // A special day (holiday / OT — higher pay) is flagged across the whole cell:
  // an orange wash + border + inset ring so it reads at a glance in the grid,
  // not only via the small corner dot.
  box-shadow: ${({ isSpecialDay }) =>
    isSpecialDay
      ? `inset 0 0 0 1px ${themeCssVariables.color.orange}`
      : 'none'};
  cursor: ${({ isPast }) => (isPast ? 'default' : 'pointer')};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing['1']};
  min-height: 96px;
  opacity: ${({ isPast }) => (isPast ? 0.45 : 1)};
  padding: ${themeCssVariables.spacing['2']};
  text-align: left;
  transition: border-color 0.1s ease;

  &:hover {
    border-color: ${({ isPast, isSpecialDay }) =>
      isSpecialDay
        ? themeCssVariables.color.orange
        : isPast
          ? themeCssVariables.border.color.light
          : themeCssVariables.color.blue};
  }
`;

const StyledDayHead = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing['1']};
`;

const StyledDayNumber = styled.span<{ isToday: boolean }>`
  color: ${({ isToday }) =>
    isToday
      ? themeCssVariables.color.blue
      : themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledSpecialDot = styled.span`
  background: ${themeCssVariables.color.orange};
  border-radius: 50%;
  height: 6px;
  width: 6px;
`;

const StyledShiftRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing['1']};
`;

// One shift entry stacks two lines (code + time on top, member name below) so
// the name is never clipped in a narrow calendar cell. Own entries get a subtle
// blue wash so a member spots their own coverage against the rest of the team's.
const StyledShiftRow = styled.div<{ isOwn: boolean }>`
  align-items: flex-start;
  background: ${({ isOwn }) =>
    isOwn ? themeCssVariables.background.transparent.blue : 'transparent'};
  border-radius: ${themeCssVariables.border.radius.sm};
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  padding: 1px ${themeCssVariables.spacing['1']};
  width: 100%;
`;

const StyledShiftTopLine = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing['1']};
  min-width: 0;
  width: 100%;
`;

const StyledCodeChip = styled.span<{ hasColor: boolean }>`
  background-color: ${({ hasColor }) =>
    hasColor ? 'transparent' : themeCssVariables.background.transparent.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${({ hasColor }) =>
    hasColor
      ? themeCssVariables.font.color.inverted
      : themeCssVariables.font.color.secondary};
  flex-shrink: 0;
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  padding: 0 ${themeCssVariables.spacing['1']};
`;

const StyledShiftTime = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledMemberName = styled.span<{ isOwn: boolean }>`
  color: ${({ isOwn }) =>
    isOwn
      ? themeCssVariables.font.color.primary
      : themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${({ isOwn }) =>
    isOwn
      ? themeCssVariables.font.weight.semiBold
      : themeCssVariables.font.weight.regular};
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

type ShiftRegisterMonthCalendarProps = {
  weeks: (string | null)[][];
  today: string;
  weekdayHeaders: string[];
  registeredByDate: Record<string, ShiftRosterEntry[]>;
  templatesById: Record<string, ShiftTemplateRecord>;
  currentMemberId: string | undefined;
  specialDayDates: Set<string>;
  onSelectDay: (day: string) => void;
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
}: ShiftRegisterMonthCalendarProps) => {
  return (
    <StyledCalendar>
      <StyledRow>
        {weekdayHeaders.map((label, columnIndex) => (
          <StyledWeekdayHeader
            key={label}
            isWeekend={columnIndex >= WEEKEND_START_INDEX}
          >
            {label}
          </StyledWeekdayHeader>
        ))}
      </StyledRow>
      {weeks.map((week, weekIndex) => (
        <StyledRow key={weekIndex}>
          {week.map((day, columnIndex) => {
            if (!isDefined(day)) {
              return <StyledEmptyCell key={`${weekIndex}-${columnIndex}`} />;
            }

            const isToday = day === today;
            const isPast = day < today;
            const isWeekend = columnIndex >= WEEKEND_START_INDEX;
            const isSpecialDay = specialDayDates.has(day);
            const dayNumber = Number(day.slice(8, 10));
            const registeredShifts = registeredByDate[day] ?? [];

            return (
              <StyledDayCell
                key={day}
                type="button"
                isToday={isToday}
                isPast={isPast}
                isWeekend={isWeekend}
                isSpecialDay={isSpecialDay}
                disabled={isPast}
                onClick={() => {
                  if (!isPast) {
                    onSelectDay(day);
                  }
                }}
              >
                <StyledDayHead>
                  <StyledDayNumber isToday={isToday}>
                    {dayNumber}
                  </StyledDayNumber>
                  {isSpecialDay && <StyledSpecialDot />}
                </StyledDayHead>
                {registeredShifts.length > 0 && (
                  <StyledShiftRows>
                    {registeredShifts.map((entry) => {
                      const template = isDefined(entry.shiftTemplateId)
                        ? templatesById[entry.shiftTemplateId]
                        : undefined;
                      const hasColor = isDefined(template?.color);
                      const isOwn =
                        isDefined(currentMemberId) &&
                        entry.memberId === currentMemberId;
                      // Full name (firstName + lastName) from the roster service;
                      // the cell ellipsizes when narrow and the title shows it whole.
                      const displayName = entry.memberName;
                      const hasWindow =
                        isDefined(entry.startTime) && isDefined(entry.endTime);

                      return (
                        <StyledShiftRow key={entry.id} isOwn={isOwn}>
                          <StyledShiftTopLine>
                            <StyledCodeChip
                              hasColor={hasColor}
                              style={
                                hasColor
                                  ? {
                                      backgroundColor:
                                        template?.color ?? undefined,
                                    }
                                  : undefined
                              }
                            >
                              {entry.templateCode ?? template?.code ?? '?'}
                            </StyledCodeChip>
                            {isDefined(displayName) && (
                              <StyledMemberName
                                isOwn={isOwn}
                                title={displayName}
                              >
                                {displayName}
                              </StyledMemberName>
                            )}
                          </StyledShiftTopLine>
                          {hasWindow && (
                            <StyledShiftTime>
                              {entry.startTime}–{entry.endTime}
                            </StyledShiftTime>
                          )}
                        </StyledShiftRow>
                      );
                    })}
                  </StyledShiftRows>
                )}
              </StyledDayCell>
            );
          })}
        </StyledRow>
      ))}
    </StyledCalendar>
  );
};
