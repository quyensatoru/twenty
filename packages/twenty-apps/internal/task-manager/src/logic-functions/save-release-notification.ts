import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  RELEASE_NOTIFICATION_CATEGORY_OPTIONS,
  RELEASE_NOTIFICATION_SELECTION,
  RELEASE_NOTIFICATION_STATUS_OPTIONS,
  SAVE_RELEASE_NOTIFICATION_LOGIC_FUNCTION_UID,
  SAVE_RELEASE_NOTIFICATION_ROUTE_PATH,
} from '../constants/release-notification';
import { type ReleaseNotificationInput } from '../types/release-notification';
import { buildRichTextValue } from '../utils/read-rich-text-plain-value.util';
import { assertAppScopeWriteAccess } from './app-scope/assert-app-scope-write-access.util';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { fetchRecordColumn } from './utils/fetch-record-column.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type SaveReleaseNotificationBody = {
  releaseNotificationId?: string;
  input?: Partial<ReleaseNotificationInput>;
};

const RELEASE_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const readTrimmedText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const readOption = <TValue extends string>(
  value: unknown,
  options: readonly { value: TValue }[],
  name: string,
): TValue => {
  const option = options.find((candidate) => candidate.value === value);

  if (option === undefined) {
    throw new Error(`${name} is not valid.`);
  }

  return option.value;
};

const readReleaseDate = (value: unknown): string | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value !== 'string' || !RELEASE_DATE_PATTERN.test(value)) {
    throw new Error('releaseDate must be YYYY-MM-DD.');
  }

  return value;
};

const readLinkUrl = (value: unknown): string => {
  const url = readTrimmedText(value);

  if (url !== '' && !/^https?:\/\//i.test(url)) {
    throw new Error('The doc link must start with http:// or https://.');
  }

  return url;
};

const handler = async (event: RoutePayload<SaveReleaseNotificationBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const releaseNotificationId = event.body?.releaseNotificationId;
    const input = event.body?.input ?? {};
    const appId = requireString(input.appId, 'appId');
    const title = readTrimmedText(input.title);

    if (title === '') {
      throw new Error('title is required.');
    }

    const status = readOption(
      input.status,
      RELEASE_NOTIFICATION_STATUS_OPTIONS,
      'status',
    );

    const data: Record<string, unknown> = {
      appId,
      title,
      content: buildRichTextValue(
        typeof input.contentMarkdown === 'string' ? input.contentMarkdown : '',
      ),
      category: readOption(
        input.category,
        RELEASE_NOTIFICATION_CATEGORY_OPTIONS,
        'category',
      ),
      releaseDate: readReleaseDate(input.releaseDate),
      linkDoc: {
        primaryLinkUrl: readLinkUrl(input.linkDocUrl),
        primaryLinkLabel: '',
        secondaryLinks: null,
      },
      version: readTrimmedText(input.version),
      status,
    };

    await assertAppScopeWriteAccess({
      client,
      scope,
      objectNameSingular: 'releaseNotification',
      foreignKeyValue: appId,
    });

    if (typeof releaseNotificationId === 'string' && releaseNotificationId !== '') {
      await assertRecordInScope({
        client,
        scope,
        objectNameSingular: 'releaseNotification',
        recordId: releaseNotificationId,
        operation: 'write',
      });

      const currentPublishedAt = await fetchRecordColumn(
        client,
        'releaseNotifications',
        releaseNotificationId,
        'publishedAt',
      );

      // Kept across edits so a typo fix does not re-announce the release.
      data.publishedAt =
        status === 'PUBLISHED'
          ? (currentPublishedAt ?? new Date().toISOString())
          : null;

      const result = await client.mutation({
        updateReleaseNotification: {
          __args: { id: releaseNotificationId, data },
          ...RELEASE_NOTIFICATION_SELECTION,
        },
      });

      return { releaseNotification: result?.updateReleaseNotification };
    }

    data.publishedAt = status === 'PUBLISHED' ? new Date().toISOString() : null;

    const result = await client.mutation({
      createReleaseNotification: {
        __args: { data },
        ...RELEASE_NOTIFICATION_SELECTION,
      },
    });

    return { releaseNotification: result?.createReleaseNotification };
  });

export default defineLogicFunction({
  universalIdentifier: SAVE_RELEASE_NOTIFICATION_LOGIC_FUNCTION_UID,
  name: 'save-release-notification',
  description:
    'Route: creates or updates a release notification in an app the caller can write.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: SAVE_RELEASE_NOTIFICATION_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
