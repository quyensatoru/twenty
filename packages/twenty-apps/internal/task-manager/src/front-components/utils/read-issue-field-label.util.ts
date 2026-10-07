import { t } from 'twenty-sdk/front-component';

import { type IssueDetailFieldKey } from '../../constants/issue-view-fields';

// Literal t() calls, so the extractor sees each label.
export const readIssueFieldLabel = (key: IssueDetailFieldKey): string => {
  switch (key) {
    case 'status':
      return t('Status');
    case 'type':
      return t('Type');
    case 'priority':
      return t('Priority');
    case 'assignee':
      return t('Assignee');
    case 'reporter':
      return t('Reporter');
    case 'project':
      return t('Project');
    case 'sprint':
      return t('Sprint');
    case 'epic':
      return t('Epic');
    case 'parent':
      return t('Parent');
    case 'merchants':
      return t('Merchants');
    case 'labels':
      return t('Labels');
    case 'points':
      return t('Points');
    case 'dueDate':
      return t('Due date');
    case 'resolution':
      return t('Resolution');
    case 'key':
      return t('Key');
    case 'timeTracking':
      return t('Time tracking');
  }
};
