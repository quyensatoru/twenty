import { MY_SHIFTS_ROUTE_PATH } from '../../constants/route-paths';
import { type ShiftRow } from '../../types/shift-row';
import { postAppRoute } from './post-app-route.util';

export const fetchMyShifts = async ({
  fromDate,
  toDate,
  memberId,
}: {
  fromDate: string;
  toDate: string;
  memberId?: string;
}): Promise<{ shifts: ShiftRow[]; memberId: string }> => {
  const result = await postAppRoute<{
    success: true;
    shifts: ShiftRow[];
    memberId: string;
  }>(MY_SHIFTS_ROUTE_PATH, { fromDate, toDate, memberId });

  return { shifts: result.shifts ?? [], memberId: result.memberId };
};
