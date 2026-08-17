import { ViewType, ViewKey } from 'twenty-shared/types';

import { type FlatView } from 'src/engine/metadata-modules/flat-view/types/flat-view.type';
import {
  createStandardViewFlatMetadata,
  type CreateStandardViewArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view/create-standard-view-flat-metadata.util';

export const computeStandardShiftViews = (
  args: Omit<CreateStandardViewArgs<'shift'>, 'context'>,
): Record<string, FlatView> => {
  return {
    allShifts: createStandardViewFlatMetadata({
      ...args,
      objectName: 'shift',
      context: {
        viewName: 'allShifts',
        name: 'All {objectLabelPlural}',
        type: ViewType.TABLE,
        key: ViewKey.INDEX,
        position: 0,
        icon: 'IconCalendarClock',
      },
    }),
    shiftRecordPageFields: createStandardViewFlatMetadata({
      ...args,
      objectName: 'shift',
      context: {
        viewName: 'shiftRecordPageFields',
        name: 'Shift Record Page Fields',
        type: ViewType.FIELDS_WIDGET,
        key: null,
        position: 0,
        icon: 'IconList',
      },
    }),
  };
};
