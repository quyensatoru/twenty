import { type ShiftActor } from './read-actor.util';

// The fork's assertShiftOwnerOrElevatedOrThrow. Only the shift's own member may
// act on it, unless the actor is elevated (Leader/PO). Returns an error string
// rather than throwing so a route can answer 200 with `success: false` like
// every other business rejection.
export const readShiftOwnershipError = ({
  actor,
  shiftMemberId,
}: {
  actor: ShiftActor;
  shiftMemberId: string | null;
}): string | null => {
  if (actor.isElevated) {
    return null;
  }

  // A caller with no workspace member owns no shift — deny rather than let a
  // foreign row through.
  if (actor.workspaceMemberId === null) {
    return 'Permission denied.';
  }

  return shiftMemberId === actor.workspaceMemberId
    ? null
    : 'Permission denied.';
};
