import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import {
  createStandardViewFieldFlatMetadata,
  type CreateStandardViewFieldArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field/create-standard-view-field-flat-metadata.util';

export const computeStandardAppAccessViewFields = (
  args: Omit<CreateStandardViewFieldArgs<'appAccess'>, 'context'>,
): Record<string, FlatViewField> => {
  return {
    // Label identifier for junction tables
    allAppAccessesId: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'appAccess',
      context: {
        viewName: 'allAppAccesses',
        viewFieldName: 'id',
        fieldName: 'id',
        position: 0,
        isVisible: true,
        size: 210,
      },
    }),
    allAppAccessesMember: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'appAccess',
      context: {
        viewName: 'allAppAccesses',
        viewFieldName: 'member',
        fieldName: 'member',
        position: 1,
        isVisible: true,
        size: 150,
      },
    }),
    allAppAccessesApp: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'appAccess',
      context: {
        viewName: 'allAppAccesses',
        viewFieldName: 'app',
        fieldName: 'app',
        position: 2,
        isVisible: true,
        size: 150,
      },
    }),
    allAppAccessesPermissions: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'appAccess',
      context: {
        viewName: 'allAppAccesses',
        viewFieldName: 'permissions',
        fieldName: 'permissions',
        position: 3,
        isVisible: true,
        size: 150,
      },
    }),
  };
};
