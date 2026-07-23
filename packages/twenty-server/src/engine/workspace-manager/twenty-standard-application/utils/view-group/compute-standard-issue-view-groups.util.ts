import { type FlatViewGroup } from 'src/engine/metadata-modules/flat-view-group/types/flat-view-group.type';
import {
  createStandardViewGroupFlatMetadata,
  type CreateStandardViewGroupArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-group/create-standard-view-group-flat-metadata.util';

export const computeStandardIssueViewGroups = (
  args: Omit<CreateStandardViewGroupArgs<'issue'>, 'context'>,
): Record<string, FlatViewGroup> => {
  return {
    byStatusBacklog: createStandardViewGroupFlatMetadata({
      ...args,
      objectName: 'issue',
      context: {
        viewName: 'byStatus',
        viewGroupName: 'backlog',
        isVisible: true,
        fieldValue: 'BACKLOG',
        position: 0,
      },
    }),
    byStatusTodo: createStandardViewGroupFlatMetadata({
      ...args,
      objectName: 'issue',
      context: {
        viewName: 'byStatus',
        viewGroupName: 'todo',
        isVisible: true,
        fieldValue: 'TODO',
        position: 1,
      },
    }),
    byStatusInProgress: createStandardViewGroupFlatMetadata({
      ...args,
      objectName: 'issue',
      context: {
        viewName: 'byStatus',
        viewGroupName: 'inProgress',
        isVisible: true,
        fieldValue: 'IN_PROGRESS',
        position: 2,
      },
    }),
    byStatusInReview: createStandardViewGroupFlatMetadata({
      ...args,
      objectName: 'issue',
      context: {
        viewName: 'byStatus',
        viewGroupName: 'inReview',
        isVisible: true,
        fieldValue: 'IN_REVIEW',
        position: 3,
      },
    }),
    byStatusDone: createStandardViewGroupFlatMetadata({
      ...args,
      objectName: 'issue',
      context: {
        viewName: 'byStatus',
        viewGroupName: 'done',
        isVisible: true,
        fieldValue: 'DONE',
        position: 4,
      },
    }),
  };
};
