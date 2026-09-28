import { type ReactNode, useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconDotsVertical } from 'twenty-ui/icon';

import { type ShiftRow } from '../../types/shift-row';
import { type ShiftTemplateRow } from '../../types/shift-template-row';
import { getWeekdayIndex } from '../../utils/shift-calendar.util';
import {
  hasShiftWindowEnded,
  isCheckInWindowOpen,
  isShiftMissed,
} from '../../utils/shift-time.util';
import { CancelShiftModal } from './cancel-shift-modal';
import { ShiftButton } from './shift-button';
import { ShiftCodeChip } from './shift-code-chip';
import { getShiftStatusTone, ShiftTag } from './shift-tag';
import { SHIFT_TOKENS } from './shift-tokens';

const formatTimeWindow = (
  startTime: string | null,
  endTime: string | null,
): string | null =>
  startTime === null || endTime === null ? null : `${startTime} – ${endTime}`;

type WeekShiftRowProps = {
  shift: ShiftRow;
  template: ShiftTemplateRow | undefined;
  onCancel: (
    shiftId: string,
    reason: string,
    category: string,
  ) => Promise<void>;
};

const WeekShiftRow = ({ shift, template, onCancel }: WeekShiftRowProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  // A shift whose scheduled window has fully elapsed can no longer be cancelled
  // — a past shift is settled (worked, missed, or adjusted by a leader), not
  // something a member cancels ahead of time.
  const isPast = hasShiftWindowEnded(shift.date, shift.startTime, shift.endTime);
  const isCancellable =
    (shift.status === 'UPCOMING' || shift.status === 'IN_PROGRESS') && !isPast;

  // A not-yet-checked-in UPCOMING shift reads differently by clock: window open
  // now -> action is due ("Awaiting check-in"); otherwise -> still ahead
  // ("Upcoming"). Missed and past shifts never reach this list.
  const isAwaitingCheckIn =
    shift.status === 'UPCOMING' &&
    !isShiftMissed(shift) &&
    isCheckInWindowOpen({
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      earlyCheckInMinutes: template?.earlyCheckInMinutes ?? null,
    });

  const statusLabel =
    shift.status === 'IN_PROGRESS'
      ? t('In progress')
      : isAwaitingCheckIn
        ? t('Awaiting check-in')
        : t('Upcoming');
  const statusTone = isAwaitingCheckIn
    ? 'yellow'
    : getShiftStatusTone(shift.status);

  const timeWindow = formatTimeWindow(shift.startTime, shift.endTime);
  const chipCode = shift.templateCode ?? template?.code ?? null;
  const isOvertime = shift.rateMultiplier !== null && shift.rateMultiplier > 1;

  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
      }}
    >
      {timeWindow === null ? null : (
        <span style={{ color: SHIFT_TOKENS.textSecondary, fontSize: 12 }}>
          {timeWindow}
        </span>
      )}
      {chipCode === null ? null : (
        <ShiftCodeChip code={chipCode} color={template?.color ?? null} />
      )}
      <ShiftTag label={statusLabel} tone={statusTone} />
      {isOvertime ? (
        <ShiftTag label={`×${shift.rateMultiplier}`} tone="orange" />
      ) : null}
      <div style={{ flex: 1 }} />
      {isCancellable ? (
        <div style={{ position: 'relative' }}>
          <ShiftButton
            variant="ghost"
            ariaLabel={t('More actions')}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            startIcon={<IconDotsVertical size={14} />}
          />
          {isMenuOpen ? (
            <>
              <div
                onClick={() => setIsMenuOpen(false)}
                style={{ inset: 0, position: 'fixed', zIndex: 20 }}
              />
              <div
                style={{
                  background: SHIFT_TOKENS.background,
                  border: `1px solid ${SHIFT_TOKENS.border}`,
                  borderRadius: SHIFT_TOKENS.radius,
                  boxShadow: SHIFT_TOKENS.shadow,
                  padding: 4,
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  zIndex: 21,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsCancelOpen(true);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderRadius: SHIFT_TOKENS.radiusSmall,
                    color: SHIFT_TOKENS.red,
                    cursor: 'pointer',
                    fontFamily: SHIFT_TOKENS.fontFamily,
                    fontSize: 13,
                    padding: '6px 10px',
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t('Cancel shift…')}
                </button>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
      {isCancelOpen ? (
        <CancelShiftModal
          shiftName={shift.name}
          isInProgress={shift.status === 'IN_PROGRESS'}
          onConfirm={(reason, category) =>
            onCancel(shift.id, reason, category)
          }
          onClose={() => setIsCancelOpen(false)}
        />
      ) : null}
    </div>
  );
};

// Collapse the (already day-then-start ordered) shifts into one group per day so
// a day with several shifts shows its date label once.
const groupShiftsByDay = (
  shifts: ShiftRow[],
): { date: string; shifts: ShiftRow[] }[] => {
  const groups: { date: string; shifts: ShiftRow[] }[] = [];

  for (const shift of shifts) {
    const lastGroup = groups[groups.length - 1];

    if (lastGroup !== undefined && lastGroup.date === shift.date) {
      lastGroup.shifts.push(shift);
    } else {
      groups.push({ date: shift.date, shifts: [shift] });
    }
  }

  return groups;
};

type ShiftWeekListProps = {
  // Already filtered to still-actionable shifts and ordered by day then start.
  shifts: ShiftRow[];
  today: string;
  weekdayLabels: string[];
  templateById: Record<string, ShiftTemplateRow>;
  emptyAction?: ReactNode;
  onCancel: (
    shiftId: string,
    reason: string,
    category: string,
  ) => Promise<void>;
};

// One bordered card of the week's still-actionable shifts. Completed, past and
// cancelled shifts are deliberately absent — those live on the Report page;
// this list is only what the member can still act on (check in, or cancel).
export const ShiftWeekList = ({
  shifts,
  today,
  weekdayLabels,
  templateById,
  emptyAction,
  onCancel,
}: ShiftWeekListProps) => {
  // Only today reads as "Today"; every other day shows its weekday + date.
  const formatDayLabel = (date: string): string =>
    date === today
      ? t('Today')
      : `${weekdayLabels[getWeekdayIndex(date)]} ${date.slice(5)}`;

  return (
    <section
      style={{
        border: `1px solid ${SHIFT_TOKENS.borderLight}`,
        borderRadius: SHIFT_TOKENS.radius,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          borderBottom: `1px solid ${SHIFT_TOKENS.borderLight}`,
          color: SHIFT_TOKENS.textSecondary,
          fontSize: 12,
          fontWeight: 600,
          padding: '8px 12px',
        }}
      >
        {t('Upcoming shifts')}
      </header>
      {shifts.length === 0 ? (
        <div
          style={{
            alignItems: 'center',
            color: SHIFT_TOKENS.textTertiary,
            display: 'flex',
            flexDirection: 'column',
            fontSize: 12,
            gap: 12,
            padding: '24px 16px',
            textAlign: 'center',
          }}
        >
          <span>{t('No upcoming shifts.')}</span>
          {emptyAction}
        </div>
      ) : (
        groupShiftsByDay(shifts).map((group) => (
          <div
            key={group.date}
            style={{
              alignItems: 'flex-start',
              background:
                group.date === today
                  ? SHIFT_TOKENS.backgroundBlue
                  : 'transparent',
              borderTop: `1px solid ${SHIFT_TOKENS.borderLight}`,
              display: 'flex',
              gap: 12,
              padding: '8px 12px',
            }}
          >
            <span
              style={{
                color:
                  group.date === today
                    ? SHIFT_TOKENS.accent
                    : SHIFT_TOKENS.textPrimary,
                flexShrink: 0,
                fontSize: 12,
                fontWeight: 600,
                paddingTop: 3,
                width: 96,
              }}
            >
              {formatDayLabel(group.date)}
            </span>
            <div
              style={{
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                gap: 8,
                minWidth: 0,
              }}
            >
              {group.shifts.map((shift) => (
                <WeekShiftRow
                  key={shift.id}
                  shift={shift}
                  template={
                    shift.shiftTemplateId === null
                      ? undefined
                      : templateById[shift.shiftTemplateId]
                  }
                  onCancel={onCancel}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </section>
  );
};
