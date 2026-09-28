import { useEffect, useState } from 'react';
import { t } from 'twenty-sdk/front-component';

import { type ShiftHandoverEntry } from '../../types/shift-handover-entry';
import { type ShiftRow } from '../../types/shift-row';
import { type ShiftTemplateRow } from '../../types/shift-template-row';
import {
  getCheckInOpensAtLabel,
  isCheckInWindowOpen,
} from '../../utils/shift-time.util';
import { CheckOutModal } from './check-out-modal';
import { ShiftButton } from './shift-button';
import { ShiftSection } from './shift-card';
import { getShiftStatusTone, ShiftTag } from './shift-tag';
import { SHIFT_TOKENS } from './shift-tokens';

const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_MINUTE = 60;

const formatTimeWindow = (
  startTime: string | null,
  endTime: string | null,
): string | null =>
  startTime === null || endTime === null ? null : `${startTime} – ${endTime}`;

const formatElapsed = (elapsedSeconds: number): string => {
  const hours = Math.floor(elapsedSeconds / SECONDS_PER_HOUR);
  const minutes = Math.floor(
    (elapsedSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE,
  );
  const seconds = elapsedSeconds % SECONDS_PER_MINUTE;

  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
};

const formatHandoverMeta = (handover: ShiftHandoverEntry): string =>
  [
    handover.templateCode,
    handover.memberName,
    handover.startTime === null || handover.endTime === null
      ? null
      : `${handover.startTime} – ${handover.endTime}`,
  ]
    .filter((part): part is string => part !== null)
    .join(' · ');

// Live elapsed time since check-in, ticking every second — a running clock that
// tells the member how long they've been on shift.
const ShiftElapsedTimer = ({ checkInAt }: { checkInAt: string }) => {
  const [nowMillis, setNowMillis] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = setInterval(
      () => setNowMillis(Date.now()),
      MILLISECONDS_PER_SECOND,
    );

    return () => clearInterval(intervalId);
  }, []);

  const elapsedSeconds = Math.max(
    0,
    Math.floor(
      (nowMillis - new Date(checkInAt).getTime()) / MILLISECONDS_PER_SECOND,
    ),
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span
        style={{
          color: SHIFT_TOKENS.textTertiary,
          fontSize: 11,
          textTransform: 'uppercase',
        }}
      >
        {t('On shift for')}
      </span>
      <span
        style={{
          color: SHIFT_TOKENS.textPrimary,
          fontSize: 32,
          fontWeight: 600,
          letterSpacing: '0.02em',
        }}
      >
        {formatElapsed(elapsedSeconds)}
      </span>
    </div>
  );
};

type ShiftTodayActionProps = {
  shift: ShiftRow | null;
  template: ShiftTemplateRow | undefined;
  previousHandover: ShiftHandoverEntry | null;
  onCheckIn: (shiftId: string) => Promise<void>;
  onCheckOut: (shiftId: string, handoverNote: string | null) => Promise<void>;
};

export const ShiftTodayAction = ({
  shift,
  template,
  previousHandover,
  onCheckIn,
  onCheckOut,
}: ShiftTodayActionProps) => {
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);

  if (shift === null) {
    return (
      <ShiftSection title={t('Up next')}>
        <p
          style={{
            color: SHIFT_TOKENS.textTertiary,
            fontSize: 13,
            margin: 0,
          }}
        >
          {t('No upcoming shift to check in.')}
        </p>
      </ShiftSection>
    );
  }

  const isInProgress = shift.status === 'IN_PROGRESS';
  const timeWindow = formatTimeWindow(shift.startTime, shift.endTime);
  const earlyCheckInMinutes = template?.earlyCheckInMinutes ?? null;
  const canCheckIn = isCheckInWindowOpen({
    date: shift.date,
    startTime: shift.startTime,
    endTime: shift.endTime,
    earlyCheckInMinutes,
  });
  const opensAtLabel =
    shift.startTime === null
      ? null
      : getCheckInOpensAtLabel(shift.startTime, earlyCheckInMinutes);

  // Once the check-in window is open the card reads "Awaiting check-in" (action
  // due now) rather than a passive "Upcoming".
  const statusLabel = isInProgress
    ? t('In progress')
    : canCheckIn
      ? t('Awaiting check-in')
      : t('Upcoming');
  const statusTone =
    !isInProgress && canCheckIn ? 'yellow' : getShiftStatusTone(shift.status);

  const handleCheckIn = async () => {
    setIsCheckingIn(true);
    try {
      await onCheckIn(shift.id);
    } finally {
      setIsCheckingIn(false);
    }
  };

  return (
    <ShiftSection title={isInProgress ? t('Current shift') : t('Up next')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
          <span
            style={{
              color: SHIFT_TOKENS.textPrimary,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {shift.name}
          </span>
          <ShiftTag label={statusLabel} tone={statusTone} />
        </div>
        {timeWindow === null ? null : (
          <span
            style={{ color: SHIFT_TOKENS.textSecondary, fontSize: 12 }}
          >
            {timeWindow}
          </span>
        )}
      </div>
      {isInProgress && shift.checkInAt !== null ? (
        <ShiftElapsedTimer checkInAt={shift.checkInAt} />
      ) : null}
      {isInProgress ? (
        <ShiftButton
          variant="danger"
          isFullWidth
          onClick={() => setIsCheckOutOpen(true)}
        >
          {t('Check out')}
        </ShiftButton>
      ) : (
        <ShiftButton
          variant="primary"
          isFullWidth
          onClick={() => void handleCheckIn()}
          isDisabled={!canCheckIn || isCheckingIn}
          title={
            canCheckIn || opensAtLabel === null
              ? undefined
              : t('Opens at {opensAt}', { opensAt: opensAtLabel })
          }
        >
          {t('Check in')}
        </ShiftButton>
      )}
      {previousHandover === null ? null : (
        <div
          style={{
            borderTop: `1px solid ${SHIFT_TOKENS.borderLight}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            paddingTop: 12,
          }}
        >
          <span
            style={{
              color: SHIFT_TOKENS.textTertiary,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {t('Handover from previous shift')}
          </span>
          <p
            style={{
              color: SHIFT_TOKENS.textPrimary,
              fontSize: 13,
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {previousHandover.handoverNote}
          </p>
          <span style={{ color: SHIFT_TOKENS.textTertiary, fontSize: 11 }}>
            {formatHandoverMeta(previousHandover)}
          </span>
        </div>
      )}
      {isCheckOutOpen ? (
        <CheckOutModal
          shiftName={shift.name}
          onConfirm={(handoverNote) => onCheckOut(shift.id, handoverNote)}
          onClose={() => setIsCheckOutOpen(false)}
        />
      ) : null}
    </ShiftSection>
  );
};
