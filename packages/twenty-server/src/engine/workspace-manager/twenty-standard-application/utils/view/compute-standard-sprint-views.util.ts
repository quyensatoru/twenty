import { ViewType, ViewKey } from 'twenty-shared/types';

import { type FlatView } from 'src/engine/metadata-modules/flat-view/types/flat-view.type';
import {
  createStandardViewFlatMetadata,
  type CreateStandardViewArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view/create-standard-view-flat-metadata.util';

export const computeStandardSprintViews = (
  args: Omit<CreateStandardViewArgs<'sprint'>, 'context'>,
): Record<string, FlatView> => {
  return {
    allSprints: createStandardViewFlatMetadata({
      ...args,
      objectName: 'sprint',
      context: {
        viewName: 'allSprints',
        name: 'All {objectLabelPlural}',
        type: ViewType.TABLE,
        key: ViewKey.INDEX,
        position: 0,
        icon: 'IconList',
      },
    }),
    sprintRecordPageFields: createStandardViewFlatMetadata({
      ...args,
      objectName: 'sprint',
      context: {
        viewName: 'sprintRecordPageFields',
        name: 'Sprint Record Page Fields',
        type: ViewType.FIELDS_WIDGET,
        key: null,
        position: 0,
        icon: 'IconList',
      },
    }),
  };
};
