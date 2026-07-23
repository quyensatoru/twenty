import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import {
  createStandardViewFieldFlatMetadata,
  type CreateStandardViewFieldArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field/create-standard-view-field-flat-metadata.util';

export const computeStandardIssueCommentViewFields = (
  args: Omit<CreateStandardViewFieldArgs<'issueComment'>, 'context'>,
): Record<string, FlatViewField> => {
  return {
    allIssueCommentsIssue: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'issueComment',
      context: {
        viewName: 'allIssueComments',
        viewFieldName: 'issue',
        fieldName: 'issue',
        position: 0,
        isVisible: true,
        size: 150,
      },
    }),
    allIssueCommentsAuthor: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'issueComment',
      context: {
        viewName: 'allIssueComments',
        viewFieldName: 'author',
        fieldName: 'author',
        position: 1,
        isVisible: true,
        size: 150,
      },
    }),
    allIssueCommentsBodyV2: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'issueComment',
      context: {
        viewName: 'allIssueComments',
        viewFieldName: 'bodyV2',
        fieldName: 'bodyV2',
        position: 2,
        isVisible: true,
        size: 210,
      },
    }),
    allIssueCommentsCreatedAt: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'issueComment',
      context: {
        viewName: 'allIssueComments',
        viewFieldName: 'createdAt',
        fieldName: 'createdAt',
        position: 3,
        isVisible: true,
        size: 150,
      },
    }),
  };
};
