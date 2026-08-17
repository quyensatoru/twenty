import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

export type ShiftTemplateRecord = ObjectRecord & {
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

export const useShiftTemplates = () => {
  const { records: shiftTemplates, loading } =
    useFindManyRecords<ShiftTemplateRecord>({
      objectNameSingular: 'shiftTemplate',
      filter: { isActive: { eq: true } },
      orderBy: [{ code: 'AscNullsLast' }],
      recordGqlFields: {
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
      },
      limit: 100,
    });

  return { shiftTemplates, loading };
};
