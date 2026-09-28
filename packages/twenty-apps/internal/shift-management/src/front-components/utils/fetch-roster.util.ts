import { SHIFT_ROSTER_ROUTE_PATH } from '../../constants/route-paths';
import { type ShiftRosterEntry } from '../../types/shift-roster-entry';
import { postAppRoute } from './post-app-route.util';

export const fetchRoster = async ({
  fromDate,
  toDate,
}: {
  fromDate: string;
  toDate: string;
}): Promise<ShiftRosterEntry[]> => {
  const result = await postAppRoute<{
    success: true;
    roster: ShiftRosterEntry[];
  }>(SHIFT_ROSTER_ROUTE_PATH, { fromDate, toDate });

  return result.roster ?? [];
};
