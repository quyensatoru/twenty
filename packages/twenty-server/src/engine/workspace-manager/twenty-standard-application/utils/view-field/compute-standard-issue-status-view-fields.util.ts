import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import {
  createStandardViewFieldFlatMetadata,
  type CreateStandardViewFieldArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field/create-standard-view-field-flat-metadata.util';

export const computeStandardIssueStatusViewFields = (
  args: Omit<CreateStandardViewFieldArgs<'issueStatus'>, 'context'>,
): Record<string, FlatViewField> => {
  return {
    allIssueStatusesName: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'issueStatus',
      context: {
        viewName: 'allIssueStatuses',
        viewFieldName: 'name',
        fieldName: 'name',
        position: 0,
        isVisible: true,
        size: 210,
      },
    }),
    allIssueStatusesProject: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'issueStatus',
      context: {
        viewName: 'allIssueStatuses',
        viewFieldName: 'project',
        fieldName: 'project',
        position: 1,
        isVisible: true,
        size: 150,
      },
    }),
    allIssueStatusesCreatedAt: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'issueStatus',
      context: {
        viewName: 'allIssueStatuses',
        viewFieldName: 'createdAt',
        fieldName: 'createdAt',
        position: 2,
        isVisible: true,
        size: 150,
      },
    }),
  };
};
