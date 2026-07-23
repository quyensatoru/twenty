import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import {
  createStandardViewFieldFlatMetadata,
  type CreateStandardViewFieldArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field/create-standard-view-field-flat-metadata.util';

export const computeStandardWorklogViewFields = (
  args: Omit<CreateStandardViewFieldArgs<'worklog'>, 'context'>,
): Record<string, FlatViewField> => {
  return {
    allWorklogsIssue: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'worklog',
      context: {
        viewName: 'allWorklogs',
        viewFieldName: 'issue',
        fieldName: 'issue',
        position: 0,
        isVisible: true,
        size: 150,
      },
    }),
    allWorklogsDescription: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'worklog',
      context: {
        viewName: 'allWorklogs',
        viewFieldName: 'description',
        fieldName: 'description',
        position: 1,
        isVisible: true,
        size: 210,
      },
    }),
    allWorklogsTimeSpentMinutes: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'worklog',
      context: {
        viewName: 'allWorklogs',
        viewFieldName: 'timeSpentMinutes',
        fieldName: 'timeSpentMinutes',
        position: 2,
        isVisible: true,
        size: 150,
      },
    }),
    allWorklogsStartedAt: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'worklog',
      context: {
        viewName: 'allWorklogs',
        viewFieldName: 'startedAt',
        fieldName: 'startedAt',
        position: 3,
        isVisible: true,
        size: 150,
      },
    }),
    allWorklogsCreatedAt: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'worklog',
      context: {
        viewName: 'allWorklogs',
        viewFieldName: 'createdAt',
        fieldName: 'createdAt',
        position: 4,
        isVisible: true,
        size: 150,
      },
    }),
  };
};
