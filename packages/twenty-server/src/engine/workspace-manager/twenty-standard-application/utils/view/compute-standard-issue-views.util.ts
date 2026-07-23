import { ViewType, ViewKey } from 'twenty-shared/types';

import { type FlatView } from 'src/engine/metadata-modules/flat-view/types/flat-view.type';
import {
  createStandardViewFlatMetadata,
  type CreateStandardViewArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view/create-standard-view-flat-metadata.util';

export const computeStandardIssueViews = (
  args: Omit<CreateStandardViewArgs<'issue'>, 'context'>,
): Record<string, FlatView> => {
  return {
    allIssues: createStandardViewFlatMetadata({
      ...args,
      objectName: 'issue',
      context: {
        viewName: 'allIssues',
        name: 'All {objectLabelPlural}',
        type: ViewType.TABLE,
        key: ViewKey.INDEX,
        position: 0,
        icon: 'IconList',
      },
    }),
    byStatus: createStandardViewFlatMetadata({
      ...args,
      objectName: 'issue',
      context: {
        viewName: 'byStatus',
        name: 'By Status',
        type: ViewType.KANBAN,
        key: null,
        position: 1,
        icon: 'IconLayoutKanban',
        mainGroupByFieldName: 'status',
      },
    }),
    issueRecordPageFields: createStandardViewFlatMetadata({
      ...args,
      objectName: 'issue',
      context: {
        viewName: 'issueRecordPageFields',
        name: 'Issue Record Page Fields',
        type: ViewType.FIELDS_WIDGET,
        key: null,
        position: 0,
        icon: 'IconList',
      },
    }),
  };
};
