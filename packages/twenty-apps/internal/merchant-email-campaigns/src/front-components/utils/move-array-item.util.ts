export const moveArrayItem = <TItem>(
  items: TItem[],
  fromIndex: number,
  toIndex: number,
): TItem[] => {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length
  ) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);

  next.splice(toIndex, 0, moved);

  return next;
};
