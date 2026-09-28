import { useEffect, useMemo, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  AppPath,
  enqueueSnackbar,
  navigate,
  t,
} from 'twenty-sdk/front-component';

import {
  MY_WEEK_FRONT_COMPONENT_UID,
  REGISTER_PAGE_LAYOUT_UID,
} from '../constants/universal-identifiers';
import { type ShiftHandoverEntry } from '../types/shift-handover-entry';
import { type ShiftRow } from '../types/shift-row';
import { type ShiftTemplateRow } from '../types/shift-template-row';
import {
  addDaysToIsoDate,
  getIctWeekRange,
} from '../utils/shift-calendar.util';
import { getTodayIct, isShiftMissed } from '../utils/shift-time.util';
import { pickPrecedingHandover } from '../utils/shift-week.util';
import { ShiftButton } from './components/shift-button';
import { ShiftPage } from './components/shift-page';
import { ShiftStateMessage } from './components/shift-state-message';
import { ShiftTodayAction } from './components/shift-today-action';
import { SHIFT_TOKENS } from './components/shift-tokens';
import { ShiftWeekList } from './components/shift-week-list';
import { fetchCatalog } from './utils/fetch-catalog.util';
import { fetchHandovers } from './utils/fetch-handovers.util';
import { fetchMyShifts } from './utils/fetch-my-shifts.util';
import { readErrorText } from './utils/read-error-text.util';
import { resolvePageLayoutId } from './utils/resolve-page-layout-id.util';
import {
  cancelShift,
  checkInShift,
  checkOutShift,
} from './utils/shift-attendance.util';

const NEXT_WEEK_DAY_OFFSET = 7;

const byDayThenStart = (first: ShiftRow, second: ShiftRow): number =>
  first.date === second.date
    ? (first.startTime ?? '').localeCompare(second.startTime ?? '')
    : first.date.localeCompare(second.date);

