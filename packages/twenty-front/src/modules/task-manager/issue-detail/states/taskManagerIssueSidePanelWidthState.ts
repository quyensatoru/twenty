import { TASK_MANAGER_ISSUE_SIDE_PANEL_CONSTRAINTS } from '@/task-manager/issue-detail/constants/TaskManagerIssueSidePanelConstraints';
import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

// Kept separate from sidePanelWidthState so resizing the side panel while
// viewing an Issue doesn't change the default width for every other object.
export const taskManagerIssueSidePanelWidthState = createAtomState<number>({
  key: 'taskManagerIssueSidePanelWidth',
  defaultValue: TASK_MANAGER_ISSUE_SIDE_PANEL_CONSTRAINTS.default,
  useLocalStorage: true,
});
