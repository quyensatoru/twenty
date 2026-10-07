// The rows an issue's Details panel can show, in panel order. The same list
// drives the modal on the board and the panel on the issue record page, so
// a project's show/hide choice reads the same in both.
export const ISSUE_DETAIL_FIELDS = [
  { key: 'status', label: 'Status' },
  { key: 'type', label: 'Type' },
  { key: 'priority', label: 'Priority' },
  { key: 'assignee', label: 'Assignee' },
  { key: 'reporter', label: 'Reporter' },
  { key: 'project', label: 'Project' },
  { key: 'sprint', label: 'Sprint' },
  { key: 'epic', label: 'Epic' },
  { key: 'parent', label: 'Parent' },
  { key: 'merchants', label: 'Merchants' },
  { key: 'labels', label: 'Labels' },
  { key: 'points', label: 'Points' },
  { key: 'dueDate', label: 'Due date' },
  { key: 'resolution', label: 'Resolution' },
  { key: 'key', label: 'Key' },
  { key: 'timeTracking', label: 'Time tracking' },
] as const;

export type IssueDetailFieldKey = (typeof ISSUE_DETAIL_FIELDS)[number]['key'];

// What a board card can show besides its title and key, which are always
// there: a card without them is not recognisable. Merchants are not offered —
// every page of cards would have to load its merchant links too.
export const ISSUE_CARD_FIELDS = [
  { key: 'type', label: 'Type' },
  { key: 'priority', label: 'Priority' },
  { key: 'assignee', label: 'Assignee' },
  { key: 'reporter', label: 'Reporter' },
  { key: 'epic', label: 'Epic' },
  { key: 'sprint', label: 'Sprint' },
  { key: 'labels', label: 'Labels' },
  { key: 'points', label: 'Points' },
  { key: 'dueDate', label: 'Due date' },
] as const;

export type IssueCardFieldKey = (typeof ISSUE_CARD_FIELDS)[number]['key'];
