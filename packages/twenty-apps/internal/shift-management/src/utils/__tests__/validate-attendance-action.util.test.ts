import { describe, expect, it } from 'vitest';

import { type ShiftRow } from '../../types/shift-row';
import { getTodayIct } from '../shift-time.util';
import {
  validateCancel,
  validateCheckIn,
  validateCheckOut,
} from '../validate-attendance-action.util';

// The early-check-in guard only fires on the shift's own ICT day, so the
// fixtures are anchored on today and `now` is built as an explicit +07:00
// wall-clock instant rather than by faking the clock.
const todayIct = getTodayIct();
const ictInstant = (hhmm: string): Date =>
  new Date(`${todayIct}T${hhmm}:00+07:00`);

const buildShift = (overrides: Partial<ShiftRow> = {}): ShiftRow => ({
  id: 'shift-1',
  name: 'SAE-TT-C',
  date: todayIct,
  status: 'UPCOMING',
  templateCode: 'SAE-TT-C',
  templateName: 'Ca chiều',
  startTime: '14:00',
  endTime: '19:00',
  checkInAt: null,
  checkOutAt: null,
  checkInLateMinutes: null,
  workingMinutes: null,
  rateMultiplier: null,
  handoverNote: null,
  cancelReason: null,
  cancelCategory: null,
  cancelledAt: null,
  memberId: 'member-1',
  shiftTemplateId: 'template-1',
  ...overrides,
});

describe('validateCheckIn', () => {
  it('rejects when the shift is not UPCOMING', () => {
    const outcome = validateCheckIn({
      shift: buildShift({ status: 'COMPLETED' }),
      earlyCheckInMinutes: 15,
      now: ictInstant('14:00'),
    });

    expect(outcome).toEqual({
      ok: false,
      error: 'Shift is not open for check-in.',
    });
  });

  it('rejects before the early window opens', () => {
    // 14:00 start with 15 minutes of padding opens at 13:45 ICT.
    const outcome = validateCheckIn({
      shift: buildShift(),
      earlyCheckInMinutes: 15,
      now: ictInstant('13:00'),
    });

    expect(outcome.ok).toBe(false);
    expect(!outcome.ok && outcome.error).toContain('Too early to check in');
    expect(!outcome.ok && outcome.error).toContain('13:45');
  });

  it('rejects after the scheduled window has ended, even with no early padding', () => {
    const outcome = validateCheckIn({
      shift: buildShift(),
      earlyCheckInMinutes: null,
      now: ictInstant('20:00'),
    });

    expect(outcome.ok).toBe(false);
    expect(!outcome.ok && outcome.error).toContain('Too late to check in');
  });

  it('stamps checkInAt, the NO-grace late flag and moves to IN_PROGRESS', () => {
    const now = ictInstant('14:02');
    const outcome = validateCheckIn({
      shift: buildShift(),
      earlyCheckInMinutes: 15,
      now,
    });

    expect(outcome).toEqual({
      ok: true,
      patch: {
        checkInAt: now.toISOString(),
        status: 'IN_PROGRESS',
        checkInLateMinutes: 2,
      },
    });
  });

  it('stores checkInLateMinutes: null when on time or early', () => {
    const outcome = validateCheckIn({
      shift: buildShift(),
      earlyCheckInMinutes: 15,
      now: ictInstant('14:00'),
    });

    expect(outcome.ok && outcome.patch.checkInLateMinutes).toBeNull();
  });

  it('rejects when already checked in', () => {
    const outcome = validateCheckIn({
      shift: buildShift({ checkInAt: ictInstant('14:00').toISOString() }),
      earlyCheckInMinutes: 15,
      now: ictInstant('14:05'),
    });

    expect(outcome).toEqual({ ok: false, error: 'Already checked in.' });
  });
});

