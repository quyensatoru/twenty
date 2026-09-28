// Every shift column the app reads. Mirrors the fork's ShiftRecord.
export type ShiftRow = {
  id: string;
  name: string;
  date: string;
  status: string;
  templateCode: string | null;
  templateName: string | null;
  startTime: string | null;
  endTime: string | null;
  checkInAt: string | null;
  checkOutAt: string | null;
  checkInLateMinutes: number | null;
  workingMinutes: number | null;
  rateMultiplier: number | null;
  handoverNote: string | null;
  cancelReason: string | null;
  cancelCategory: string | null;
  cancelledAt: string | null;
  memberId: string | null;
  shiftTemplateId: string | null;
};
