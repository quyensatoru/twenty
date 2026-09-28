import { SHIFT_CATALOG_ROUTE_PATH } from '../../constants/route-paths';
import { type ShiftTemplateRow } from '../../types/shift-template-row';
import { type SpecialDayRow } from '../../types/special-day-row';
import { postAppRoute } from './post-app-route.util';

export type ShiftCatalog = {
  shiftTemplates: ShiftTemplateRow[];
  specialDays: SpecialDayRow[];
};

export const fetchCatalog = async (): Promise<ShiftCatalog> => {
  const result = await postAppRoute<{
    success: true;
    shiftTemplates: ShiftTemplateRow[];
    specialDays: SpecialDayRow[];
  }>(SHIFT_CATALOG_ROUTE_PATH);

  return {
    shiftTemplates: result.shiftTemplates ?? [],
    specialDays: result.specialDays ?? [],
  };
};
