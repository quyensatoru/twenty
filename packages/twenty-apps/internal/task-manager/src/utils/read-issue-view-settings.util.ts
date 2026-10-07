import {
  ISSUE_CARD_FIELDS,
  ISSUE_DETAIL_FIELDS,
  type IssueCardFieldKey,
  type IssueDetailFieldKey,
} from '../constants/issue-view-fields';

// A project's choice of what its issues show: rows of the Details panel and
// parts of a board card. Stored as hidden lists so a field added to the app
// later shows up by default instead of silently staying hidden.
export type IssueViewSettings = {
  hiddenDetailFields: IssueDetailFieldKey[];
  hiddenCardFields: IssueCardFieldKey[];
};

const readKnownKeys = <TKey extends string>(
  value: unknown,
  knownKeys: readonly TKey[],
): TKey[] =>
  Array.isArray(value)
    ? [
        ...new Set(
          value.filter((entry): entry is TKey =>
            knownKeys.includes(entry as TKey),
          ),
        ),
      ]
    : [];

// The stored JSON is read defensively: it outlives every version of this
// shape, and anything unrecognised falls back to "shown".
export const readIssueViewSettings = (value: unknown): IssueViewSettings => {
  const settings =
    typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  return {
    hiddenDetailFields: readKnownKeys(
      settings.hiddenDetailFields,
      ISSUE_DETAIL_FIELDS.map((field) => field.key),
    ),
    hiddenCardFields: readKnownKeys(
      settings.hiddenCardFields,
      ISSUE_CARD_FIELDS.map((field) => field.key),
    ),
  };
};
