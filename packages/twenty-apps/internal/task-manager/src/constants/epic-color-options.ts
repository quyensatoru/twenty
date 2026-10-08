// The colours an epic can take: eight that stay apart on a card next to the
// status and label tags. Option values are SCREAMING_SNAKE_CASE (the metadata
// sync enforces it) while `color` is the theme key the front renders.
export const EPIC_COLOR_OPTIONS = [
  {
    id: '65cd8a98-c0e8-440d-a983-88017d57d2e1',
    value: 'PURPLE',
    label: 'Purple',
    position: 0,
    color: 'purple',
  },
  {
    id: '2789318b-9516-4000-986f-52fc957df711',
    value: 'BLUE',
    label: 'Blue',
    position: 1,
    color: 'blue',
  },
  {
    id: '9128b817-4604-4f0a-9cd2-5018131b4544',
    value: 'GREEN',
    label: 'Green',
    position: 2,
    color: 'green',
  },
  {
    id: '86aed172-3745-4606-8a13-e4f31af67c57',
    value: 'ORANGE',
    label: 'Orange',
    position: 3,
    color: 'orange',
  },
  {
    id: '7c9555ff-82a1-4a48-90f0-376f7177d274',
    value: 'PINK',
    label: 'Pink',
    position: 4,
    color: 'pink',
  },
  {
    id: '1d807336-750e-4908-a0b5-e423dd2a7039',
    value: 'TURQUOISE',
    label: 'Turquoise',
    position: 5,
    color: 'turquoise',
  },
  {
    id: 'be685016-2b8d-48c7-97e1-90189d45a980',
    value: 'YELLOW',
    label: 'Yellow',
    position: 6,
    color: 'yellow',
  },
  {
    id: 'dc329f5d-f9e6-4fba-b85c-abc832b2b1fb',
    value: 'RED',
    label: 'Red',
    position: 7,
    color: 'red',
  },
] as const;
