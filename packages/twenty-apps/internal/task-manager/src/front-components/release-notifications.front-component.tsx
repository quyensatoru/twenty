import { useMemo, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';
import { IconPlus, IconSearch, IconSparkles } from 'twenty-ui/icon';

import {
  RELEASE_NOTIFICATIONS_FRONT_COMPONENT_UID,
  type ReleaseNotificationCategory,
  type ReleaseNotificationStatus,
} from '../constants/release-notification';
import {
  type ReleaseNotification,
  type ReleaseNotificationInput,
} from '../types/release-notification';
import { TaskBoardSelect, GHOST_TRIGGER_LEADING_OFFSET } from './components/task-board-select';
import { TaskButton } from './components/task-button';
import { TaskEmptyState } from './components/task-empty-state';
import { TaskMessage } from './components/task-message';
import { TaskSkeletonBar, TaskSkeletonLines } from './components/task-skeleton';
import { TaskTabs } from './components/task-tabs';
import { TaskTextInput } from './components/task-text-input';
import {
  TASK_THIN_SCROLLBAR_STYLE,
  TASK_TOKENS,
} from './components/task-tokens';
import { TaskProjectBadge } from './components/task-toolbar';
import { useIsMobile } from './hooks/use-is-mobile';
import { readReleaseCategoryLabel } from './release-notifications/components/release-category-badge';
import { ReleaseNotificationDetail } from './release-notifications/components/release-notification-detail';
import { ReleaseNotificationEditorDialog } from './release-notifications/components/release-notification-editor-dialog';
import { ReleaseNotificationList } from './release-notifications/components/release-notification-list';
import {
  buildReleaseNotificationInput,
  useReleaseNotifications,
} from './release-notifications/hooks/use-release-notifications';
import { readTodayCalendarDate } from './release-notifications/utils/format-release-date.util';
import { readMarkdownExcerpt } from './release-notifications/utils/read-markdown-excerpt.util';

const APP_STORAGE_KEY = 'release-notifications.app-id';
const LIST_COLUMN_WIDTH = 400;

type CategoryFilter = 'ALL' | ReleaseNotificationCategory;
type StatusFilter = 'ALL' | ReleaseNotificationStatus;
type EditorState = {
  releaseId: string | null;
  input: ReleaseNotificationInput;
};

const CATEGORY_FILTERS: readonly CategoryFilter[] = [
  'ALL',
  'NEW',
  'IMPROVEMENT',
  'FIX',
];

const readStoredAppId = (): string | null => {
  try {
    return localStorage.getItem(APP_STORAGE_KEY);
  } catch {
    return null;
  }
};

const storeAppId = (appId: string) => {
  try {
    localStorage.setItem(APP_STORAGE_KEY, appId);
  } catch {
    // A convenience only: the page falls back to the first app.
  }
};

const matchesSearch = (release: ReleaseNotification, search: string) => {
  const query = search.trim().toLowerCase();

  if (query === '') {
    return true;
  }

  return [
    release.title ?? '',
    release.version ?? '',
    readMarkdownExcerpt(release.content?.markdown, 2000),
  ].some((text) => text.toLowerCase().includes(query));
};

const ReleaseNotifications = () => {
  const isMobile = useIsMobile();
  const { data, loadError, saveRelease, deleteRelease } =
    useReleaseNotifications();
  const [storedAppId, setStoredAppId] = useState(readStoredAppId);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(
    null,
  );
  const [editor, setEditor] = useState<EditorState | null>(null);

  const activeApp =
    data?.apps.find((app) => app.id === storedAppId) ?? data?.apps[0] ?? null;

  const appReleases = useMemo(
    () =>
      activeApp === null || data === null
        ? []
        : data.releases.filter((release) => release.appId === activeApp.id),
    [activeApp, data],
  );

  const releasesMatchingStatusAndSearch = appReleases.filter(
    (release) =>
      (statusFilter === 'ALL' || release.status === statusFilter) &&
      matchesSearch(release, search),
  );
  const visibleReleases = releasesMatchingStatusAndSearch.filter(
    (release) =>
      categoryFilter === 'ALL' || release.category === categoryFilter,
  );
  const selectedRelease =
    visibleReleases.find((release) => release.id === selectedReleaseId) ??
    (isMobile ? null : (visibleReleases[0] ?? null));
  const publishedCount = appReleases.filter(
    (release) => release.status === 'PUBLISHED',
  ).length;

  const inset = isMobile ? 12 : 20;

  const openNewRelease = () => {
    if (activeApp === null) {
      return;
    }

    setEditor({
      releaseId: null,
      input: {
        appId: activeApp.id,
        title: '',
        contentMarkdown: '',
        category: categoryFilter === 'ALL' ? 'NEW' : categoryFilter,
        releaseDate: readTodayCalendarDate(),
        linkDocUrl: '',
        version: '',
        status: 'DRAFT',
      },
    });
  };

  const handleSave = async (input: ReleaseNotificationInput) => {
    const release = await saveRelease(input, editor?.releaseId ?? null);

    if (release === null) {
      return false;
    }

    setSelectedReleaseId(release.id);
    void enqueueSnackbar({
      message:
        release.status === 'PUBLISHED'
          ? t('Release published')
          : t('Release saved as draft'),
      variant: 'success',
    });

    return true;
  };

  const togglePublish = async (release: ReleaseNotification) => {
    const isPublished = release.status === 'PUBLISHED';
    const saved = await saveRelease(
      {
        ...buildReleaseNotificationInput(release),
        status: isPublished ? 'DRAFT' : 'PUBLISHED',
      },
      release.id,
    );

    if (saved !== null) {
      void enqueueSnackbar({
        message: isPublished
          ? t('Release moved back to draft')
          : t('Release published'),
        variant: 'success',
      });
    }
  };

  const handleDelete = async (release: ReleaseNotification) => {
    if (await deleteRelease(release.id)) {
      setSelectedReleaseId(null);
      void enqueueSnackbar({
        message: t('Release deleted'),
        variant: 'success',
      });
    }
  };

  if (data === null) {
    return (
      <ReleaseNotificationsFrame>
        {loadError === null ? (
          <ReleaseNotificationsSkeleton />
        ) : (
          <TaskMessage text={loadError} tone="danger" />
        )}
      </ReleaseNotificationsFrame>
    );
  }

  if (activeApp === null) {
    return (
      <ReleaseNotificationsFrame>
        <TaskMessage
          text={t(
            'No app is available to you yet. Ask for access to a Shopify app first.',
          )}
        />
      </ReleaseNotificationsFrame>
    );
  }

  const isListVisible = !isMobile || selectedRelease === null;
  const isDetailVisible = selectedRelease !== null;

  return (
    <ReleaseNotificationsFrame>
      <header
        style={{
          alignItems: 'center',
          borderBottom: `1px solid ${TASK_TOKENS.border}`,
          boxSizing: 'border-box',
          display: 'flex',
          flexShrink: 0,
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          gap: 8,
          minHeight: 48,
          padding: `6px ${inset}px 6px 12px`,
        }}
      >
        <span
          style={{
            display: 'flex',
            marginLeft: -GHOST_TRIGGER_LEADING_OFFSET,
            minWidth: 0,
          }}
        >
          <TaskBoardSelect
            ariaLabel={t('App')}
            variant="ghost"
            width="auto"
            value={activeApp.id}
            triggerIcon={<TaskProjectBadge projectKey={activeApp.name} />}
            options={data.apps.map((app) => ({
              value: app.id,
              label: app.name,
              icon: <TaskProjectBadge projectKey={app.name} size={18} />,
            }))}
            onChange={(appId) => {
              setStoredAppId(appId);
              storeAppId(appId);
              setSelectedReleaseId(null);
            }}
          />
        </span>
        {!isMobile && (
          <span
            style={{
              color: TASK_TOKENS.textTertiary,
              fontSize: 12,
              whiteSpace: 'nowrap',
            }}
          >
            {t('{published} published · {drafts} drafts', {
              published: publishedCount,
              drafts: appReleases.length - publishedCount,
            })}
          </span>
        )}
        <span style={{ flex: 1 }} />
        <div
          style={{
            display: 'flex',
            flex: isMobile ? '1 1 100%' : '0 1 300px',
            order: isMobile ? 3 : 0,
          }}
        >
          <TaskTextInput
            value={search}
            onChange={setSearch}
            ariaLabel={t('Search releases')}
            placeholder={t('Search releases…')}
            prefixIcon={
              <IconSearch size={14} color={TASK_TOKENS.textTertiary} />
            }
            height={30}
          />
        </div>
        {activeApp.canWrite && (
          <TaskButton
            variant="primary"
            size="compact"
            title={t('New release')}
            onClick={openNewRelease}
          >
            <IconPlus size={14} />
            {!isMobile && t('New release')}
          </TaskButton>
        )}
      </header>

      <div style={{ flexShrink: 0, padding: `0 ${inset}px 0 12px` }}>
        <TaskTabs
          variant="underline"
          value={categoryFilter}
          onChange={(value) => {
            setCategoryFilter(value);
            setSelectedReleaseId(null);
          }}
          tabs={CATEGORY_FILTERS.map((filter) => ({
            value: filter,
            label: filter === 'ALL' ? t('All') : readReleaseCategoryLabel(filter),
            count:
              filter === 'ALL'
                ? releasesMatchingStatusAndSearch.length
                : releasesMatchingStatusAndSearch.filter(
                    (release) => release.category === filter,
                  ).length,
          }))}
          trailing={
            isMobile ? undefined : (
              <TaskTabs
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value);
                  setSelectedReleaseId(null);
                }}
                tabs={[
                  { value: 'ALL', label: t('All') },
                  { value: 'PUBLISHED', label: t('Published') },
                  { value: 'DRAFT', label: t('Drafts') },
                ]}
              />
            )
          }
        />
      </div>

      {appReleases.length === 0 ? (
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flex: 1,
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              maxWidth: 420,
              width: '100%',
            }}
          >
            <TaskEmptyState
              icon={<IconSparkles size={18} />}
              title={t('No release notes for {app} yet', {
                app: activeApp.name,
              })}
              description={t(
                'Write what shipped. Publishing sends the note to the app through the webhook.',
              )}
              style={{ width: '100%' }}
            />
            {activeApp.canWrite && (
              <TaskButton variant="primary" onClick={openNewRelease}>
                <IconPlus size={14} />
                {t('Write the first release')}
              </TaskButton>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {isListVisible && (
            <div
              style={{
                ...TASK_THIN_SCROLLBAR_STYLE,
                borderRight: isMobile
                  ? 'none'
                  : `1px solid ${TASK_TOKENS.border}`,
                boxSizing: 'border-box',
                flex: isMobile ? 1 : `0 0 ${LIST_COLUMN_WIDTH}px`,
                minWidth: 0,
                overflowY: 'auto',
                paddingBottom: 24,
              }}
            >
              {visibleReleases.length === 0 ? (
                <TaskMessage text={t('No release matches these filters.')} />
              ) : (
                <ReleaseNotificationList
                  releases={visibleReleases}
                  selectedReleaseId={selectedRelease?.id ?? null}
                  onSelect={setSelectedReleaseId}
                  inlinePadding={isMobile ? 12 : 16}
                />
              )}
            </div>
          )}
          {isDetailVisible ? (
            <ReleaseNotificationDetail
              key={selectedRelease.id}
              release={selectedRelease}
              app={activeApp}
              isMobile={isMobile}
              onBack={() => setSelectedReleaseId(null)}
              onEdit={() =>
                setEditor({
                  releaseId: selectedRelease.id,
                  input: buildReleaseNotificationInput(selectedRelease),
                })
              }
              onTogglePublish={() => togglePublish(selectedRelease)}
              onDelete={() => void handleDelete(selectedRelease)}
            />
          ) : (
            !isMobile && <div style={{ flex: 1 }} />
          )}
        </div>
      )}

      {editor !== null && (
        <twenty-overlay>
          <ReleaseNotificationEditorDialog
            appName={
              data.apps.find((app) => app.id === editor.input.appId)?.name ??
              activeApp.name
            }
            initialInput={editor.input}
            isNew={editor.releaseId === null}
            isMobile={isMobile}
            onClose={() => setEditor(null)}
            onSave={handleSave}
          />
        </twenty-overlay>
      )}
    </ReleaseNotificationsFrame>
  );
};

