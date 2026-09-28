import {
  CANCEL_SHIFT_ROUTE_PATH,
  CHECK_IN_ROUTE_PATH,
  CHECK_OUT_ROUTE_PATH,
} from '../../constants/route-paths';
import { postAppRoute } from './post-app-route.util';

export const checkInShift = async (shiftId: string): Promise<void> => {
  await postAppRoute(CHECK_IN_ROUTE_PATH, { shiftId });
};

export const checkOutShift = async (
  shiftId: string,
  handoverNote: string | null,
): Promise<void> => {
  await postAppRoute(CHECK_OUT_ROUTE_PATH, { shiftId, handoverNote });
};

export const cancelShift = async (
  shiftId: string,
  reason: string,
  category: string,
): Promise<void> => {
  await postAppRoute(CANCEL_SHIFT_ROUTE_PATH, { shiftId, reason, category });
};
