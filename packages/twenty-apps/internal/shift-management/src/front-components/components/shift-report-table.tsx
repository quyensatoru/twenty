import { Fragment } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconAlertTriangle } from 'twenty-ui/icon';

import { type ShiftRow } from '../../types/shift-row';
import { type ShiftTemplateRow } from '../../types/shift-template-row';
import {
  CHECK_OUT_DEVIATION_WARNING_MINUTES,
  getCheckOutDeviationMinutes,
  groupShiftsByWeek,
} from '../../utils/shift-report.util';
import {
  formatMinutesOfDay,
  formatWorkingHours,
  getIctMinutesOfDay,
  isShiftMissed,
} from '../../utils/shift-time.util';
import { ShiftCodeChip } from './shift-code-chip';
import { getShiftStatusTone, ShiftTag } from './shift-tag';
import { SHIFT_TOKENS } from './shift-tokens';

const HEAD_CELL_STYLE = {
  borderBottom: `1px solid ${SHIFT_TOKENS.border}`,
  color: SHIFT_TOKENS.textTertiary,
  fontSize: 11,
  fontWeight: 600,
  padding: '8px 12px',
  textAlign: 'left',
  whiteSpace: 'nowrap',
} as const;

const CELL_STYLE = {
  color: SHIFT_TOKENS.textSecondary,
  fontSize: 13,
  padding: '8px 12px',
  whiteSpace: 'nowrap',
} as const;

const formatInstantTime = (isoInstant: string | null): string =>
  isoInstant === null
    ? '—'
    : formatMinutesOfDay(getIctMinutesOfDay(new Date(isoInstant)));

const formatTimeWindow = (
  startTime: string | null,
  endTime: string | null,
): string =>
  startTime === null || endTime === null ? '—' : `${startTime} – ${endTime}`;

type ShiftReportRowProps = {
  shift: ShiftRow;
  template: ShiftTemplateRow | undefined;
};

const ShiftReportRow = ({ shift, template }: ShiftReportRowProps) => {
  // An UPCOMING shift whose window has fully elapsed with no check-in reads as
  // an absence, not a still-open "Upcoming" — the same inference the stat cards
  // count.
  const isMissed = isShiftMissed(shift);

  const statusLabel =
    shift.status === 'IN_PROGRESS'
      ? t('In progress')
      : shift.status === 'COMPLETED'
        ? t('Completed')
        : shift.status === 'CANCELLED'
          ? t('Cancelled')
          : isMissed
            ? t('Absent')
            : t('Upcoming');
  const statusTone = isMissed ? 'orange' : getShiftStatusTone(shift.status);

  const chipCode = shift.templateCode ?? template?.code ?? null;
  const shiftName = shift.templateName ?? template?.name ?? shift.name;

  const workingHours =
    shift.workingMinutes === null
      ? '—'
      : formatWorkingHours(shift.workingMinutes);

  const isOvertime = shift.rateMultiplier !== null && shift.rateMultiplier > 1;
  const multiplierLabel =
    shift.rateMultiplier === null ? '—' : `×${shift.rateMultiplier}`;

  const isLate =
    shift.checkInLateMinutes !== null && shift.checkInLateMinutes >= 1;

  const deviationMinutes = getCheckOutDeviationMinutes(shift);
  const hasCheckOutWarning =
    deviationMinutes !== null &&
    deviationMinutes > CHECK_OUT_DEVIATION_WARNING_MINUTES;

  return (
    <tr style={{ borderBottom: `1px solid ${SHIFT_TOKENS.borderLight}` }}>
      <td style={CELL_STYLE}>{shift.date}</td>
      <td style={CELL_STYLE}>
        <span style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
          {chipCode === null ? null : (
            <ShiftCodeChip code={chipCode} color={template?.color ?? null} />
          )}
          <span style={{ color: SHIFT_TOKENS.textPrimary }}>{shiftName}</span>
        </span>
      </td>
      <td style={CELL_STYLE}>
        {formatTimeWindow(shift.startTime, shift.endTime)}
      </td>
      <td style={CELL_STYLE}>
        <ShiftTag label={statusLabel} tone={statusTone} />
      </td>
      <td style={CELL_STYLE}>{formatInstantTime(shift.checkInAt)}</td>
      <td style={CELL_STYLE}>{formatInstantTime(shift.checkOutAt)}</td>
      <td style={CELL_STYLE}>{workingHours}</td>
      <td style={CELL_STYLE}>
        {isOvertime ? (
          <ShiftTag label={multiplierLabel} tone="orange" />
        ) : (
          multiplierLabel
        )}
      </td>
      <td style={CELL_STYLE}>
        <span style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
          {isLate ? (
            <ShiftTag
              label={t('Late +{minutes}′', {
                minutes: shift.checkInLateMinutes ?? 0,
              })}
              tone="red"
            />
          ) : null}
          {hasCheckOutWarning ? (
            <span
              title={t('Check-out is {minutes} min off the scheduled end', {
                minutes: Math.round(deviationMinutes),
              })}
              style={{
                alignItems: 'center',
                color: SHIFT_TOKENS.yellow,
                display: 'inline-flex',
              }}
            >
              <IconAlertTriangle size={16} />
            </span>
          ) : null}
        </span>
      </td>
    </tr>
  );
};

