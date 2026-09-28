import { REGISTER_SHIFTS_ROUTE_PATH } from '../../constants/route-paths';
import { postAppRoute } from './post-app-route.util';

export type ShiftRegistrationTemplateError = {
  templateId: string;
  message: string;
};

export type ShiftDayRegistrationResult = {
  successCount: number;
  errors: ShiftRegistrationTemplateError[];
};

export const registerShiftsForDay = async (
  date: string,
  templateIds: string[],
): Promise<ShiftDayRegistrationResult> => {
  const result = await postAppRoute<{
    success: true;
    successCount: number;
    errors: ShiftRegistrationTemplateError[];
  }>(REGISTER_SHIFTS_ROUTE_PATH, { date, templateIds });

  return {
    successCount: result.successCount ?? 0,
    errors: result.errors ?? [],
  };
};
