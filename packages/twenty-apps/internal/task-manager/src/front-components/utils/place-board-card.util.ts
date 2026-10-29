import { moveIdOnto } from './move-id-onto.util';

type RankedCard = { id: string; position?: number | null };

// Where a card dropped in a manually ordered column lands, and the positions
// to write for it. Dropped on a card of its own column it takes that card's
// slot; from another column it goes in front of it; on the column itself, to
// the end. Positions are midpoints between neighbours; when the neighbours
// tie or lack one, the whole column is renumbered.
export const placeBoardCard = ({
  columnCards,
  movedCard,
  targetCardId,
}: {
  columnCards: readonly RankedCard[];
  movedCard: RankedCard;
  targetCardId: string | null;
}): {
  orderedIds: readonly string[];
  positionsById: Record<string, number>;
} => {
  const ids = columnCards.map((card) => card.id);
  const isSameColumn = ids.includes(movedCard.id);
  const orderedIds = isSameColumn
    ? targetCardId === null || !ids.includes(targetCardId)
      ? [...ids.filter((id) => id !== movedCard.id), movedCard.id]
      : moveIdOnto(ids, movedCard.id, targetCardId)
    : targetCardId === null || !ids.includes(targetCardId)
      ? [...ids, movedCard.id]
      : ids.flatMap((id) => (id === targetCardId ? [movedCard.id, id] : [id]));
  const positionOf = new Map(
    [...columnCards, movedCard].map((card) => [card.id, card.position]),
  );
  const movedIndex = orderedIds.indexOf(movedCard.id);
  const previousPosition = positionOf.get(orderedIds[movedIndex - 1] ?? '');
  const nextPosition = positionOf.get(orderedIds[movedIndex + 1] ?? '');
  const hasPrevious = movedIndex > 0;
  const hasNext = movedIndex < orderedIds.length - 1;

  if (hasPrevious && hasNext) {
    if (
      typeof previousPosition === 'number' &&
      typeof nextPosition === 'number' &&
      previousPosition < nextPosition
    ) {
      return {
        orderedIds,
        positionsById: {
          [movedCard.id]: (previousPosition + nextPosition) / 2,
        },
      };
    }
  } else if (hasPrevious && typeof previousPosition === 'number') {
    return {
      orderedIds,
      positionsById: { [movedCard.id]: previousPosition + 1 },
    };
  } else if (hasNext && typeof nextPosition === 'number') {
    return { orderedIds, positionsById: { [movedCard.id]: nextPosition - 1 } };
  } else if (!hasPrevious && !hasNext) {
    return { orderedIds, positionsById: {} };
  }

  return {
    orderedIds,
    positionsById: Object.fromEntries(
      orderedIds
        .map((id, index) => [id, index + 1] as const)
        .filter(([id, position]) => positionOf.get(id) !== position),
    ),
  };
};
