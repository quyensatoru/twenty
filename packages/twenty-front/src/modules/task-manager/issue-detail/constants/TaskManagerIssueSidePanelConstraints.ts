import { type ResizablePanelConstraints } from '@/ui/layout/resizable-panel/types/ResizablePanelConstraints';

// Wider than SIDE_PANEL_CONSTRAINTS: the Issue detail view packs a details
// grid, description, comments and activity into the same panel, so the
// generic 400px default is cramped for it specifically.
export const TASK_MANAGER_ISSUE_SIDE_PANEL_CONSTRAINTS: ResizablePanelConstraints =
  {
    min: 400,
    max: 800,
    default: 560,
  };
