import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import {
  createStandardViewFieldFlatMetadata,
  type CreateStandardViewFieldArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field/create-standard-view-field-flat-metadata.util';

export const computeStandardSprintViewFields = (
  args: Omit<CreateStandardViewFieldArgs<'sprint'>, 'context'>,
): Record<string, FlatViewField> => {
  return {
    allSprintsName: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'sprint',
      context: {
        viewName: 'allSprints',
        viewFieldName: 'name',
        fieldName: 'name',
        position: 0,
        isVisible: true,
        size: 210,
      },
    }),
    allSprintsState: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'sprint',
      context: {
        viewName: 'allSprints',
        viewFieldName: 'state',
        fieldName: 'state',
        position: 1,
        isVisible: true,
        size: 150,
      },
    }),
    allSprintsProject: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'sprint',
      context: {
        viewName: 'allSprints',
        viewFieldName: 'project',
        fieldName: 'project',
        position: 2,
        isVisible: true,
        size: 150,
      },
    }),
    allSprintsStartDate: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'sprint',
      context: {
        viewName: 'allSprints',
        viewFieldName: 'startDate',
        fieldName: 'startDate',
        position: 3,
        isVisible: true,
        size: 150,
      },
    }),
    allSprintsCreatedAt: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'sprint',
      context: {
        viewName: 'allSprints',
        viewFieldName: 'createdAt',
        fieldName: 'createdAt',
        position: 4,
        isVisible: true,
        size: 150,
      },
    }),
  };
};
