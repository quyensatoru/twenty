import { ViewType, ViewKey } from 'twenty-shared/types';

import { type FlatView } from 'src/engine/metadata-modules/flat-view/types/flat-view.type';
import {
  createStandardViewFlatMetadata,
  type CreateStandardViewArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view/create-standard-view-flat-metadata.util';

export const computeStandardWorklogViews = (
  args: Omit<CreateStandardViewArgs<'worklog'>, 'context'>,
): Record<string, FlatView> => {
  return {
    allWorklogs: createStandardViewFlatMetadata({
      ...args,
      objectName: 'worklog',
      context: {
        viewName: 'allWorklogs',
        name: 'All {objectLabelPlural}',
        type: ViewType.TABLE,
        key: ViewKey.INDEX,
        position: 0,
        icon: 'IconList',
      },
    }),
    worklogRecordPageFields: createStandardViewFlatMetadata({
      ...args,
      objectName: 'worklog',
      context: {
        viewName: 'worklogRecordPageFields',
        name: 'Worklog Record Page Fields',
        type: ViewType.FIELDS_WIDGET,
        key: null,
        position: 0,
        icon: 'IconList',
      },
    }),
  };
};
