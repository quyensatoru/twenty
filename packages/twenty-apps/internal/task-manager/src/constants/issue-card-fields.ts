// Which fields an issue card can show on the board and the backlog. The fork
// had this as the view's field-visibility control; an app cannot drive the
// host's view bar from a front component, so the board carries its own.
export const ISSUE_CARD_FIELDS = [
  { value: 'issueKey', label: 'Key' },
  { value: 'priority', label: 'Priority' },
  { value: 'storyPoints', label: 'Story points' },
  { value: 'assignee', label: 'Assignee' },
  { value: 'labels', label: 'Labels' },
  { value: 'dueDate', label: 'Due date' },
] as const;

export type IssueCardFieldName = (typeof ISSUE_CARD_FIELDS)[number]['value'];

export const DEFAULT_VISIBLE_ISSUE_CARD_FIELDS: IssueCardFieldName[] = [
  'issueKey',
  'priority',
  'storyPoints',
];
