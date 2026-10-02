const editDistance = (left: string, right: string): number => {
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex++) {
    const current = [leftIndex];

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex++) {
      current[rightIndex] = Math.min(
        previous[rightIndex] + 1,
        current[rightIndex - 1] + 1,
        previous[rightIndex - 1] +
          (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
    }

    previous = current;
  }

  return previous[right.length];
};

// Turns the silent failure of this whole design — an event name typed one
// letter off, which then never fires — into a question the composer can
// answer. Only near misses are offered, so an intentionally new name is not
// nagged about an unrelated one.
export const findClosestEventName = (
  eventName: string,
  knownEventNames: string[],
): string | null => {
  if (eventName === '') {
    return null;
  }

  const tolerance = Math.max(1, Math.floor(eventName.length / 5));
  let closest: string | null = null;
  let closestDistance = tolerance + 1;

  for (const candidate of knownEventNames) {
    if (candidate === eventName) {
      return null;
    }

    const distance = editDistance(eventName, candidate);

    if (distance < closestDistance) {
      closest = candidate;
      closestDistance = distance;
    }
  }

  return closest;
};