const ReleaseNotificationsSkeleton = () => (
  <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
    <div
      style={{
        borderRight: `1px solid ${TASK_TOKENS.border}`,
        display: 'flex',
        flex: `0 0 ${LIST_COLUMN_WIDTH}px`,
        flexDirection: 'column',
        gap: 20,
        padding: 20,
      }}
    >
      {[0, 1, 2, 3].map((index) => (
        <div key={index} style={{ display: 'flex', gap: 12 }}>
          <TaskSkeletonBar width={30} height={30} />
          <TaskSkeletonLines widths={[70, 40, 90]} style={{ flex: 1 }} />
        </div>
      ))}
    </div>
    <div style={{ flex: 1, padding: 40 }}>
      <TaskSkeletonLines widths={[20, 60, 35, 90, 85, 70]} />
    </div>
  </div>
);

const ReleaseNotificationsFrame = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <section
    style={{
      background: TASK_TOKENS.background,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: TASK_TOKENS.fontFamily,
      height: '100%',
      minHeight: 0,
      width: '100%',
    }}
  >
    {children}
  </section>
);

export default defineFrontComponent({
  universalIdentifier: RELEASE_NOTIFICATIONS_FRONT_COMPONENT_UID,
  name: 'release-notifications',
  description:
    'Release Notes: write, publish and manage release notifications per Shopify app.',
  component: ReleaseNotifications,
});
