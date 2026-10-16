export type SprintCapacitySummary = {
  storyPointTotal: number;
  capacity: number;
  isOverCapacity: boolean;
};

// What a sprint header needs for "8 / 20 pts". Null when the sprint has no
// capacity, so the header stays as it was before capacity existed.
export const formatSprintCapacity = ({
  storyPointTotal,
  capacity,
}: {
  storyPointTotal: number;
  capacity: number | null | undefined;
}): SprintCapacitySummary | null => {
  if (
    typeof capacity !== 'number' ||
    !Number.isFinite(capacity) ||
    capacity <= 0
  ) {
    return null;
  }

  return {
    storyPointTotal,
    capacity,
    isOverCapacity: storyPointTotal > capacity,
  };
};
