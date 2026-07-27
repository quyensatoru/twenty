import { ViewType, ViewKey } from 'twenty-shared/types';

import { type FlatView } from 'src/engine/metadata-modules/flat-view/types/flat-view.type';
import {
  createStandardViewFlatMetadata,
  type CreateStandardViewArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view/create-standard-view-flat-metadata.util';

export const computeStandardAppViews = (
  args: Omit<CreateStandardViewArgs<'app'>, 'context'>,
): Record<string, FlatView> => {
  return {
    allApps: createStandardViewFlatMetadata({
      ...args,
      objectName: 'app',
      context: {
        viewName: 'allApps',
        name: 'All {objectLabelPlural}',
        type: ViewType.TABLE,
        key: ViewKey.INDEX,
        position: 0,
        icon: 'IconList',
      },
    }),
    appRecordPageFields: createStandardViewFlatMetadata({
      ...args,
      objectName: 'app',
      context: {
        viewName: 'appRecordPageFields',
        name: 'App Record Page Fields',
        type: ViewType.FIELDS_WIDGET,
        key: null,
        position: 0,
        icon: 'IconList',
      },
    }),
  };
};
