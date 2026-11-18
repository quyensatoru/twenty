import {
  type ReleaseNotificationCategory,
  type ReleaseNotificationStatus,
} from '../constants/release-notification';

export type ReleaseNotification = {
  id: string;
  title: string | null;
  content: { markdown?: string | null } | null;
  category: ReleaseNotificationCategory | null;
  releaseDate: string | null;
  linkDoc: {
    primaryLinkUrl?: string | null;
    primaryLinkLabel?: string | null;
  } | null;
  version: string | null;
  status: ReleaseNotificationStatus | null;
  publishedAt: string | null;
  appId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReleaseNotificationApp = {
  id: string;
  name: string;
  canWrite: boolean;
  canDelete: boolean;
};

export type ReleaseNotificationsData = {
  apps: ReleaseNotificationApp[];
  releases: ReleaseNotification[];
};

export type ReleaseNotificationInput = {
  appId: string;
  title: string;
  contentMarkdown: string;
  category: ReleaseNotificationCategory;
  releaseDate: string | null;
  linkDocUrl: string;
  version: string;
  status: ReleaseNotificationStatus;
};
