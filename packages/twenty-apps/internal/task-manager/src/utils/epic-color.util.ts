import { EPIC_COLOR_OPTIONS } from '../constants/epic-color-options';
import { stringToThemeColorName } from './string-to-theme-color.util';

// A new epic takes the least used colour, earliest in the list on a tie, so
// the first eight epics of a project never share one.
export const pickNextEpicColor = (
  usedColors: readonly (string | null | undefined)[],
): string => {
  const useCountByValue = new Map<string, number>(
    EPIC_COLOR_OPTIONS.map((option) => [option.value, 0]),
  );

  for (const color of usedColors) {
    const value = typeof color === 'string' ? color.toUpperCase() : null;
    const useCount = value === null ? undefined : useCountByValue.get(value);

    if (value !== null && useCount !== undefined) {
      useCountByValue.set(value, useCount + 1);
    }
  }

  let pickedValue: string = EPIC_COLOR_OPTIONS[0].value;
  let lowestUseCount = Number.POSITIVE_INFINITY;

  for (const option of EPIC_COLOR_OPTIONS) {
    const useCount = useCountByValue.get(option.value) ?? 0;

    if (useCount < lowestUseCount) {
      lowestUseCount = useCount;
      pickedValue = option.value;
    }
  }

  return pickedValue;
};

// Epics created before the colour field have none; they get a stable colour
// from their id instead of all sharing one.
export const readEpicColor = (epic: {
  id: string;
  color?: string | null;
}): string =>
  typeof epic.color === 'string' && epic.color !== ''
    ? epic.color.toLowerCase()
    : stringToThemeColorName(epic.id);
