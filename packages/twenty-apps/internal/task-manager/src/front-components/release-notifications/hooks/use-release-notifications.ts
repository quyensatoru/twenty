import { useCallback, useEffect, useState } from 'react';
import { enqueueSnackbar } from 'twenty-sdk/front-component';

import {
  DELETE_RELEASE_NOTIFICATION_ROUTE_PATH,
  RELEASE_NOTIFICATIONS_ROUTE_PATH,
  SAVE_RELEASE_NOTIFICATION_ROUTE_PATH,
} from '../../../constants/release-notification';
import {
  type ReleaseNotification,
  type ReleaseNotificationInput,
  type ReleaseNotificationsData,
} from '../../../types/release-notification';
import { postAppRoute } from '../../utils/post-app-route.util';
import { readErrorText } from '../../utils/read-error-text.util';

const readList = <TEntry>(value: unknown): TEntry[] =>
  Array.isArray(value) ? (value as TEntry[]) : [];

const reportError = (error: unknown) =>
  void enqueueSnackbar({ message: readErrorText(error), variant: 'error' });

export const buildReleaseNotificationInput = (
  release: ReleaseNotification,
): ReleaseNotificationInput => ({
  appId: release.appId ?? '',
  title: release.title ?? '',
  contentMarkdown: release.content?.markdown ?? '',
  category: release.category ?? 'NEW',
  releaseDate: release.releaseDate,
  linkDocUrl: release.linkDoc?.primaryLinkUrl ?? '',
  version: release.version ?? '',
  status: release.status ?? 'DRAFT',
});

const compareReleases = (
  left: ReleaseNotification,
  right: ReleaseNotification,
): number => {
  if (left.releaseDate !== right.releaseDate) {
    if (left.releaseDate === null) {
      return -1;
    }

    if (right.releaseDate === null) {
      return 1;
    }

    return right.releaseDate.localeCompare(left.releaseDate);
  }

  return right.createdAt.localeCompare(left.createdAt);
};

export const useReleaseNotifications = () => {
  const [data, setData] = useState<ReleaseNotificationsData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const result = await postAppRoute<Record<string, unknown>>(
        RELEASE_NOTIFICATIONS_ROUTE_PATH,
        {},
      );

      setData({
        apps: readList(result.apps),
        releases: readList(result.releases),
      });
      setLoadError(null);
    } catch (error) {
      setLoadError(readErrorText(error));
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const upsertRelease = (release: ReleaseNotification) =>
    setData((current) =>
      current === null
        ? current
        : {
            ...current,
            releases: [
              ...current.releases.filter((entry) => entry.id !== release.id),
              release,
            ].sort(compareReleases),
          },
    );

  const saveRelease = async (
    input: ReleaseNotificationInput,
    releaseNotificationId: string | null,
  ): Promise<ReleaseNotification | null> => {
    try {
      const result = await postAppRoute<{
        releaseNotification?: ReleaseNotification;
      }>(SAVE_RELEASE_NOTIFICATION_ROUTE_PATH, {
        releaseNotificationId,
        input,
      });
      const release = result.releaseNotification ?? null;

      if (release !== null) {
        upsertRelease(release);
      }

      return release;
    } catch (error) {
      reportError(error);

      return null;
    }
  };

  const deleteRelease = async (releaseNotificationId: string) => {
    try {
      await postAppRoute(DELETE_RELEASE_NOTIFICATION_ROUTE_PATH, {
        releaseNotificationId,
      });
      setData((current) =>
        current === null
          ? current
          : {
              ...current,
              releases: current.releases.filter(
                (release) => release.id !== releaseNotificationId,
              ),
            },
      );

      return true;
    } catch (error) {
      reportError(error);

      return false;
    }
  };

  return { data, loadError, reload, saveRelease, deleteRelease };
};
