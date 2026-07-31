import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import {
  createStandardViewFieldFlatMetadata,
  type CreateStandardViewFieldArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field/create-standard-view-field-flat-metadata.util';

export const computeStandardMerchantViewFields = (
  args: Omit<CreateStandardViewFieldArgs<'merchant'>, 'context'>,
): Record<string, FlatViewField> => {
  return {
    allMerchantsName: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'merchant',
      context: {
        viewName: 'allMerchants',
        viewFieldName: 'name',
        fieldName: 'name',
        position: 0,
        isVisible: true,
        size: 210,
      },
    }),
    allMerchantsCreatedAt: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'merchant',
      context: {
        viewName: 'allMerchants',
        viewFieldName: 'createdAt',
        fieldName: 'createdAt',
        position: 1,
        isVisible: true,
        size: 150,
      },
    }),
  };
};
