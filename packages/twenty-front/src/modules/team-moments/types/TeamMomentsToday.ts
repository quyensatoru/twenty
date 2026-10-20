export type TeamMomentsTodayKind =
  | 'BIRTHDAY'
  | 'ANNIVERSARY'
  | 'HOLIDAY'
  | 'CUSTOM';

export type TeamMomentsAudience = 'EVERYONE' | 'WOMEN' | 'MEN';

export type TeamMomentsToday = {
  key: string;
  kind: TeamMomentsTodayKind;
  name: string;
  memberId: string | null;
  years: number | null;
  audience: TeamMomentsAudience;
  honoreeIds: string[];
};
