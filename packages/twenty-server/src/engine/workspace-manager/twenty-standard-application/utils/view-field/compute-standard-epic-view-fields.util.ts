import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import {
  createStandardViewFieldFlatMetadata,
  type CreateStandardViewFieldArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field/create-standard-view-field-flat-metadata.util';

export const computeStandardEpicViewFields = (
  args: Omit<CreateStandardViewFieldArgs<'epic'>, 'context'>,
): Record<string, FlatViewField> => {
  return {
    allEpicsName: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'epic',
      context: {
        viewName: 'allEpics',
        viewFieldName: 'name',
        fieldName: 'name',
        position: 0,
        isVisible: true,
        size: 210,
      },
    }),
    allEpicsProject: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'epic',
      context: {
        viewName: 'allEpics',
        viewFieldName: 'project',
        fieldName: 'project',
        position: 1,
        isVisible: true,
        size: 150,
      },
    }),
    allEpicsCreatedAt: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'epic',
      context: {
        viewName: 'allEpics',
        viewFieldName: 'createdAt',
        fieldName: 'createdAt',
        position: 2,
        isVisible: true,
        size: 150,
      },
    }),
  };
};
