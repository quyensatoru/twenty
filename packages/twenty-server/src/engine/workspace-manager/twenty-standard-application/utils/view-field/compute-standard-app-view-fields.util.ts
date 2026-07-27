import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import {
  createStandardViewFieldFlatMetadata,
  type CreateStandardViewFieldArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field/create-standard-view-field-flat-metadata.util';

export const computeStandardAppViewFields = (
  args: Omit<CreateStandardViewFieldArgs<'app'>, 'context'>,
): Record<string, FlatViewField> => {
  return {
    allAppsName: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'app',
      context: {
        viewName: 'allApps',
        viewFieldName: 'name',
        fieldName: 'name',
        position: 0,
        isVisible: true,
        size: 210,
      },
    }),
    allAppsCreatedAt: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'app',
      context: {
        viewName: 'allApps',
        viewFieldName: 'createdAt',
        fieldName: 'createdAt',
        position: 1,
        isVisible: true,
        size: 150,
      },
    }),
  };
};