const MyWeek = () => {
  const [shifts, setShifts] = useState<ShiftRow[]>([]);
  const [handovers, setHandovers] = useState<ShiftHandoverEntry[]>([]);
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplateRow[]>([]);
  const [registerPageLayoutId, setRegisterPageLayoutId] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // "Now" is captured once so the range stays stable across renders; `today`
  // (for the highlight) is the real current ICT day.
  const nowMillis = useMemo(() => Date.now(), []);
  const today = useMemo(() => getTodayIct(new Date(nowMillis)), [nowMillis]);

  // The window spans this ICT week plus the whole of next week, so a member
  // always sees what they've registered for both weeks without any navigation.
  const { fromDate, toDate } = useMemo(() => {
    const thisWeek = getIctWeekRange(new Date(nowMillis));

    return {
      fromDate: thisWeek.fromDate,
      toDate: addDaysToIsoDate(thisWeek.toDate, NEXT_WEEK_DAY_OFFSET),
    };
  }, [nowMillis]);

  const reload = async () => {
    try {
      const [myShifts, weekHandovers] = await Promise.all([
        fetchMyShifts({ fromDate, toDate }),
        fetchHandovers({ fromDate, toDate }),
      ]);

      setShifts(myShifts.shifts);
      setHandovers(weekHandovers);
      setLoadError(null);
    } catch (error) {
      setLoadError(readErrorText(error));
    }
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await reload();

      try {
        setShiftTemplates((await fetchCatalog()).shiftTemplates);
      } catch {
        setShiftTemplates([]);
      }

      setRegisterPageLayoutId(
        await resolvePageLayoutId(REGISTER_PAGE_LAYOUT_UID),
      );
      setIsLoading(false);
    };

    void load();
  }, [fromDate, toDate]);

  const templateById = useMemo(() => {
    const map: Record<string, ShiftTemplateRow> = {};

    for (const template of shiftTemplates) {
      map[template.id] = template;
    }

    return map;
  }, [shiftTemplates]);

  // The right column is a "what's left to act on" list: in-progress shifts and
  // still-upcoming shifts that haven't passed. Completed, cancelled and missed
  // shifts drop out — they live on the Report page. Ordered by day then start.
  const upcomingShifts = useMemo(
    () =>
      [...shifts]
        .filter(
          (shift) =>
            shift.status === 'IN_PROGRESS' ||
            (shift.status === 'UPCOMING' && !isShiftMissed(shift)),
        )
        .sort(byDayThenStart),
    [shifts],
  );

  // The shift the action card focuses on: an in-progress shift (to check out),
  // otherwise the earliest still-upcoming shift that hasn't already passed (to
  // check in). A missed shift is skipped here so it never surfaces as "Up next"
  // with a stale check-in button.
  const actionableShift = useMemo(() => {
    const inProgress = shifts.find((shift) => shift.status === 'IN_PROGRESS');

    if (inProgress !== undefined) {
      return inProgress;
    }

    return (
      [...shifts]
        .filter((shift) => shift.status === 'UPCOMING' && !isShiftMissed(shift))
        .sort(byDayThenStart)[0] ?? null
    );
  }, [shifts]);

  const previousHandover = useMemo(
    () =>
      actionableShift === null
        ? null
        : pickPrecedingHandover({ shift: actionableShift, handovers }),
    [actionableShift, handovers],
  );

  const weekdayLabels = [
    t('Mon'),
    t('Tue'),
    t('Wed'),
    t('Thu'),
    t('Fri'),
    t('Sat'),
    t('Sun'),
  ];

  const goToRegister = () => {
    if (registerPageLayoutId === null) {
      return;
    }

    void navigate(AppPath.PageLayoutPage, {
      pageLayoutId: registerPageLayoutId,
    });
  };

  const registerAction =
    registerPageLayoutId === null ? undefined : (
      <ShiftButton variant="primary" onClick={goToRegister}>
        {t('Register shifts')}
      </ShiftButton>
    );

  const handleCheckIn = async (shiftId: string) => {
    try {
      await checkInShift(shiftId);
      await reload();
      void enqueueSnackbar({ variant: 'success', message: t('Checked in.') });
    } catch (error) {
      void enqueueSnackbar({
        variant: 'error',
        message: readErrorText(error),
      });
    }
  };

  const handleCheckOut = async (
    shiftId: string,
    handoverNote: string | null,
  ) => {
    try {
      await checkOutShift(shiftId, handoverNote);
      await reload();
      void enqueueSnackbar({ variant: 'success', message: t('Checked out.') });
    } catch (error) {
      void enqueueSnackbar({
        variant: 'error',
        message: readErrorText(error),
      });
      // Rethrow so the modal keeps the typed handover note instead of clearing it.
      throw error;
    }
  };

  const handleCancel = async (
    shiftId: string,
    reason: string,
    category: string,
  ) => {
    try {
      await cancelShift(shiftId, reason, category);
      await reload();
      void enqueueSnackbar({
        variant: 'success',
        message: t('Shift cancelled.'),
      });
    } catch (error) {
      void enqueueSnackbar({
        variant: 'error',
        message: readErrorText(error),
      });
      // Rethrow so the modal keeps the typed reason and category.
      throw error;
    }
  };

  const renderBody = () => {
    if (isLoading && shifts.length === 0) {
      return <ShiftStateMessage message={t('Loading…')} />;
    }

    // A failed load shows retry; only a genuine empty week shows the CTA.
    if (shifts.length === 0) {
      return loadError === null ? (
        <ShiftStateMessage
          message={t('No shifts registered for this week or next.')}
          action={registerAction}
        />
      ) : (
        <ShiftStateMessage
          message={t("Couldn't load your shifts.")}
          action={
            <ShiftButton variant="primary" onClick={() => void reload()}>
              {t('Retry')}
            </ShiftButton>
          }
        />
      );
    }

    return (
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          minHeight: 0,
        }}
      >
        <div style={{ flexShrink: 0, minWidth: 280, width: 340 }}>
          <ShiftTodayAction
            shift={actionableShift}
            template={
              actionableShift?.shiftTemplateId == null
                ? undefined
                : templateById[actionableShift.shiftTemplateId]
            }
            previousHandover={previousHandover}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
          />
        </div>
        <div style={{ flex: 1, minWidth: 320 }}>
          <ShiftWeekList
            shifts={upcomingShifts}
            today={today}
            weekdayLabels={weekdayLabels}
            templateById={templateById}
            emptyAction={registerAction}
            onCancel={handleCancel}
          />
        </div>
      </div>
    );
  };

  return (
    <ShiftPage
      title={t('My Week')}
      subtitle={`${fromDate} → ${toDate}`}
      actions={
        <span style={{ color: SHIFT_TOKENS.textTertiary, fontSize: 12 }}>
          {t('This week and next')}
        </span>
      }
    >
      {renderBody()}
    </ShiftPage>
  );
};

export default defineFrontComponent({
  universalIdentifier: MY_WEEK_FRONT_COMPONENT_UID,
  name: 'shift-my-week',
  description:
    'My Week: the shift to check in or out of, and the rest of the week to act on.',
  component: MyWeek,
});
