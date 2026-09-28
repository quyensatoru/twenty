export type SpecialDayRow = {
  id: string;
  name: string;
  // 'YEARLY' matches by month/day every year; 'SPECIFIC' matches an exact date.
  kind: string;
  month: number | null;
  day: number | null;
  date: string | null;
  multiplier: number;
  isActive: boolean;
};
