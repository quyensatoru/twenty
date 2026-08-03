import { type FlatViewGroup } from 'src/engine/metadata-modules/flat-view-group/types/flat-view-group.type';
import { type CreateStandardViewGroupArgs } from 'src/engine/workspace-manager/twenty-standard-application/utils/view-group/create-standard-view-group-flat-metadata.util';

// `issue.status` is now a relation to IssueStatus (per-project, custom
// records), so a relation ViewGroup's `fieldValue` must be a real record id
// - which cannot exist at static-template-compute time. The `byStatus` view
// itself is kept as a plain, ungrouped Kanban registration (see
// compute-standard-issue-views.util.ts); per-project Kanban columns are
// seeded dynamically instead (project-post-query-hook.service.ts).
export const computeStandardIssueViewGroups = (
  _args: Omit<CreateStandardViewGroupArgs<'issue'>, 'context'>,
): Record<string, FlatViewGroup> => {
  return {};
};
