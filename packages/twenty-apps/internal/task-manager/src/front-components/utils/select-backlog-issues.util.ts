export type BacklogIssueSelection = {
  selectedIssueIds: string[];
  // The row the last plain click landed on, where a Shift-click range starts.
  anchorIssueId: string | null;
};

// A plain click toggles one row and moves the anchor to it. A Shift-click
// adds every row between the anchor and the clicked one, in the order the
// list shows them, the way a file manager does; with no anchor in the
// visible list it falls back to a plain toggle.
export const selectBacklogIssues = ({
  selection,
  visibleIssueIds,
  issueId,
  isRange,
}: {
  selection: BacklogIssueSelection;
  visibleIssueIds: readonly string[];
  issueId: string;
  isRange: boolean;
}): BacklogIssueSelection => {
  const anchorIndex =
    selection.anchorIssueId === null
      ? -1
      : visibleIssueIds.indexOf(selection.anchorIssueId);
  const clickedIndex = visibleIssueIds.indexOf(issueId);

  if (isRange && anchorIndex !== -1 && clickedIndex !== -1) {
    const rangeIssueIds = visibleIssueIds.slice(
      Math.min(anchorIndex, clickedIndex),
      Math.max(anchorIndex, clickedIndex) + 1,
    );
    const alreadySelected = new Set(selection.selectedIssueIds);

    return {
      selectedIssueIds: [
        ...selection.selectedIssueIds,
        ...rangeIssueIds.filter(
          (rangeIssueId) => !alreadySelected.has(rangeIssueId),
        ),
      ],
      anchorIssueId: selection.anchorIssueId,
    };
  }

  return {
    selectedIssueIds: selection.selectedIssueIds.includes(issueId)
      ? selection.selectedIssueIds.filter(
          (selectedIssueId) => selectedIssueId !== issueId,
        )
      : [...selection.selectedIssueIds, issueId],
    anchorIssueId: issueId,
  };
};
