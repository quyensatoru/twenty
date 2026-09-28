// Team-roster projection of a shift: ONLY non-sensitive coverage fields cross
// the route boundary. Attendance and pay fields (checkInAt, checkOutAt,
// checkInLateMinutes, workingMinutes, handoverNote, cancelReason,
// cancelCategory, rateMultiplier) are deliberately absent — they must never be
// selected into this shape. This is the security contract of /shift/roster.
export type ShiftRosterEntry = {
  id: string;
  date: string;
  status: string;
  templateCode: string | null;
  templateName: string | null;
  startTime: string | null;
  endTime: string | null;
  shiftTemplateId: string | null;
  memberId: string | null;
  memberName: string | null;
};
