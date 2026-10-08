type OrderableSprint = { state?: string | null; position?: number | null };

// The backlog's sprint order: the active sprint on top, then the future ones
// in planning order. Closed sprints are history and are left out.
export const orderBacklogSprints = <TSprint extends OrderableSprint>(
  sprints: readonly TSprint[],
): TSprint[] => {
  const openSprints = sprints.filter((sprint) => sprint.state !== 'CLOSED');

  return [
    ...openSprints.filter((sprint) => sprint.state === 'ACTIVE'),
    ...openSprints
      .filter((sprint) => sprint.state !== 'ACTIVE')
      .sort(
        (left, right) =>
          (left.position ?? Number.MAX_SAFE_INTEGER) -
          (right.position ?? Number.MAX_SAFE_INTEGER),
      ),
  ];
};
