import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import {
  createStandardViewFieldFlatMetadata,
  type CreateStandardViewFieldArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field/create-standard-view-field-flat-metadata.util';

// salaryPerHour is DELIBERATELY not a column here — members must not see
// salary in the shift template catalog (business decision).
export const computeStandardShiftTemplateViewFields = (
  args: Omit<CreateStandardViewFieldArgs<'shiftTemplate'>, 'context'>,
): Record<string, FlatViewField> => {
  return {
    allShiftTemplatesName: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'shiftTemplate',
      context: {
        viewName: 'allShiftTemplates',
        viewFieldName: 'name',
        fieldName: 'name',
        position: 0,
        isVisible: true,
        size: 210,
      },
    }),
    allShiftTemplatesCode: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'shiftTemplate',
      context: {
        viewName: 'allShiftTemplates',
        viewFieldName: 'code',
        fieldName: 'code',
        position: 1,
        isVisible: true,
        size: 150,
      },
    }),
    allShiftTemplatesStartTime: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'shiftTemplate',
      context: {
        viewName: 'allShiftTemplates',
        viewFieldName: 'startTime',
        fieldName: 'startTime',
        position: 2,
        isVisible: true,
        size: 150,
      },
    }),
    allShiftTemplatesEndTime: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'shiftTemplate',
      context: {
        viewName: 'allShiftTemplates',
        viewFieldName: 'endTime',
        fieldName: 'endTime',
        position: 3,
        isVisible: true,
        size: 150,
      },
    }),
    allShiftTemplatesDayKind: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'shiftTemplate',
      context: {
        viewName: 'allShiftTemplates',
        viewFieldName: 'dayKind',
        fieldName: 'dayKind',
        position: 4,
        isVisible: true,
        size: 150,
      },
    }),
    allShiftTemplatesIsActive: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'shiftTemplate',
      context: {
        viewName: 'allShiftTemplates',
        viewFieldName: 'isActive',
        fieldName: 'isActive',
        position: 5,
        isVisible: true,
        size: 150,
      },
    }),
  };
};
