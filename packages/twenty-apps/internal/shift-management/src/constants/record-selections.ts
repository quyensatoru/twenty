// GraphQL selection sets, in one place so a route can never accidentally widen
// what it reads. SHIFT_ROSTER_SELECTION and SHIFT_HANDOVER_SELECTION are the
// security boundary of the two team-visible routes: the columns they omit are
// never read out of the database at all.

export const SHIFT_SELECTION = {
  id: true,
  name: true,
  date: true,
  status: true,
  templateCode: true,
  templateName: true,
  startTime: true,
  endTime: true,
  checkInAt: true,
  checkOutAt: true,
  checkInLateMinutes: true,
  workingMinutes: true,
  rateMultiplier: true,
  handoverNote: true,
  cancelReason: true,
  cancelCategory: true,
  cancelledAt: true,
  memberId: true,
  shiftTemplateId: true,
} as const;

// SAFE FIELDS ONLY. No attendance (checkInAt/checkOutAt/checkInLateMinutes/
// workingMinutes/handoverNote), no cancel detail (cancelReason/cancelCategory),
// no pay (rateMultiplier).
export const SHIFT_ROSTER_SELECTION = {
  id: true,
  date: true,
  status: true,
  templateCode: true,
  templateName: true,
  startTime: true,
  endTime: true,
  shiftTemplateId: true,
  memberId: true,
} as const;

// handoverNote is the one sensitive-adjacent field this selection exposes
// (team-readable per BR-4.6); every attendance, cancel and pay column stays out.
export const SHIFT_HANDOVER_SELECTION = {
  id: true,
  date: true,
  startTime: true,
  endTime: true,
  templateCode: true,
  templateName: true,
  memberId: true,
  handoverNote: true,
} as const;

export const SHIFT_TEMPLATE_SELECTION = {
  id: true,
  name: true,
  code: true,
  startTime: true,
  endTime: true,
  dayKind: true,
  earlyCheckInMinutes: true,
  lateCheckOutMinutes: true,
  salaryPerHour: true,
  color: true,
  isActive: true,
} as const;

export const SPECIAL_DAY_SELECTION = {
  id: true,
  name: true,
  kind: true,
  month: true,
  day: true,
  date: true,
  multiplier: true,
  isActive: true,
} as const;
