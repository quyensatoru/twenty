import { ViewType, ViewKey } from 'twenty-shared/types';

import { type FlatView } from 'src/engine/metadata-modules/flat-view/types/flat-view.type';
import {
  createStandardViewFlatMetadata,
  type CreateStandardViewArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view/create-standard-view-flat-metadata.util';

export const computeStandardProjectViews = (
  args: Omit<CreateStandardViewArgs<'project'>, 'context'>,
): Record<string, FlatView> => {
  return {
    allProjects: createStandardViewFlatMetadata({
      ...args,
      objectName: 'project',
      context: {
        viewName: 'allProjects',
        name: 'All {objectLabelPlural}',
        type: ViewType.TABLE,
        key: ViewKey.INDEX,
        position: 0,
        icon: 'IconList',
      },
    }),
    projectRecordPageFields: createStandardViewFlatMetadata({
      ...args,
      objectName: 'project',
      context: {
        viewName: 'projectRecordPageFields',
        name: 'Project Record Page Fields',
        type: ViewType.FIELDS_WIDGET,
        key: null,
        position: 0,
        icon: 'IconList',
      },
    }),
  };
};
