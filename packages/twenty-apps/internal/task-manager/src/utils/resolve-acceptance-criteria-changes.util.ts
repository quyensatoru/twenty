import { type AcceptanceCriterion } from '../types/product-backlog';

export type AcceptanceCriterionChange = {
  action: 'ac-added' | 'ac-removed' | 'ac-checked' | 'ac-unchecked';
  text: string;
};

const readCriteria = (value: unknown): AcceptanceCriterion[] =>
  Array.isArray(value)
    ? value.filter(
        (criterion): criterion is AcceptanceCriterion =>
          typeof criterion === 'object' &&
          criterion !== null &&
          typeof (criterion as AcceptanceCriterion).id === 'string',
      )
    : [];

// The History feed's acceptance-criteria entries for one `issue.updated`
// event: added, removed, ticked and unticked. A reworded criterion is not an
// entry. Like the status, both snapshots must carry the key.
export const resolveAcceptanceCriteriaChanges = ({
  before,
  after,
}: {
  before?: { acceptanceCriteria?: unknown } | null;
  after?: { acceptanceCriteria?: unknown } | null;
}): AcceptanceCriterionChange[] => {
  if (
    before === null ||
    before === undefined ||
    after === null ||
    after === undefined ||
    !('acceptanceCriteria' in after)
  ) {
    return [];
  }

  const previous = readCriteria(before.acceptanceCriteria);
  const next = readCriteria(after.acceptanceCriteria);
  const previousById = new Map(
    previous.map((criterion) => [criterion.id, criterion]),
  );
  const nextIds = new Set(next.map((criterion) => criterion.id));
  const changes: AcceptanceCriterionChange[] = [];

  for (const criterion of next) {
    const previousCriterion = previousById.get(criterion.id);

    if (previousCriterion === undefined) {
      changes.push({ action: 'ac-added', text: criterion.text });
    } else if (previousCriterion.isDone !== criterion.isDone) {
      changes.push({
        action: criterion.isDone ? 'ac-checked' : 'ac-unchecked',
        text: criterion.text,
      });
    }
  }

  for (const criterion of previous) {
    if (!nextIds.has(criterion.id)) {
      changes.push({ action: 'ac-removed', text: criterion.text });
    }
  }

  return changes;
};
