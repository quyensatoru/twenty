export const hasInsertedMentionTrigger = (
  previousValue: string,
  nextValue: string,
): boolean => {
  // BlockNote can rewrite paragraph breaks around existing mentions, so their
  // positions and the changed text alone do not identify a new trigger.
  const previousTriggerCount = previousValue.match(/@/g)?.length ?? 0;
  const nextTriggerCount = nextValue.match(/@/g)?.length ?? 0;
  return (
    nextTriggerCount > previousTriggerCount ||
    (nextValue.trimEnd().endsWith('@') &&
      !previousValue.trimEnd().endsWith('@'))
  );
};
