import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import {
  createStandardViewFieldFlatMetadata,
  type CreateStandardViewFieldArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field/create-standard-view-field-flat-metadata.util';

export const computeStandardIssueViewFields = (
  args: Omit<CreateStandardViewFieldArgs<'issue'>, 'context'>,
): Record<string, FlatViewField> => {
  return {
    // allIssues view fields
    allIssuesTitle: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'issue',
      context: {
        viewName: 'allIssues',
        viewFieldName: 'title',
        fieldName: 'title',
        position: 0,
        isVisible: true,
        size: 210,
      },
    }),
    allIssuesIssueKey: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'issue',
      context: {
        viewName: 'allIssues',
        viewFieldName: 'issueKey',
        fieldName: 'issueKey',
        position: 1,
        isVisible: true,
        size: 100,
      },
    }),
    allIssuesStatus: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'issue',
      context: {
        viewName: 'allIssues',
        viewFieldName: 'status',
        fieldName: 'status',
        position: 2,
        isVisible: true,
        size: 150,
      },
    }),
    allIssuesPriority: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'issue',
      context: {
        viewName: 'allIssues',
        viewFieldName: 'priority',
        fieldName: 'priority',
        position: 3,
        isVisible: true,
        size: 150,
      },
    }),
    allIssuesAssignee: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'issue',
      context: {
        viewName: 'allIssues',
        viewFieldName: 'assignee',
        fieldName: 'assignee',
        position: 4,
        isVisible: true,
        size: 150,
      },
    }),
    allIssuesDueDate: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'issue',
      context: {
        viewName: 'allIssues',
        viewFieldName: 'dueDate',
        fieldName: 'dueDate',
        position: 5,
        isVisible: true,
        size: 150,
      },
    }),
    allIssuesCreatedAt: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'issue',
      context: {
        viewName: 'allIssues',
        viewFieldName: 'createdAt',
        fieldName: 'createdAt',
        position: 6,
        isVisible: true,
        size: 150,
      },
    }),

    // byStatus view fields
    byStatusTitle: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'issue',
      context: {
        viewName: 'byStatus',
        viewFieldName: 'title',
        fieldName: 'title',
        position: 0,
        isVisible: true,
        size: 210,
      },
    }),
    byStatusPriority: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'issue',
      context: {
        viewName: 'byStatus',
        viewFieldName: 'priority',
        fieldName: 'priority',
        position: 1,
        isVisible: true,
        size: 150,
      },
    }),
    byStatusAssignee: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'issue',
      context: {
        viewName: 'byStatus',
        viewFieldName: 'assignee',
        fieldName: 'assignee',
        position: 2,
        isVisible: true,
        size: 150,
      },
    }),
  };
};
