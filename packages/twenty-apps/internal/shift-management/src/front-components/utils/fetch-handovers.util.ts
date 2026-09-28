import { SHIFT_HANDOVERS_ROUTE_PATH } from '../../constants/route-paths';
import { type ShiftHandoverEntry } from '../../types/shift-handover-entry';
import { postAppRoute } from './post-app-route.util';

export const fetchHandovers = async ({
  fromDate,
  toDate,
}: {
  fromDate: string;
  toDate: string;
}): Promise<ShiftHandoverEntry[]> => {
  const result = await postAppRoute<{
    success: true;
    handovers: ShiftHandoverEntry[];
  }>(SHIFT_HANDOVERS_ROUTE_PATH, { fromDate, toDate });

  return result.handovers ?? [];
};