type ShiftReportTableProps = {
  shifts: ShiftRow[];
  templateById: Record<string, ShiftTemplateRow>;
};

export const ShiftReportTable = ({
  shifts,
  templateById,
}: ShiftReportTableProps) => {
  // Number weeks chronologically (Week 1 = earliest) but display the most
  // recent week first.
  const weekGroups = groupShiftsByWeek(shifts)
    .map((group, index) => ({ ...group, weekNumber: index + 1 }))
    .reverse();

  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <table
        style={{
          borderCollapse: 'collapse',
          fontFamily: SHIFT_TOKENS.fontFamily,
          minWidth: '100%',
        }}
      >
        <thead>
          <tr>
            <th style={HEAD_CELL_STYLE}>{t('Date')}</th>
            <th style={HEAD_CELL_STYLE}>{t('Shift')}</th>
            <th style={HEAD_CELL_STYLE}>{t('Time')}</th>
            <th style={HEAD_CELL_STYLE}>{t('Status')}</th>
            <th style={HEAD_CELL_STYLE}>{t('Check-in')}</th>
            <th style={HEAD_CELL_STYLE}>{t('Check-out')}</th>
            <th style={HEAD_CELL_STYLE}>{t('Working hours')}</th>
            <th style={HEAD_CELL_STYLE}>{t('Multiplier')}</th>
            <th style={HEAD_CELL_STYLE}>{t('Flags')}</th>
          </tr>
        </thead>
        <tbody>
          {weekGroups.map((group) => (
            <Fragment key={group.weekStart}>
              <tr
                style={{
                  background: SHIFT_TOKENS.backgroundTertiary,
                  borderBottom: `1px solid ${SHIFT_TOKENS.border}`,
                }}
              >
                <td colSpan={9} style={{ padding: '8px 12px' }}>
                  <span
                    style={{
                      alignItems: 'center',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 16,
                      justifyContent: 'space-between',
                    }}
                  >
                    <span
                      style={{
                        alignItems: 'baseline',
                        display: 'flex',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          color: SHIFT_TOKENS.textPrimary,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {t('Week {number}', { number: group.weekNumber })}
                      </span>
                      <span
                        style={{
                          color: SHIFT_TOKENS.textTertiary,
                          fontSize: 12,
                        }}
                      >
                        {`${group.weekStart} → ${group.weekEnd}`}
                      </span>
                    </span>
                    <span
                      style={{
                        color: SHIFT_TOKENS.textTertiary,
                        display: 'flex',
                        fontSize: 12,
                        gap: 16,
                      }}
                    >
                      <span>
                        {`${t('Registered')} `}
                        <span
                          style={{
                            color: SHIFT_TOKENS.textPrimary,
                            fontWeight: 600,
                          }}
                        >
                          {`${group.registeredHours.toFixed(2)}h`}
                        </span>
                      </span>
                      <span>
                        {`${t('Working')} `}
                        <span
                          style={{
                            color: SHIFT_TOKENS.textPrimary,
                            fontWeight: 600,
                          }}
                        >
                          {`${group.workingHours.toFixed(2)}h`}
                        </span>
                      </span>
                    </span>
                  </span>
                </td>
              </tr>
              {group.shifts.map((shift) => (
                <ShiftReportRow
                  key={shift.id}
                  shift={shift}
                  template={
                    shift.shiftTemplateId === null
                      ? undefined
                      : templateById[shift.shiftTemplateId]
                  }
                />
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};
