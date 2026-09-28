import { useEffect, useMemo, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';
import { IconChevronLeft, IconChevronRight } from 'twenty-ui/icon';

import { REGISTER_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { type ShiftRosterEntry } from '../types/shift-roster-entry';
import { type ShiftTemplateRow } from '../types/shift-template-row';
import { type SpecialDayRow } from '../types/special-day-row';
import {
  addMonthsToMonthValue,
  buildIctMonthCalendar,
  getIctMonthValue,
  getMonthLabel,
  getWeekdayIndex,
} from '../utils/shift-calendar.util';
import {
  getShiftStartUtcMillis,
  getTodayIct,
} from '../utils/shift-time.util';
import { computeSpecialDayDatesInWeek } from '../utils/shift-week.util';
import { ShiftButton } from './components/shift-button';
import { ShiftPage } from './components/shift-page';
import { ShiftRegisterDayModal } from './components/shift-register-day-modal';
import { ShiftRegisterMonthCalendar } from './components/shift-register-month-calendar';
import { ShiftStateMessage } from './components/shift-state-message';
import { SHIFT_TOKENS } from './components/shift-tokens';
import { fetchCatalog } from './utils/fetch-catalog.util';
import { fetchMembers } from './utils/fetch-members.util';
import { fetchRoster } from './utils/fetch-roster.util';
import { readErrorText } from './utils/read-error-text.util';
import { registerShiftsForDay } from './utils/register-shifts.util';

// Mon..Fri are weekday-index 0..4 and Sat/Sun 5..6, so a day's weekday index
// tells its kind.
const FIRST_WEEKEND_INDEX = 5;

// A day's registrable templates. A Special Day is treated as a holiday: it
// shows ONLY its HOLIDAY_OT templates — they REPLACE the everyday roster rather
// than adding to it. An ordinary day shows its weekday/weekend templates by
// weekday index. Slots whose start time has already passed on `day` (only
// possible for today) are dropped: you can't register a shift that has begun.
const getApplicableTemplatesForDay = ({
  templates,
  day,
  weekdayIndex,
  isSpecialDay,
}: {
  templates: ShiftTemplateRow[];
  day: string;
  weekdayIndex: number;
  isSpecialDay: boolean;
}): ShiftTemplateRow[] => {
  const targetKind = isSpecialDay
    ? 'HOLIDAY_OT'
    : weekdayIndex < FIRST_WEEKEND_INDEX
      ? 'WEEKDAY'
      : 'WEEKEND';
  const nowMillis = Date.now();

  return templates
    .filter(
      (template) =>
        template.dayKind === targetKind &&
        getShiftStartUtcMillis(day, template.startTime) > nowMillis,
    )
    .sort((first, second) => first.startTime.localeCompare(second.startTime));
};

const Register = () => {
  const today = useMemo(() => getTodayIct(), []);
  const currentMonth = useMemo(() => getIctMonthValue(), []);
  const [viewedMonth, setViewedMonth] = useState(currentMonth);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const [roster, setRoster] = useState<ShiftRosterEntry[]>([]);
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplateRow[]>([]);
  const [specialDays, setSpecialDays] = useState<SpecialDayRow[]>([]);
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const { weeks, fromDate, toDate } = useMemo(
    () => buildIctMonthCalendar(viewedMonth),
    [viewedMonth],
  );
  const monthDays = useMemo(
    () => weeks.flat().filter((day): day is string => day !== null),
    [weeks],
  );

  // The calendar is a TEAM ROSTER: the roster route returns every member's
  // coverage, but only safe fields (no attendance, no pay).
  const reloadRoster = async () => {
    try {
      setRoster(await fetchRoster({ fromDate, toDate }));
      setLoadError(null);
    } catch (error) {
      setLoadError(readErrorText(error));
    }
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await reloadRoster();
      setIsLoading(false);
    };

    void load();
  }, [fromDate, toDate]);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const catalog = await fetchCatalog();

        setShiftTemplates(catalog.shiftTemplates);
        setSpecialDays(catalog.specialDays);
      } catch (error) {
        setLoadError(readErrorText(error));
      }

      try {
        setCurrentMemberId((await fetchMembers()).workspaceMemberId);
      } catch {
        setCurrentMemberId(null);
      }
    };

    void loadCatalog();
  }, []);

  const templatesById = useMemo(() => {
    const map: Record<string, ShiftTemplateRow> = {};

    for (const template of shiftTemplates) {
      map[template.id] = template;
    }

    return map;
  }, [shiftTemplates]);

  // Whole-team roster grouped by day (the route already excludes cancelled
  // shifts, so every entry here is live coverage from some member).
  const registeredByDate = useMemo(() => {
    const map: Record<string, ShiftRosterEntry[]> = {};

    for (const entry of roster) {
      (map[entry.date] ??= []).push(entry);
    }

    // Order each day's coverage 0 -> 24h so the calendar reads top-to-bottom by
    // shift start (nulls, a deactivated template, sink to the bottom).
    for (const entries of Object.values(map)) {
      entries.sort((first, second) =>
        (first.startTime ?? '99:99').localeCompare(second.startTime ?? '99:99'),
      );
    }

    return map;
  }, [roster]);

  // Which days of the viewed month are special: SPECIFIC by exact date, YEARLY
  // by month/day — mirrors the rate multiplier the route stamps.
  const specialDayDates = useMemo(
    () => computeSpecialDayDatesInWeek({ specialDays, days: monthDays }),
    [monthDays, specialDays],
  );

  const weekdayHeaders = [
    t('Mon'),
    t('Tue'),
    t('Wed'),
    t('Thu'),
    t('Fri'),
    t('Sat'),
    t('Sun'),
  ];

  const selectedDayTemplates =
    selectedDay === null
      ? []
      : getApplicableTemplatesForDay({
          templates: shiftTemplates,
          day: selectedDay,
          weekdayIndex: getWeekdayIndex(selectedDay),
          isSpecialDay: specialDayDates.has(selectedDay),
        });

  // Only the current member's OWN registrations disable a day's checkboxes — a
  // slot another member took is still selectable here, and the route rejects a
  // genuine clash.
  const selectedDayRegisteredIds = useMemo(() => {
    if (selectedDay === null || currentMemberId === null) {
      return new Set<string>();
    }

    return new Set(
      roster
        .filter(
          (entry) =>
            entry.date === selectedDay && entry.memberId === currentMemberId,
        )
        .map((entry) => entry.shiftTemplateId)
        .filter((templateId): templateId is string => templateId !== null),
    );
  }, [roster, selectedDay, currentMemberId]);

  const handleRegisterForDay = async (date: string, templateIds: string[]) => {
    setIsRegistering(true);
    try {
      const result = await registerShiftsForDay(date, templateIds);

      if (result.successCount > 0) {
        void enqueueSnackbar({
          variant: 'success',
          message: t('Registered {count} shift(s).', {
            count: result.successCount,
          }),
        });
      }

      if (result.errors.length > 0) {
        void enqueueSnackbar({
          variant: 'error',
          message: t('{count} shift(s) could not be registered.', {
            count: result.errors.length,
          }),
        });
      }

      await reloadRoster();

      return result;
    } catch (error) {
      void enqueueSnackbar({
        variant: 'error',
        message: readErrorText(error),
      });

      return { successCount: 0, errors: [] };
    } finally {
      setIsRegistering(false);
    }
  };

  const renderBody = () => {
    if (isLoading && roster.length === 0 && shiftTemplates.length === 0) {
      return <ShiftStateMessage message={t('Loading…')} />;
    }

    if (loadError !== null && roster.length === 0) {
      return (
        <ShiftStateMessage
          message={t("Couldn't load registration.")}
          action={
            <ShiftButton variant="primary" onClick={() => void reloadRoster()}>
              {t('Retry')}
            </ShiftButton>
          }
        />
      );
    }

    return (
      <div
        style={{ display: 'flex', flexDirection: 'column', overflowX: 'auto' }}
      >
        <ShiftRegisterMonthCalendar
          weeks={weeks}
          today={today}
          weekdayHeaders={weekdayHeaders}
          registeredByDate={registeredByDate}
          templatesById={templatesById}
          currentMemberId={currentMemberId}
          specialDayDates={specialDayDates}
          onSelectDay={setSelectedDay}
        />
      </div>
    );
  };

  return (
    <ShiftPage
      title={t('Register shifts')}
      subtitle={getMonthLabel(viewedMonth)}
      actions={
        <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
          <ShiftButton
            ariaLabel={t('Previous month')}
            startIcon={<IconChevronLeft size={14} />}
            // Never register into a past month.
            isDisabled={viewedMonth <= currentMonth}
            onClick={() =>
              setViewedMonth((previous) => {
                const candidate = addMonthsToMonthValue(previous, -1);

                return candidate < currentMonth ? currentMonth : candidate;
              })
            }
          />
          <span style={{ color: SHIFT_TOKENS.textTertiary, fontSize: 12 }}>
            {getMonthLabel(viewedMonth)}
          </span>
          <ShiftButton
            ariaLabel={t('Next month')}
            startIcon={<IconChevronRight size={14} />}
            onClick={() =>
              setViewedMonth((previous) => addMonthsToMonthValue(previous, 1))
            }
          />
        </div>
      }
    >
      {renderBody()}
      {selectedDay === null ? null : (
        <ShiftRegisterDayModal
          dayLabel={`${weekdayHeaders[getWeekdayIndex(selectedDay)]} ${selectedDay}`}
          templates={selectedDayTemplates}
          registeredTemplateIds={selectedDayRegisteredIds}
          isRegistering={isRegistering}
          onRegister={(templateIds) =>
            handleRegisterForDay(selectedDay, templateIds)
          }
          onClose={() => setSelectedDay(null)}
        />
      )}
    </ShiftPage>
  );
};

export default defineFrontComponent({
  universalIdentifier: REGISTER_FRONT_COMPONENT_UID,
  name: 'shift-register',
  description:
    'Register: a month calendar of the team roster, with a per-day shift picker.',
  component: Register,
});
