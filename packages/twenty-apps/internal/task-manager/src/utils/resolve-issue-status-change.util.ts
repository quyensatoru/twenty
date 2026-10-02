// Compares the status either side of an `issue.updated` event and answers
// whether the History feed owes the issue a `status-changed` entry.
//
// Both snapshots have to carry the key: an update that touches anything else
// arrives without it, and guessing a change from a half snapshot is how a
// title edit becomes a phantom status change in the feed.
export const resolveIssueStatusChange = ({
  before,
  after,
}: {
  before?: { statusId?: string | null } | null;
  after?: { statusId?: string | null } | null;
}): { fromStatusId: string | null; toStatusId: string | null } | null => {
  if (after === null || after === undefined || !('statusId' in after)) {
    return null;
  }

  const toStatusId = after.statusId ?? null;
  const fromStatusId = before?.statusId ?? null;

  if (fromStatusId === toStatusId) {
    return null;
  }

  return { fromStatusId, toStatusId };
};
