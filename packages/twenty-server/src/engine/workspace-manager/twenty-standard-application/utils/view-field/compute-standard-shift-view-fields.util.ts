import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import {
  createStandardViewFieldFlatMetadata,
  type CreateStandardViewFieldArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field/create-standard-view-field-flat-metadata.util';

export const computeStandardShiftViewFields = (
  args: Omit<CreateStandardViewFieldArgs<'shift'>, 'context'>,
): Record<string, FlatViewField> => {
  return {
    allShiftsName: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'shift',
      context: {
        viewName: 'allShifts',
        viewFieldName: 'name',
        fieldName: 'name',
        position: 0,
        isVisible: true,
        size: 210,
      },
    }),
    allShiftsDate: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'shift',
      context: {
        viewName: 'allShifts',
        viewFieldName: 'date',
        fieldName: 'date',
        position: 1,
        isVisible: true,
        size: 150,
      },
    }),
    allShiftsStatus: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'shift',
      context: {
        viewName: 'allShifts',
        viewFieldName: 'status',
        fieldName: 'status',
        position: 2,
        isVisible: true,
        size: 150,
      },
    }),
    allShiftsMember: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'shift',
      context: {
        viewName: 'allShifts',
        viewFieldName: 'member',
        fieldName: 'member',
        position: 3,
        isVisible: true,
        size: 150,
      },
    }),
    allShiftsTemplateCode: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'shift',
      context: {
        viewName: 'allShifts',
        viewFieldName: 'templateCode',
        fieldName: 'templateCode',
        position: 4,
        isVisible: true,
        size: 150,
      },
    }),
    allShiftsCheckInAt: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'shift',
      context: {
        viewName: 'allShifts',
        viewFieldName: 'checkInAt',
        fieldName: 'checkInAt',
        position: 5,
        isVisible: true,
        size: 150,
      },
    }),
    allShiftsCheckOutAt: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'shift',
      context: {
        viewName: 'allShifts',
        viewFieldName: 'checkOutAt',
        fieldName: 'checkOutAt',
        position: 6,
        isVisible: true,
        size: 150,
      },
    }),
    allShiftsCheckInLateMinutes: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'shift',
      context: {
        viewName: 'allShifts',
        viewFieldName: 'checkInLateMinutes',
        fieldName: 'checkInLateMinutes',
        position: 7,
        isVisible: true,
        size: 150,
      },
    }),
    allShiftsWorkingMinutes: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'shift',
      context: {
        viewName: 'allShifts',
        viewFieldName: 'workingMinutes',
        fieldName: 'workingMinutes',
        position: 8,
        isVisible: true,
        size: 150,
      },
    }),
  };
};
