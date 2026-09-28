import { useEffect, useMemo, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import { t } from 'twenty-sdk/front-component';
import { IconChevronLeft, IconChevronRight } from 'twenty-ui/icon';

import { ANALYTICS_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { type ShiftRosterEntry } from '../types/shift-roster-entry';
import {
  addMonthsToMonthValue,
  buildIctMonthCalendar,
  getIctMonthValue,
  getIctWeekRange,
  getMonthLabel,
} from '../utils/shift-calendar.util';
import {
  buildCoverageMatrix,
  computeAttendance,
} from '../utils/shift-coverage.util';
import { getTodayIct, MILLISECONDS_PER_DAY } from '../utils/shift-time.util';
import { ShiftButton } from './components/shift-button';
import { ShiftStatCard } from './components/shift-card';
import { ShiftCoverageMatrix } from './components/shift-coverage-matrix';
import { ShiftPage } from './components/shift-page';
import { ShiftStateMessage } from './components/shift-state-message';
import { SHIFT_TOKENS } from './components/shift-tokens';
import { fetchRoster } from './utils/fetch-roster.util';
import { readErrorText } from './utils/read-error-text.util';

const DAYS_PER_WEEK = 7;

type ViewMode = 'week' | 'month';

const Analytics = () => {
  const nowMillis = useMemo(() => Date.now(), []);
  const today = useMemo(() => getTodayIct(new Date(nowMillis)), [nowMillis]);
  const currentMonth = useMemo(() => getIctMonthValue(), []);

  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthValue, setMonthValue] = useState(currentMonth);
  const [roster, setRoster] = useState<ShiftRosterEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // The viewed range and its day columns, driven by the active view mode.
  const { fromDate, toDate, days } = useMemo(() => {
    if (viewMode === 'month') {
      const calendar = buildIctMonthCalendar(monthValue);

      return {
        fromDate: calendar.fromDate,
        toDate: calendar.toDate,
        days: calendar.weeks
          .flat()
          .filter((day): day is string => day !== null),
      };
    }

    return getIctWeekRange(
      new Date(nowMillis + weekOffset * DAYS_PER_WEEK * MILLISECONDS_PER_DAY),
    );
  }, [viewMode, monthValue, nowMillis, weekOffset]);

  const reload = async () => {
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
      await reload();
      setIsLoading(false);
    };

    void load();
  }, [fromDate, toDate]);

  const matrix = useMemo(
    () => buildCoverageMatrix({ roster, days }),
    [roster, days],
  );

  const attendance = useMemo(
    () => computeAttendance(roster, new Date(nowMillis)),
    [roster, nowMillis],
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

  const isAtAnchor =
    viewMode === 'week' ? weekOffset === 0 : monthValue === currentMonth;

  const rangeTitle =
    viewMode === 'month'
      ? getMonthLabel(monthValue)
      : weekOffset === 0
        ? t('This week')
        : weekOffset === 1
          ? t('Next week')
          : weekOffset === -1
            ? t('Last week')
            : t('Week');

  const goPrevious = () => {
    if (viewMode === 'month') {
      setMonthValue((previous) => addMonthsToMonthValue(previous, -1));
    } else {
      setWeekOffset((previous) => previous - 1);
    }
  };

  const goNext = () => {
    if (viewMode === 'month') {
      setMonthValue((previous) => addMonthsToMonthValue(previous, 1));
    } else {
      setWeekOffset((previous) => previous + 1);
    }
  };

  const goToAnchor = () => {
    if (viewMode === 'month') {
      setMonthValue(currentMonth);
    } else {
      setWeekOffset(0);
    }
  };

  return (
    <ShiftPage
      title={t('24/7 coverage')}
      subtitle={`${fromDate} → ${toDate}`}
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <ShiftButton
            variant={viewMode === 'week' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('week')}
          >
            {t('Week')}
          </ShiftButton>
          <ShiftButton
            variant={viewMode === 'month' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('month')}
          >
            {t('Month')}
          </ShiftButton>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
          <ShiftButton
            ariaLabel={
              viewMode === 'month' ? t('Previous month') : t('Previous week')
            }
            startIcon={<IconChevronLeft size={14} />}
            onClick={goPrevious}
          />
          <span
            style={{
              alignItems: 'baseline',
              display: 'flex',
              flex: 1,
              gap: 8,
            }}
          >
            <span
              style={{
                color: SHIFT_TOKENS.textPrimary,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {rangeTitle}
            </span>
            <span style={{ color: SHIFT_TOKENS.textTertiary, fontSize: 12 }}>
              {`${fromDate} → ${toDate}`}
            </span>
          </span>
          {isAtAnchor ? null : (
            <ShiftButton onClick={goToAnchor}>
              {viewMode === 'month' ? t('This month') : t('This week')}
            </ShiftButton>
          )}
          <ShiftButton
            ariaLabel={viewMode === 'month' ? t('Next month') : t('Next week')}
            startIcon={<IconChevronRight size={14} />}
            onClick={goNext}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <ShiftStatCard
            label={t('Coverage')}
            value={
              matrix.coveragePercent === null
                ? '—'
                : `${matrix.coveragePercent}%`
            }
          />
          <ShiftStatCard
            label={t('Attendance')}
            value={
              attendance.attendancePercent === null
                ? '—'
                : `${attendance.attendancePercent}%`
            }
          />
          <ShiftStatCard
            label={t('Gaps')}
            value={String(matrix.gapCount)}
            isAlert={matrix.gapCount > 0}
          />
          <ShiftStatCard
            label={t('Shifts')}
            value={String(matrix.totalShiftCount)}
          />
          <ShiftStatCard
            label={t('Staff')}
            value={String(matrix.staffCount)}
          />
        </div>

        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <span
            style={{
              alignItems: 'center',
              color: SHIFT_TOKENS.textSecondary,
              display: 'flex',
              fontSize: 12,
              gap: 4,
            }}
          >
            <span
              style={{
                background: SHIFT_TOKENS.greenSoft,
                border: `1px solid ${SHIFT_TOKENS.border}`,
                borderRadius: SHIFT_TOKENS.radiusSmall,
                height: 12,
                width: 12,
              }}
            />
            {t('Covered (staff on shift)')}
          </span>
          <span
            style={{
              alignItems: 'center',
              color: SHIFT_TOKENS.textSecondary,
              display: 'flex',
              fontSize: 12,
              gap: 4,
            }}
          >
            <span
              style={{
                background: SHIFT_TOKENS.redSoft,
                border: `1px solid ${SHIFT_TOKENS.border}`,
                borderRadius: SHIFT_TOKENS.radiusSmall,
                height: 12,
                width: 12,
              }}
            />
            {t('Gap — nobody on shift')}
          </span>
        </div>

        {isLoading && roster.length === 0 ? (
          <ShiftStateMessage message={t('Loading…')} />
        ) : loadError !== null && roster.length === 0 ? (
          <ShiftStateMessage
            message={t("Couldn't load coverage.")}
            action={
              <ShiftButton variant="primary" onClick={() => void reload()}>
                {t('Retry')}
              </ShiftButton>
            }
          />
        ) : (
          <ShiftCoverageMatrix
            matrix={matrix}
            days={days}
            weekdayLabels={weekdayLabels}
            today={today}
          />
        )}
      </div>
    </ShiftPage>
  );
};

export default defineFrontComponent({
  universalIdentifier: ANALYTICS_FRONT_COMPONENT_UID,
  name: 'shift-analytics',
  description:
    'Analytics: the 24/7 coverage matrix, its gaps and the team attendance ratio.',
  component: Analytics,
});
