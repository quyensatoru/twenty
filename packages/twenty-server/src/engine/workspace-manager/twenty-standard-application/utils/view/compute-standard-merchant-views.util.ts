import { ViewType, ViewKey } from 'twenty-shared/types';

import { type FlatView } from 'src/engine/metadata-modules/flat-view/types/flat-view.type';
import {
  createStandardViewFlatMetadata,
  type CreateStandardViewArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view/create-standard-view-flat-metadata.util';

export const computeStandardMerchantViews = (
  args: Omit<CreateStandardViewArgs<'merchant'>, 'context'>,
): Record<string, FlatView> => {
  return {
    allMerchants: createStandardViewFlatMetadata({
      ...args,
      objectName: 'merchant',
      context: {
        viewName: 'allMerchants',
        name: 'All {objectLabelPlural}',
        type: ViewType.TABLE,
        key: ViewKey.INDEX,
        position: 0,
        icon: 'IconList',
      },
    }),
    merchantRecordPageFields: createStandardViewFlatMetadata({
      ...args,
      objectName: 'merchant',
      context: {
        viewName: 'merchantRecordPageFields',
        name: 'Merchant Record Page Fields',
        type: ViewType.FIELDS_WIDGET,
        key: null,
        position: 0,
        icon: 'IconList',
      },
    }),
  };
};
