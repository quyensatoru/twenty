export type ShiftTemplateRow = {
  id: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  dayKind: string | null;
  earlyCheckInMinutes: number | null;
  lateCheckOutMinutes: number | null;
  salaryPerHour: number | null;
  color: string | null;
  isActive: boolean;
};
