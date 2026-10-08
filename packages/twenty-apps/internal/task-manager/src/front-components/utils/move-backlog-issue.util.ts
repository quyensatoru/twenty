import { type BacklogSection } from '../../types/backlog';

// The optimistic half of a backlog drop: the row leaves its section and lands
// before `beforeIssueId` (or last), the totals follow it, and the server's
// answer only has to agree. Returns the same array when nothing moves.
export const moveBacklogIssue = ({
  sections,
  issueId,
  targetSectionKey,
  beforeIssueId,
}: {
  sections: BacklogSection[];
  issueId: string;
  targetSectionKey: string;
  beforeIssueId: string | null;
}): BacklogSection[] => {
  const sourceSection = sections.find((section) =>
    section.issues.some((issue) => issue.id === issueId),
  );
  const movedIssue = sourceSection?.issues.find((issue) => issue.id === issueId);
  const targetSection = sections.find(
    (section) => section.key === targetSectionKey,
  );

  if (
    sourceSection === undefined ||
    movedIssue === undefined ||
    targetSection === undefined ||
    beforeIssueId === issueId
  ) {
    return sections;
  }

  const remainingTargetIssues = targetSection.issues.filter(
    (issue) => issue.id !== issueId,
  );
  const insertIndex =
    beforeIssueId === null
      ? -1
      : remainingTargetIssues.findIndex((issue) => issue.id === beforeIssueId);
  const placedIssue = { ...movedIssue, sprintId: targetSection.sprintId };
  const targetIssues =
    insertIndex === -1
      ? [...remainingTargetIssues, placedIssue]
      : [
          ...remainingTargetIssues.slice(0, insertIndex),
          placedIssue,
          ...remainingTargetIssues.slice(insertIndex),
        ];

  if (
    sourceSection.key === targetSection.key &&
    targetIssues.every(
      (issue, index) => issue.id === targetSection.issues[index]?.id,
    )
  ) {
    return sections;
  }

  const storyPoints = movedIssue.storyPoints ?? 0;
  const shift = (section: BacklogSection, delta: number): BacklogSection => ({
    ...section,
    totalCount: Math.max(0, section.totalCount + delta),
    unfilteredCount: Math.max(0, section.unfilteredCount + delta),
    storyPointTotal: section.storyPointTotal + delta * storyPoints,
  });

  return sections.map((section) => {
    if (section.key === targetSection.key) {
      const placed = { ...section, issues: targetIssues };

      return section.key === sourceSection.key ? placed : shift(placed, 1);
    }

    if (section.key === sourceSection.key) {
      return shift(
        {
          ...section,
          issues: section.issues.filter((issue) => issue.id !== issueId),
        },
        -1,
      );
    }

    return section;
  });
};
