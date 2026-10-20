import { type EventAudience } from './moments-records';

export type OccurrenceKind = 'BIRTHDAY' | 'ANNIVERSARY' | 'HOLIDAY' | 'CUSTOM';

export type Occurrence = {
  key: string;
  kind: OccurrenceKind;
  title: string;
  date: string;
  daysLeft: number;
  memberId: string | null;
  memberName: string | null;
  years: number | null;
  eventId: string | null;
  startTime: string | null;
  location: string | null;
  description: string | null;
  audience: EventAudience;
  // Members a gendered occasion celebrates; empty for an occasion for everyone.
  honoreeIds: string[];
};
