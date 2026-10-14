import { t } from 'twenty-sdk/front-component';

import { type BoardIssueSortField } from '../../constants/board-issue-sorts';

// Written as literals inside t() because the extractor only sees literals.
export const readBoardIssueSortLabel = (field: BoardIssueSortField): string => {
  switch (field) {
    case 'priority':
      return t('Priority');
    case 'createdAt':
      return t('Created date');
    case 'updatedAt':
      return t('Updated date');
    case 'dueDate':
      return t('Due date');
    case 'storyPoints':
      return t('Story points');
  }
};
