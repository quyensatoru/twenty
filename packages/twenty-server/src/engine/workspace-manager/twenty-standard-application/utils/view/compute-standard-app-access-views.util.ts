import { ViewType, ViewKey } from 'twenty-shared/types';

import { type FlatView } from 'src/engine/metadata-modules/flat-view/types/flat-view.type';
import {
  createStandardViewFlatMetadata,
  type CreateStandardViewArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view/create-standard-view-flat-metadata.util';

// AppAccess is a junction/permission-grant record, so — like noteTarget /
// taskTarget — it only gets a TABLE view, no record-page FIELDS_WIDGET view.
export const computeStandardAppAccessViews = (
  args: Omit<CreateStandardViewArgs<'appAccess'>, 'context'>,
): Record<string, FlatView> => {
  return {
    allAppAccesses: createStandardViewFlatMetadata({
      ...args,
      objectName: 'appAccess',
      context: {
        viewName: 'allAppAccesses',
        name: 'All {objectLabelPlural}',
        type: ViewType.TABLE,
        key: ViewKey.INDEX,
        position: 0,
        icon: 'IconList',
      },
    }),
  };
};
