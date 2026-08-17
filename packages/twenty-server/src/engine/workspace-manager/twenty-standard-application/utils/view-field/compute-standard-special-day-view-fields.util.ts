import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import {
  createStandardViewFieldFlatMetadata,
  type CreateStandardViewFieldArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field/create-standard-view-field-flat-metadata.util';

export const computeStandardSpecialDayViewFields = (
  args: Omit<CreateStandardViewFieldArgs<'specialDay'>, 'context'>,
): Record<string, FlatViewField> => {
  return {
    allSpecialDaysName: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'specialDay',
      context: {
        viewName: 'allSpecialDays',
        viewFieldName: 'name',
        fieldName: 'name',
        position: 0,
        isVisible: true,
        size: 210,
      },
    }),
    allSpecialDaysKind: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'specialDay',
      context: {
        viewName: 'allSpecialDays',
        viewFieldName: 'kind',
        fieldName: 'kind',
        position: 1,
        isVisible: true,
        size: 150,
      },
    }),
    allSpecialDaysMonth: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'specialDay',
      context: {
        viewName: 'allSpecialDays',
        viewFieldName: 'month',
        fieldName: 'month',
        position: 2,
        isVisible: true,
        size: 150,
      },
    }),
    allSpecialDaysDay: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'specialDay',
      context: {
        viewName: 'allSpecialDays',
        viewFieldName: 'day',
        fieldName: 'day',
        position: 3,
        isVisible: true,
        size: 150,
      },
    }),
    allSpecialDaysDate: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'specialDay',
      context: {
        viewName: 'allSpecialDays',
        viewFieldName: 'date',
        fieldName: 'date',
        position: 4,
        isVisible: true,
        size: 150,
      },
    }),
    allSpecialDaysMultiplier: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'specialDay',
      context: {
        viewName: 'allSpecialDays',
        viewFieldName: 'multiplier',
        fieldName: 'multiplier',
        position: 5,
        isVisible: true,
        size: 150,
      },
    }),
    allSpecialDaysIsActive: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'specialDay',
      context: {
        viewName: 'allSpecialDays',
        viewFieldName: 'isActive',
        fieldName: 'isActive',
        position: 6,
        isVisible: true,
        size: 150,
      },
    }),
  };
};
