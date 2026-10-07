// Drag-to-reorder without measuring anything: the dragged id takes the
// target's slot, landing after it when it came from the left and before it
// when it came from the right. The sandbox has no layout to measure, so the
// drop side cannot come from the pointer position.
export const moveIdOnto = (
  ids: readonly string[],
  movedId: string,
  targetId: string,
): readonly string[] => {
  const fromIndex = ids.indexOf(movedId);
  const toIndex = ids.indexOf(targetId);

  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return ids;
  }

  const remaining = ids.filter((id) => id !== movedId);

  return [
    ...remaining.slice(0, toIndex),
    movedId,
    ...remaining.slice(toIndex),
  ];
};
