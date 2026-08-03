import { ViewType, ViewKey } from 'twenty-shared/types';

import { type FlatView } from 'src/engine/metadata-modules/flat-view/types/flat-view.type';
import {
  createStandardViewFlatMetadata,
  type CreateStandardViewArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view/create-standard-view-flat-metadata.util';

export const computeStandardIssueStatusViews = (
  args: Omit<CreateStandardViewArgs<'issueStatus'>, 'context'>,
): Record<string, FlatView> => {
  return {
    allIssueStatuses: createStandardViewFlatMetadata({
      ...args,
      objectName: 'issueStatus',
      context: {
        viewName: 'allIssueStatuses',
        name: 'All {objectLabelPlural}',
        type: ViewType.TABLE,
        key: ViewKey.INDEX,
        position: 0,
        icon: 'IconList',
      },
    }),
    issueStatusRecordPageFields: createStandardViewFlatMetadata({
      ...args,
      objectName: 'issueStatus',
      context: {
        viewName: 'issueStatusRecordPageFields',
        name: 'Issue Status Record Page Fields',
        type: ViewType.FIELDS_WIDGET,
        key: null,
        position: 0,
        icon: 'IconList',
      },
    }),
  };
};
