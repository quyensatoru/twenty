// Direct port of the hardcoded global Issue.status SELECT options the
// issueStatus object replaced. Colors are the fork's, so Kanban columns seeded
// per project keep the same look.
export const DEFAULT_ISSUE_STATUSES = [
  { name: 'Backlog', color: 'GRAY', category: 'UNSTARTED' },
  { name: 'Todo', color: 'SKY', category: 'UNSTARTED' },
  { name: 'In Progress', color: 'PURPLE', category: 'STARTED' },
  { name: 'In Review', color: 'ORANGE', category: 'STARTED' },
  { name: 'Done', color: 'GREEN', category: 'DONE' },
] as const;
