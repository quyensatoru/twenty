export type ProjectRow = {
  id: string;
  name?: string | null;
  key?: string | null;
  appId?: string | null;
};

export type IssueStatusRow = {
  id: string;
  name?: string | null;
  color?: string | null;
  category?: string | null;
  position?: number | null;
  projectId?: string | null;
};

export type SprintRow = {
  id: string;
  name?: string | null;
  state?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  position?: number | null;
  projectId?: string | null;
};

export type EpicRow = {
  id: string;
  name?: string | null;
  projectId?: string | null;
};

export type IssueRow = {
  id: string;
  title?: string | null;
  description?: { blocknote?: string | null; markdown?: string | null } | null;
  issueKey?: string | null;
  issueType?: string | null;
  priority?: string | null;
  resolution?: string | null;
  storyPoints?: number | null;
  dueDate?: string | null;
  labels?: string[] | null;
  position?: number | null;
  statusId?: string | null;
  sprintId?: string | null;
  epicId?: string | null;
  parentId?: string | null;
  assigneeId?: string | null;
  reporterId?: string | null;
  projectId?: string | null;
  timeSpentMinutes?: number | null;
  originalEstimateMinutes?: number | null;
  remainingEstimateMinutes?: number | null;
  // `files` is the FILES field labelled Attachments in the UI. The name
  // `attachments` is taken: the engine provisions a system RELATION of that
  // name on every created object, and a caller field colliding on it
  // hard-fails validation — so a fresh install can never create it.
  files?: readonly {
    fileId?: string | null;
    label?: string | null;
    extension?: string | null;
    url?: string | null;
  }[] | null;
};