describe('validateCheckOut', () => {
  it('computes capped payable minutes and completes the shift', () => {
    // Checked in 14:00, out 20:30 -> elapsed 390, capped to the 300-minute window.
    const now = ictInstant('20:30');
    const outcome = validateCheckOut({
      shift: buildShift({
        status: 'IN_PROGRESS',
        checkInAt: ictInstant('14:00').toISOString(),
      }),
      handoverNote: null,
      now,
    });

    expect(outcome).toEqual({
      ok: true,
      patch: {
        checkOutAt: now.toISOString(),
        status: 'COMPLETED',
        workingMinutes: 300,
      },
    });
  });

  it('persists the handover note when provided', () => {
    const outcome = validateCheckOut({
      shift: buildShift({
        status: 'IN_PROGRESS',
        checkInAt: ictInstant('14:00').toISOString(),
      }),
      handoverNote: 'Handed over inventory count',
      now: ictInstant('19:05'),
    });

    expect(outcome.ok && outcome.patch.handoverNote).toBe(
      'Handed over inventory count',
    );
  });

  it('rejects when not checked in yet', () => {
    const outcome = validateCheckOut({
      shift: buildShift(),
      handoverNote: null,
      now: ictInstant('19:05'),
    });

    expect(outcome).toEqual({ ok: false, error: 'Not checked in yet.' });
  });

  it('rejects when already checked out', () => {
    const outcome = validateCheckOut({
      shift: buildShift({
        status: 'COMPLETED',
        checkInAt: ictInstant('14:00').toISOString(),
        checkOutAt: ictInstant('19:00').toISOString(),
      }),
      handoverNote: null,
      now: ictInstant('19:05'),
    });

    expect(outcome).toEqual({ ok: false, error: 'Already checked out.' });
  });
});

describe('validateCancel', () => {
  it('requires a reason of at least 10 characters', () => {
    const outcome = validateCancel({
      shift: buildShift(),
      reason: 'too short',
      category: 'SICK',
      now: ictInstant('09:00'),
    });

    expect(outcome.ok).toBe(false);
    expect(!outcome.ok && outcome.error).toContain('at least 10 characters');
  });

  it('requires a known category', () => {
    const outcome = validateCancel({
      shift: buildShift(),
      reason: 'a valid long reason',
      category: 'BOGUS',
      now: ictInstant('09:00'),
    });

    expect(outcome).toEqual({
      ok: false,
      error: 'Invalid cancel category: BOGUS',
    });
  });

  it('rejects an already-cancelled shift', () => {
    const outcome = validateCancel({
      shift: buildShift({ status: 'CANCELLED' }),
      reason: 'legitimate cancellation reason',
      category: 'SICK',
      now: ictInstant('09:00'),
    });

    expect(outcome).toEqual({
      ok: false,
      error: 'This shift is already cancelled.',
    });
  });

  it('rejects a completed shift', () => {
    const outcome = validateCancel({
      shift: buildShift({ status: 'COMPLETED' }),
      reason: 'legitimate cancellation reason',
      category: 'SICK',
      now: ictInstant('09:00'),
    });

    expect(outcome).toEqual({
      ok: false,
      error: 'Completed shifts cannot be cancelled.',
    });
  });

  it('rejects a shift whose window has already elapsed', () => {
    const outcome = validateCancel({
      shift: buildShift(),
      reason: 'legitimate cancellation reason',
      category: 'SICK',
      now: ictInstant('20:00'),
    });

    expect(outcome).toEqual({
      ok: false,
      error: 'This shift has already ended and can no longer be cancelled.',
    });
  });

  it('cancels an UPCOMING shift with reason, category and timestamp', () => {
    const now = ictInstant('09:00');
    const outcome = validateCancel({
      shift: buildShift(),
      reason: 'family emergency came up',
      category: 'PERSONAL',
      now,
    });

    expect(outcome).toEqual({
      ok: true,
      patch: {
        status: 'CANCELLED',
        cancelReason: 'family emergency came up',
        cancelCategory: 'PERSONAL',
        cancelledAt: now.toISOString(),
      },
    });
  });
});
