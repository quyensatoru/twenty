import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

export type SpecialDayRecord = ObjectRecord & {
  name: string;
  // 'YEARLY' matches by month/day every year; 'SPECIFIC' matches an exact date.
  kind: string;
  month: number | null;
  day: number | null;
  date: string | null;
  multiplier: number;
  isActive: boolean;
};

export const useSpecialDays = () => {
  const { records: specialDays, loading } =
    useFindManyRecords<SpecialDayRecord>({
      objectNameSingular: 'specialDay',
      filter: { isActive: { eq: true } },
      recordGqlFields: {
        id: true,
        name: true,
        kind: true,
        month: true,
        day: true,
        date: true,
        multiplier: true,
        isActive: true,
      },
      limit: 100,
    });

  return { specialDays, loading };
};
