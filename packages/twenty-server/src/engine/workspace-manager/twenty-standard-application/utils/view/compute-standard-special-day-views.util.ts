import { ViewType, ViewKey } from 'twenty-shared/types';

import { type FlatView } from 'src/engine/metadata-modules/flat-view/types/flat-view.type';
import {
  createStandardViewFlatMetadata,
  type CreateStandardViewArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view/create-standard-view-flat-metadata.util';

export const computeStandardSpecialDayViews = (
  args: Omit<CreateStandardViewArgs<'specialDay'>, 'context'>,
): Record<string, FlatView> => {
  return {
    allSpecialDays: createStandardViewFlatMetadata({
      ...args,
      objectName: 'specialDay',
      context: {
        viewName: 'allSpecialDays',
        name: 'All {objectLabelPlural}',
        type: ViewType.TABLE,
        key: ViewKey.INDEX,
        position: 0,
        icon: 'IconCalendarStar',
      },
    }),
    specialDayRecordPageFields: createStandardViewFlatMetadata({
      ...args,
      objectName: 'specialDay',
      context: {
        viewName: 'specialDayRecordPageFields',
        name: 'Special Day Record Page Fields',
        type: ViewType.FIELDS_WIDGET,
        key: null,
        position: 0,
        icon: 'IconList',
      },
    }),
  };
};
