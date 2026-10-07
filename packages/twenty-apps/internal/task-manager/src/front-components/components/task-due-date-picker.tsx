import { useMemo, useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import {
  IconChevronLeft,
  IconChevronRight,
  IconMinus,
  IconPlus,
} from 'twenty-ui/icon';

import { TaskButton } from './task-button';
import { TASK_CIRCLE_STYLE, TASK_TOKENS } from './task-tokens';

type TaskDueDatePickerProps = {
  // ISO instant, or null when no date is set yet.
  value: string | null;
  onDone: (iso: string | null) => void;
  onClear: () => void;
  onClose: () => void;
};

type CalendarDay = {
  key: string;
  date: Date;
  isOutsideMonth: boolean;
};

const PICKER_WIDTH = 264;
const DAY_CELL = 28;
const MINUTE_STEP = 5;

// Narrow, so the open card stays inside the issue modal: the native
// datetime-local picker draws the browser's own top-layer calendar (wide
// month grid plus time columns) outside every host clamp and spills past the
// modal edge. This one is app-drawn inside <twenty-overlay>, which the host
// clamps to the viewport — and at 264px it fits the 300px Details panel too.
export const TaskDueDatePicker = ({
  value,
  onDone,
  onClear,
  onClose,
}: TaskDueDatePickerProps) => {
  const initial = useMemo(
    () => readDateParts(value) ?? defaultDateParts(),
    // The picker mounts fresh on every open, so the initial value is fixed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [cursorYear, setCursorYear] = useState(initial.year);
  const [cursorMonth, setCursorMonth] = useState(initial.month);
  const [day, setDay] = useState<number | null>(initial.day);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);
  const [meridiem, setMeridiem] = useState<'AM' | 'PM'>(initial.meridiem);

  const weeks = useMemo(
    () => buildCalendarWeeks(cursorYear, cursorMonth),
    [cursorYear, cursorMonth],
  );

  const monthLabel = new Date(cursorYear, cursorMonth, 1).toLocaleDateString(
    undefined,
    { month: 'long', year: 'numeric' },
  );

  const moveMonth = (delta: number) => {
    const next = new Date(cursorYear, cursorMonth + delta, 1);
    setCursorYear(next.getFullYear());
    setCursorMonth(next.getMonth());
  };

  const commit = () => {
    if (day === null) {
      onDone(null);

      return;
    }

    onDone(
      new Date(
        cursorYear,
        cursorMonth,
        day,
        meridiem === 'PM' ? (hour % 12) + 12 : hour % 12,
        minute,
        0,
        0,
      ).toISOString(),
    );
  };

  const preview =
    day === null
      ? null
      : new Date(
          cursorYear,
          cursorMonth,
          day,
          meridiem === 'PM' ? (hour % 12) + 12 : hour % 12,
          minute,
        );

  return (
    <div
      role="dialog"
      aria-label={t('Choose due date')}
      style={{
        background: TASK_TOKENS.background,
        border: `1px solid ${TASK_TOKENS.border}`,
        borderRadius: TASK_TOKENS.radiusSmall,
        boxShadow: TASK_TOKENS.shadowStrong,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 12,
        width: PICKER_WIDTH,
      }}
    >
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: 4,
        }}
      >
        <span
          style={{
            color: TASK_TOKENS.textPrimary,
            flex: 1,
            fontFamily: TASK_TOKENS.fontFamily,
            fontSize: 13,
            fontWeight: 600,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {monthLabel}
        </span>
        <PickerNavButton
          label={t('Previous month')}
          onClick={() => moveMonth(-1)}
        >
          <IconChevronLeft size={14} />
        </PickerNavButton>
        <PickerNavButton label={t('Next month')} onClick={() => moveMonth(1)}>
          <IconChevronRight size={14} />
        </PickerNavButton>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(7, ${DAY_CELL}px)`,
          gap: 2,
          justifyContent: 'center',
        }}
      >
        {WEEKDAY_NARROW.map((weekday) => (
          <span
            key={weekday}
            style={{
              color: TASK_TOKENS.textTertiary,
              fontFamily: TASK_TOKENS.fontFamily,
              fontSize: 11,
              fontWeight: 600,
              height: 20,
              lineHeight: '20px',
              textAlign: 'center',
            }}
          >
            {weekday}
          </span>
        ))}
        {weeks.map((week) =>
          week.map((calendarDay) => {
            const isSelected =
              !calendarDay.isOutsideMonth && calendarDay.date.getDate() === day;
            const isToday = isSameDay(calendarDay.date, new Date());

            return (
              <button
                key={calendarDay.key}
                type="button"
                disabled={calendarDay.isOutsideMonth}
                onClick={() => setDay(calendarDay.date.getDate())}
                style={{
                  background: isSelected
                    ? TASK_TOKENS.accent
                    : 'transparent',
                  border: isToday
                    ? `1px solid ${TASK_TOKENS.accent}`
                    : '1px solid transparent',
                  ...TASK_CIRCLE_STYLE,
                  boxSizing: 'border-box',
                  color: isSelected
                    ? '#ffffff'
                    : calendarDay.isOutsideMonth
                      ? TASK_TOKENS.textLight
                      : TASK_TOKENS.textPrimary,
                  cursor: calendarDay.isOutsideMonth ? 'default' : 'pointer',
                  fontFamily: TASK_TOKENS.fontFamily,
                  fontSize: 12,
                  height: DAY_CELL,
                  lineHeight: `${DAY_CELL - 2}px`,
                  opacity: calendarDay.isOutsideMonth ? 0.35 : 1,
                  padding: 0,
                  textAlign: 'center',
                  width: DAY_CELL,
                }}
              >
                {calendarDay.date.getDate()}
              </button>
            );
          }),
        )}
      </div>

      <div
        style={{
          alignItems: 'center',
          borderTop: `1px solid ${TASK_TOKENS.borderLight}`,
          display: 'flex',
          gap: 6,
          paddingTop: 8,
        }}
      >
        <span
          style={{
            color: TASK_TOKENS.textTertiary,
            fontFamily: TASK_TOKENS.fontFamily,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {t('Time')}
        </span>
        <TimeStepper
          ariaLabel={t('Hour')}
          value={hour}
          min={1}
          max={12}
          onChange={setHour}
        />
        <span style={{ color: TASK_TOKENS.textTertiary, fontSize: 13 }}>:</span>
        <TimeStepper
          ariaLabel={t('Minute')}
          value={minute}
          min={0}
          max={55}
          step={MINUTE_STEP}
          pad
          onChange={setMinute}
        />
        <button
          type="button"
          aria-label={t('Toggle AM or PM')}
          onClick={() => setMeridiem(meridiem === 'AM' ? 'PM' : 'AM')}
          style={{
            background: TASK_TOKENS.backgroundTertiary,
            border: 'none',
            borderRadius: TASK_TOKENS.radiusExtraSmall,
            color: TASK_TOKENS.textPrimary,
            cursor: 'pointer',
            fontFamily: TASK_TOKENS.fontFamily,
            fontSize: 12,
            fontWeight: 600,
            height: 24,
            padding: '0 8px',
          }}
        >
          {meridiem}
        </button>
      </div>

      {preview !== null && (
        <span
          style={{
            color: TASK_TOKENS.textSecondary,
            fontFamily: TASK_TOKENS.fontFamily,
            fontSize: 12,
          }}
        >
          {readRelativeDay(preview)}
          {' · '}
          {preview.toLocaleTimeString(undefined, {
            hour: 'numeric',
            minute: '2-digit',
          })}
        </span>
      )}

      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: 8,
          justifyContent: 'flex-end',
        }}
      >
        <TaskButton size="small" variant="ghost" onClick={onClear}>
          {t('Clear')}
        </TaskButton>
        <TaskButton size="small" variant="ghost" onClick={onClose}>
          {t('Cancel')}
        </TaskButton>
        <TaskButton size="small" onClick={commit}>
          {t('Done')}
        </TaskButton>
      </div>
    </div>
  );
};

const PickerNavButton = ({
  label,
  children,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
}) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    style={{
      alignItems: 'center',
      background: 'transparent',
      border: 'none',
      borderRadius: TASK_TOKENS.radiusExtraSmall,
      color: TASK_TOKENS.textSecondary,
      cursor: 'pointer',
      display: 'inline-flex',
      height: 24,
      justifyContent: 'center',
      padding: 0,
      width: 24,
    }}
  >
    {children}
  </button>
);

const TimeStepper = ({
  ariaLabel,
  value,
  min,
  max,
  step = 1,
  pad = false,
  onChange,
}: {
  ariaLabel: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  pad?: boolean;
  onChange: (next: number) => void;
}) => {
  const format = (time: number) => (pad ? String(time).padStart(2, '0') : String(time));

  const shift = (delta: number) => {
    const range = max - min + step;

    onChange(min + (((value - min + delta * step) % range + range) % range));
  };

  return (
    <span
      style={{
        alignItems: 'center',
        background: TASK_TOKENS.backgroundTertiary,
        borderRadius: TASK_TOKENS.radiusExtraSmall,
        display: 'inline-flex',
        gap: 2,
        padding: 2,
      }}
    >
      <button
        type="button"
        aria-label={t('Decrease')}
        onClick={() => shift(-1)}
        style={STEPPER_BUTTON_STYLE}
      >
        <IconMinus size={12} />
      </button>
      <input
        aria-label={ariaLabel}
        value={format(value)}
        inputMode="numeric"
        onChange={(event) => {
          const parsed = Number.parseInt(event.target.value, 10);

          if (Number.isFinite(parsed)) {
            onChange(Math.min(max, Math.max(min, parsed)));
          }
        }}
        style={{
          background: 'transparent',
          border: 'none',
          color: TASK_TOKENS.textPrimary,
          fontFamily: TASK_TOKENS.fontFamily,
          fontSize: 12,
          fontWeight: 600,
          outline: 'none',
          padding: 0,
          textAlign: 'center',
          width: 24,
        }}
      />
      <button
        type="button"
        aria-label={t('Increase')}
        onClick={() => shift(1)}
        style={STEPPER_BUTTON_STYLE}
      >
        <IconPlus size={12} />
      </button>
    </span>
  );
};

const STEPPER_BUTTON_STYLE = {
  alignItems: 'center',
  background: 'transparent',
  border: 'none',
  borderRadius: 2,
  color: TASK_TOKENS.textSecondary,
  cursor: 'pointer',
  display: 'inline-flex',
  height: 20,
  justifyContent: 'center',
  padding: 0,
  width: 20,
} as const;

const WEEKDAY_NARROW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type DateParts = {
  year: number;
  month: number;
  day: number | null;
  hour: number;
  minute: number;
  meridiem: 'AM' | 'PM';
};

const readDateParts = (iso: string | null): DateParts | null => {
  if (typeof iso !== 'string' || iso === '') {
    return null;
  }

  const parsed = new Date(iso);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const rawHour = parsed.getHours();

  return {
    year: parsed.getFullYear(),
    month: parsed.getMonth(),
    day: parsed.getDate(),
    hour: rawHour % 12 === 0 ? 12 : rawHour % 12,
    minute: Math.round(parsed.getMinutes() / MINUTE_STEP) * MINUTE_STEP,
    meridiem: rawHour >= 12 ? 'PM' : 'AM',
  };
};

const defaultDateParts = (): DateParts => {
  const now = new Date();

  return {
    year: now.getFullYear(),
    month: now.getMonth(),
    day: now.getDate(),
    hour: 9,
    minute: 0,
    meridiem: 'AM',
  };
};

const buildCalendarWeeks = (year: number, month: number): CalendarDay[][] => {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const weeks: CalendarDay[][] = [];
  let current: CalendarDay[] = [];

  for (let index = 0; index < 42; index++) {
    const date = new Date(year, month, 1 - startOffset + index);
    const isOutsideMonth = date.getMonth() !== month;

    current.push({
      key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
      date,
      isOutsideMonth,
    });

    if (current.length === 7) {
      weeks.push(current);
      current = [];

      if (!isOutsideMonth && date.getDate() >= 28) {
        const probe = new Date(year, month, date.getDate() + 1);

        if (probe.getMonth() !== month) {
          break;
        }
      }
    }
  }

  return weeks;
};

const isSameDay = (left: Date, right: Date): boolean =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const readRelativeDay = (date: Date): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const deltaDays = Math.round(
    (target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (deltaDays === 0) {
    return t('Today');
  }

  if (deltaDays === 1) {
    return t('Tomorrow');
  }

  if (deltaDays === -1) {
    return t('Yesterday');
  }

  return target.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
};
