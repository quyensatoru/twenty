import { describe, expect, it } from 'vitest';

import { placeBoardCard } from '../place-board-card.util';

const card = (id: string, position: number | null) => ({ id, position });

describe('placeBoardCard', () => {
  const column = [card('a', 1), card('b', 2), card('c', 3)];

  it('moves a card down onto a later card of its column, after it', () => {
    expect(
      placeBoardCard({
        columnCards: column,
        movedCard: column[0],
        targetCardId: 'b',
      }),
    ).toEqual({ orderedIds: ['b', 'a', 'c'], positionsById: { a: 2.5 } });
  });

  it('moves a card up onto an earlier card of its column, before it', () => {
    expect(
      placeBoardCard({
        columnCards: column,
        movedCard: column[2],
        targetCardId: 'a',
      }),
    ).toEqual({ orderedIds: ['c', 'a', 'b'], positionsById: { c: 0 } });
  });

  it('puts a card from another column in front of the card it lands on', () => {
    expect(
      placeBoardCard({
        columnCards: column,
        movedCard: card('x', 40),
        targetCardId: 'c',
      }),
    ).toEqual({
      orderedIds: ['a', 'b', 'x', 'c'],
      positionsById: { x: 2.5 },
    });
  });

  it('sends a card dropped on the column itself to the end', () => {
    expect(
      placeBoardCard({
        columnCards: column,
        movedCard: card('x', -5),
        targetCardId: null,
      }),
    ).toEqual({ orderedIds: ['a', 'b', 'c', 'x'], positionsById: { x: 4 } });
  });

  it('renumbers the column when the neighbours tie', () => {
    expect(
      placeBoardCard({
        columnCards: [card('a', 2), card('b', 2), card('c', 5)],
        movedCard: card('x', 9),
        targetCardId: 'b',
      }),
    ).toEqual({
      orderedIds: ['a', 'x', 'b', 'c'],
      positionsById: { a: 1, x: 2, b: 3, c: 4 },
    });
  });

  it('writes nothing for the only card of an empty column', () => {
    expect(
      placeBoardCard({
        columnCards: [],
        movedCard: card('x', 3),
        targetCardId: null,
      }),
    ).toEqual({ orderedIds: ['x'], positionsById: {} });
  });
});
