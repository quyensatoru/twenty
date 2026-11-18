import { type ReleaseNotification } from '../../../types/release-notification';

export type ReleaseMonthGroup = {
  // 'YYYY-MM', or null for releases with no date yet.
  monthKey: string | null;
  releases: ReleaseNotification[];
};

// Expects releases already sorted newest first, undated ones leading.
export const groupReleasesByMonth = (
  releases: readonly ReleaseNotification[],
): ReleaseMonthGroup[] => {
  const groups: ReleaseMonthGroup[] = [];

  for (const release of releases) {
    const monthKey =
      typeof release.releaseDate === 'string' && release.releaseDate.length >= 7
        ? release.releaseDate.slice(0, 7)
        : null;
    const lastGroup = groups[groups.length - 1];

    if (lastGroup !== undefined && lastGroup.monthKey === monthKey) {
      lastGroup.releases.push(release);
    } else {
      groups.push({ monthKey, releases: [release] });
    }
  }

  return groups;
};
