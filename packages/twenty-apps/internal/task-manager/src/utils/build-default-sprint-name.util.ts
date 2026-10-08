const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Jira's "<KEY> Sprint <n>", numbered after the highest sprint already named
// that way, so renaming an older sprint never hands out a number twice.
export const buildDefaultSprintName = ({
  projectKey,
  existingNames,
}: {
  projectKey: string | null | undefined;
  existingNames: readonly (string | null | undefined)[];
}): string => {
  const prefix =
    typeof projectKey === 'string' && projectKey.trim() !== ''
      ? `${projectKey.trim()} Sprint`
      : 'Sprint';
  const pattern = new RegExp(`^${escapeRegExp(prefix)} (\\d+)$`);
  const highestNumber = existingNames.reduce<number>((highest, name) => {
    const match = typeof name === 'string' ? pattern.exec(name.trim()) : null;

    return match === null ? highest : Math.max(highest, Number(match[1]));
  }, 0);

  return `${prefix} ${highestNumber + 1}`;
};
