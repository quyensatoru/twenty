import { isDefined } from 'twenty-shared/utils';

import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

export type ShiftRecord = ObjectRecord & {
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
  cancelCategory: string | null;
  memberId: string | null;
  shiftTemplateId: string | null;
  member: {
    id: string;
    name?: { firstName?: string; lastName?: string };
    avatarUrl?: string | null;
  } | null;
};

export const useMyShifts = ({
  memberId,
  fromDate,
  toDate,
}: {
  memberId: string | undefined;
  fromDate: string;
  toDate: string;
}) => {
  const {
    records: shifts,
    loading,
    error,
    refetch,
  } = useFindManyRecords<ShiftRecord>({
    objectNameSingular: 'shift',
    // Twenty filters allow exactly one operator per field, so the date range
    // is expressed as an `and` of two single-operator clauses (not gte+lte on one field).
    filter: {
      and: [
        ...(isDefined(memberId) ? [{ memberId: { eq: memberId } }] : []),
        { date: { gte: fromDate } },
        { date: { lte: toDate } },
      ],
    },
    orderBy: [{ date: 'AscNullsLast' }],
    recordGqlFields: {
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
      cancelCategory: true,
      memberId: true,
      shiftTemplateId: true,
      member: { id: true, name: true, avatarUrl: true },
    },
    limit: 400,
    skip: !isDefined(memberId),
  });

  return { shifts, loading, error, refetch };
};
