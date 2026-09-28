// Turns the resolved visible-project set into the `filter` fragment a read
// query merges in. An unrestricted caller contributes nothing; a caller with
// no visible project gets an impossible filter rather than an absent one, so
// an empty grant set can never widen a query by accident.
export const buildProjectScopeFilter = (
  visibleProjectIds: string[] | null,
  fieldName: string = 'projectId',
): Record<string, unknown> => {
  if (visibleProjectIds === null) {
    return {};
  }

  return { [fieldName]: { in: visibleProjectIds } };
};
