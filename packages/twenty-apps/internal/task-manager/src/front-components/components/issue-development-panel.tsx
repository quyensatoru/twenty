import { DevelopmentSection } from './development-section';
import { DevelopmentStatus } from './development-status';
import { IssueDeliveryPanel } from './issue-delivery-panel';
import { formatDateTimeLabel } from '../utils/format-date-time-label.util';
import { useEffect, useMemo, useState } from 'react';
import {
  AppPath,
  copyToClipboard,
  enqueueSnackbar,
  navigate,
  t,
  useRecordId,
} from 'twenty-sdk/front-component';
import {
  IconArrowMerge,
  IconGitBranch,
  IconGitCommit,
  IconKey,
  IconSettings,
  IconRefresh,
  IconPlayerPause,
  IconPlayerPlay,
  IconUnlink,
  IconFolder,
  IconPlus,
} from 'twenty-ui/icon';

import {
  CREATE_REPOSITORY_ROUTE_PATH,
  DELETE_REPOSITORY_ROUTE_PATH,
  LIST_GIT_REPOSITORIES_ROUTE_PATH,
  RESYNC_REPOSITORY_ROUTE_PATH,
  UPDATE_REPOSITORY_ROUTE_PATH,
} from '../../constants/route-paths';
import { TaskButton } from './task-button';
import { TaskCopyLinkButton } from './task-copy-link-button';
import { TaskEmptyState } from './task-empty-state';
import { TaskIconButton } from './task-icon-button';
import { TaskMessage } from './task-message';
import { TaskSelect } from './task-select';
import { TaskSkeletonBar } from './task-skeleton';
import { TaskStatusLine } from './task-status-line';
import { TASK_THIN_SCROLLBAR_STYLE, TASK_TOKENS } from './task-tokens';
import {
  useDevelopment,
  type DevelopmentLinkRow,
} from '../hooks/use-development';
import { postAppRoute } from '../utils/post-app-route.util';
import { readErrorText } from '../utils/read-error-text.util';

const LINK_GROUPS = [
  { kind: 'BRANCH', Icon: IconGitBranch },
  { kind: 'PULL_REQUEST', Icon: IconArrowMerge },
  { kind: 'COMMIT', Icon: IconGitCommit },
] as const;

type ProviderRepoOption = {
  slug: string;
  name: string | null;
};

export const IssueDevelopment = () => {
  const issueId = useRecordId();
  const { data, isLoading, loadError, reload } = useDevelopment(issueId);

  const [isGitOpen, setIsGitOpen] = useState(false);
  const [connectionId, setConnectionId] = useState<string>('');
  const [repoSlug, setRepoSlug] = useState<string>('');
  const [repoOptions, setRepoOptions] = useState<ProviderRepoOption[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const linksByKind = useMemo(() => {
    const grouped = new Map<string, DevelopmentLinkRow[]>();

    for (const link of data.links) {
      const kind = typeof link.linkType === 'string' ? link.linkType : 'BRANCH';
      const rows = grouped.get(kind) ?? [];
      rows.push(link);
      grouped.set(kind, rows);
    }

    return grouped;
  }, [data.links]);

  const connectionOptions = useMemo(
    () =>
      data.connections.map((connection) => ({
        value: connection.id,
        label:
          typeof connection.handle === 'string' && connection.handle !== ''
            ? `${connection.provider ?? 'git'} · ${connection.handle}`
            : (connection.provider ?? t('Git account')),
      })),
    [data.connections],
  );

  // Default to the first connected account once they arrive.
  useEffect(() => {
    if (connectionId === '' && connectionOptions.length > 0) {
      setConnectionId(connectionOptions[0]?.value ?? '');
    }
  }, [connectionId, connectionOptions]);

  // Repos of the picked account, loaded when the section opens or the
  // account changes — the link picker offers exactly what OAuth sees.
  useEffect(() => {
    if (!isGitOpen || connectionId === '') {
      return;
    }

    let isCancelled = false;
    setIsLoadingRepos(true);
    postAppRoute<
      {
        repositories?: { slug?: string; name?: string | null }[];
      } & Record<string, unknown>
    >(LIST_GIT_REPOSITORIES_ROUTE_PATH, {
      connectionId,
    })
      .then((result) => {
        if (isCancelled) {
          return;
        }

        const options = (result.repositories ?? [])
          .filter(
            (repo): repo is { slug: string; name?: string | null } =>
              typeof repo === 'object' &&
              repo !== null &&
              typeof (repo as { slug?: unknown }).slug === 'string',
          )
          .map((repo) => ({ slug: repo.slug, name: repo.name ?? null }));
        setRepoOptions(options);
        setRepoSlug((previous) =>
          options.some((option) => option.slug === previous)
            ? previous
            : (options[0]?.slug ?? ''),
        );
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          setActionError(readErrorText(error));
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingRepos(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isGitOpen, connectionId]);

  if (issueId === null) {
    return <TaskMessage text={t('No issue selected.')} />;
  }

  if (isLoading) {
    return (
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          fontFamily: TASK_TOKENS.fontFamily,
          gap: 4,
          height: '100%',
          minHeight: 0,
          overflowY: 'auto',
          scrollbarGutter: 'stable',
          ...TASK_THIN_SCROLLBAR_STYLE,
          width: '100%',
        }}
      >
        <TaskSkeletonBar
          height={40}
          background={TASK_TOKENS.backgroundSecondary}
          radius={TASK_TOKENS.radius}
          style={{ border: `1px solid ${TASK_TOKENS.borderLight}` }}
        />
        <TaskSkeletonBar
          height={40}
          width="70%"
          background={TASK_TOKENS.backgroundSecondary}
          radius={TASK_TOKENS.radius}
          style={{ border: `1px solid ${TASK_TOKENS.borderLight}` }}
        />
      </section>
    );
  }

  if (loadError !== null && data.links.length === 0) {
    return <TaskMessage text={loadError} tone="danger" />;
  }

  const copyText = (text: string, message: string) => {
    void copyToClipboard(text).then(() =>
      enqueueSnackbar({ message, variant: 'success' }),
    );
  };

  const runAction = (work: () => Promise<unknown>) => {
    setIsSaving(true);
    work()
      .then(() => {
        setActionError(null);
        return reload();
      })
      .catch((error: unknown) => {
        const message = readErrorText(error);
        setActionError(message);
        void enqueueSnackbar({ message, variant: 'error' });
      })
      .finally(() => setIsSaving(false));
  };

  const linkRepository = () => {
    if (data.projectId === null || connectionId === '' || repoSlug === '') {
      return;
    }

    setIsSaving(true);
    postAppRoute<
      {
        webhookRegistered?: boolean;
        webhookError?: string;
      } & Record<string, unknown>
    >(CREATE_REPOSITORY_ROUTE_PATH, {
      projectId: data.projectId,
      connectionId,
      slug: repoSlug,
    })
      .then((result) => {
        // The row stays even when the provider refused the webhook (localhost
        // destination, missing grant): the backfill still fills the panel.
        if (
          result.webhookRegistered === false &&
          typeof result.webhookError === 'string'
        ) {
          setActionError(
            `${t('Repository linked, but live updates are off:')} ${result.webhookError}`,
          );
        } else {
          setActionError(null);
        }

        return reload();
      })
      .catch((error: unknown) => {
        const message = readErrorText(error);
        setActionError(message);
        void enqueueSnackbar({ message, variant: 'error' });
      })
      .finally(() => setIsSaving(false));
  };

  const deleteRepository = (repositoryId: string) => {
    runAction(() =>
      postAppRoute(DELETE_REPOSITORY_ROUTE_PATH, { repositoryId }),
    );
  };

  const resyncRepository = (repositoryId: string) => {
    runAction(() =>
      postAppRoute(RESYNC_REPOSITORY_ROUTE_PATH, { repositoryId }),
    );
  };

  const toggleRepository = (repositoryId: string, isActive: boolean | null) => {
    runAction(() =>
      postAppRoute(UPDATE_REPOSITORY_ROUTE_PATH, {
        repositoryId,
        data: { isActive: isActive !== true },
      }),
    );
  };

  const totalCount = data.links.length + data.deliveries.length;
  const issueKey = data.issueKey;

  // One click to the app's Settings page, where the Connections sections live.
  // A front component cannot start OAuth itself — the host owns the flow — so
  // the closest to one-click is landing exactly where Add connection sits.
  const openAppSettings = () => {
    if (data.applicationId === null) {
      return;
    }

    void navigate(AppPath.SettingsCatchAll, {
      '*': `applications/${data.applicationId}`,
    }).catch((error: unknown) => {
      void enqueueSnackbar({
        message: readErrorText(error),
        variant: 'error',
      });
    });
  };

  const repositoryNames = new Map(
    data.repositories.map((repository) => [
      repository.id,
      repository.slug ?? repository.name ?? t('Repository'),
    ]),
  );
  const hasSyncError = data.repositories.some((repository) =>
    [
      repository.syncError,
      repository.webhookError,
      repository.liveSyncError,
    ].some(Boolean),
  );

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        fontFamily: TASK_TOKENS.fontFamily,
        color: TASK_TOKENS.textPrimary,
        gap: 16,
        height: '100%',
        minHeight: 0,
        overflowY: 'auto',
        scrollbarGutter: 'stable',
        ...TASK_THIN_SCROLLBAR_STYLE,
        width: '100%',
        boxSizing: 'border-box',
        padding: '4px 0',
      }}
    >
      {issueKey !== null && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
            padding: '0 8px',
          }}
        >
          <TaskButton
            variant="ghost"
            size="small"
            title={t('Copy issue key')}
            onClick={() => copyText(issueKey, t('Issue key copied'))}
          >
            <IconKey size={14} /> {issueKey}
          </TaskButton>
          <TaskButton
            variant="secondary"
            size="small"
            title={t('Copy branch command')}
            onClick={() =>
              copyText(
                `git checkout -b ${issueKey}-my-change`,
                t('Branch command copied'),
              )
            }
          >
            <IconPlus size={14} /> {t('Create branch')}
          </TaskButton>
        </div>
      )}
      {totalCount === 0 ? (
        <div style={{ padding: '0 8px' }}>
          <TaskEmptyState
            icon={<IconGitBranch size={20} />}
            title={t('Ready for development')}
            description={
              data.repositories.length === 0
                ? t(
                    'Connect a repository to track code, builds and deployments for this issue.',
                  )
                : t(
                    'Include the issue key in a branch, commit or pull request to link it here.',
                  )
            }
            style={{ border: 0, padding: '24px 16px' }}
          />
          {data.canWrite &&
            data.projectId !== null &&
            data.repositories.length === 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginTop: 8,
                }}
              >
                <TaskButton
                  variant="secondary"
                  size="small"
                  onClick={() => setIsGitOpen(true)}
                >
                  <IconPlus size={14} /> {t('Link repository')}
                </TaskButton>
              </div>
            )}
        </div>
      ) : (
        <>
          <div>
            <div
              style={{
                padding: '0 8px 6px',
                fontSize: 11,
                fontWeight: 500,
                color: TASK_TOKENS.textTertiary,
              }}
            >
              {t('Code')}
            </div>
            {LINK_GROUPS.map(({ kind, Icon }) => {
              const rows = linksByKind.get(kind) ?? [];
              const label =
                kind === 'BRANCH'
                  ? t('Branches')
                  : kind === 'COMMIT'
                    ? t('Commits')
                    : t('Pull requests');
              return (
                <DevelopmentSection
                  key={kind}
                  title={label}
                  icon={<Icon size={16} />}
                  count={rows.length}
                  initiallyOpen={kind !== 'COMMIT' && rows.length > 0}
                  summary={rows.length === 0 ? t('No activity') : undefined}
                >
                  {rows.length === 0 ? (
                    <p
                      style={{
                        margin: '4px 0 0',
                        color: TASK_TOKENS.textTertiary,
                        fontSize: 12,
                      }}
                    >
                      {t('No code linked yet.')}
                    </p>
                  ) : (
                    rows.map((row, index) => (
                      <div
                        key={row.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 8,
                          padding: '10px 0',
                          borderTop:
                            index === 0
                              ? undefined
                              : `1px solid ${TASK_TOKENS.borderLight}`,
                          minWidth: 0,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: '4px 8px',
                            }}
                          >
                            <span
                              title={row.title ?? row.externalId ?? ''}
                              style={{
                                color: TASK_TOKENS.textPrimary,
                                fontSize: 13,
                                lineHeight: 1.5,
                                overflowWrap: 'anywhere',
                                minWidth: 0,
                              }}
                            >
                              {row.title ?? row.externalId ?? t('Untitled')}
                            </span>
                            {row.status && row.status !== 'ACTIVE' && (
                              <DevelopmentStatus status={row.status} />
                            )}
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '2px 6px',
                              color: TASK_TOKENS.textTertiary,
                              fontSize: 11,
                              lineHeight: 1.6,
                              marginTop: 3,
                            }}
                          >
                            <span style={{ overflowWrap: 'anywhere' }}>
                              {repositoryNames.get(row.repositoryId ?? '') ??
                                t('Unlinked repository')}
                            </span>
                            {kind === 'PULL_REQUEST' && row.externalId && (
                              <span>· #{row.externalId}</span>
                            )}
                            {kind === 'COMMIT' && row.externalId && (
                              <span
                                title={row.externalId}
                                style={{ fontFamily: 'monospace' }}
                              >
                                · {row.externalId.slice(0, 7)}
                              </span>
                            )}
                            {row.authorName && <span>· {row.authorName}</span>}
                          </div>
                        </div>
                        {row.url && <TaskCopyLinkButton url={row.url} />}
                      </div>
                    ))
                  )}
                </DevelopmentSection>
              );
            })}
          </div>
          <div
            style={{
              borderTop: `1px solid ${TASK_TOKENS.borderLight}`,
              paddingTop: 12,
            }}
          >
            <div
              style={{
                padding: '0 8px 6px',
                fontSize: 11,
                fontWeight: 500,
                color: TASK_TOKENS.textTertiary,
              }}
            >
              {t('Delivery')}
            </div>
            <IssueDeliveryPanel
              deliveries={data.deliveries}
              repositoryNames={repositoryNames}
            />
          </div>
        </>
      )}
      <div
        style={{
          borderTop: `1px solid ${TASK_TOKENS.borderLight}`,
          paddingTop: 8,
        }}
      >
        <DevelopmentSection
          title={t('Repositories')}
          icon={<IconSettings size={16} />}
          count={data.repositories.length}
          isOpen={isGitOpen}
          onOpenChange={setIsGitOpen}
          summary={
            hasSyncError ? t('Sync needs attention') : t('Project settings')
          }
        >
          {data.repositories.map((repo, index) => {
            const isSyncing = [
              'ACTIVE',
              'WAITING',
              'DELAYED',
              'PRIORITIZED',
              'WAITING_CHILDREN',
            ].includes(repo.syncState ?? '');
            const errors = [
              ...new Set(
                [repo.syncError, repo.webhookError, repo.liveSyncError].filter(
                  (error): error is string =>
                    typeof error === 'string' && error !== '',
                ),
              ),
            ];
            return (
              <div
                key={repo.id}
                style={{
                  padding: '12px 0',
                  borderTop:
                    index === 0
                      ? undefined
                      : `1px solid ${TASK_TOKENS.borderLight}`,
                  minWidth: 0,
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}
                >
                  <IconFolder
                    size={16}
                    style={{
                      color: TASK_TOKENS.textTertiary,
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      title={repo.remoteUrl ?? ''}
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        lineHeight: 1.5,
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {repo.slug ?? repo.name ?? t('Repository')}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '2px 6px',
                        color: TASK_TOKENS.textTertiary,
                        fontSize: 11,
                        marginTop: 3,
                        lineHeight: 1.6,
                      }}
                    >
                      <span>
                        {repo.provider === 'GITHUB'
                          ? 'GitHub'
                          : repo.provider === 'GITLAB'
                            ? 'GitLab'
                            : t('Git account')}
                      </span>
                      <span>
                        ·{' '}
                        {repo.isActive === false
                          ? t('Paused')
                          : repo.hasWebhook === true
                            ? t('Live updates')
                            : t('Manual sync')}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: TASK_TOKENS.textTertiary,
                        lineHeight: 1.6,
                        marginTop: 2,
                      }}
                    >
                      {repo.isActive !== false && isSyncing
                        ? t('Syncing…')
                        : repo.lastSyncedAt
                          ? `${t('Last sync:')} ${formatDateTimeLabel(repo.lastSyncedAt)}`
                          : t('Not synced yet')}
                    </div>
                  </div>
                </div>
                {data.canWrite && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 4,
                      marginTop: 8,
                      paddingLeft: 24,
                    }}
                  >
                    <TaskButton
                      variant="secondary"
                      size="small"
                      title={t('Re-sync code, builds and deployments')}
                      isDisabled={
                        isSaving || repo.isActive === false || isSyncing
                      }
                      onClick={() => resyncRepository(repo.id)}
                    >
                      <IconRefresh size={13} /> {t('Resync')}
                    </TaskButton>
                    <TaskButton
                      variant="ghost"
                      size="small"
                      isDisabled={isSaving}
                      onClick={() =>
                        toggleRepository(repo.id, repo.isActive ?? null)
                      }
                    >
                      {repo.isActive === false ? (
                        <IconPlayerPlay size={13} />
                      ) : (
                        <IconPlayerPause size={13} />
                      )}
                      {repo.isActive === false ? t('Resume') : t('Pause')}
                    </TaskButton>
                    <TaskIconButton
                      label={t('Unlink repository')}
                      isDanger
                      isDisabled={isSaving}
                      onClick={() => deleteRepository(repo.id)}
                    >
                      <IconUnlink size={14} />
                    </TaskIconButton>
                  </div>
                )}
                {errors.map((error) => (
                  <TaskStatusLine key={error} text={error} tone="danger" />
                ))}
                {(repo.unknownIssueKeys?.length ?? 0) > 0 && (
                  <TaskStatusLine
                    text={`${t('Unknown issue keys:')} ${repo.unknownIssueKeys?.join(', ')}`}
                    tone="muted"
                  />
                )}
              </div>
            );
          })}
          {data.canWrite && data.projectId !== null && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {connectionOptions.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    padding: '0',
                  }}
                >
                  <span
                    style={{
                      color: TASK_TOKENS.textTertiary,
                      fontSize: 11,
                      lineHeight: 1.5,
                    }}
                  >
                    {t(
                      'Connect a GitHub or GitLab account first, then pick one of its repositories here.',
                    )}
                  </span>
                  {data.applicationId !== null && (
                    <div>
                      <TaskButton
                        variant="secondary"
                        size="small"
                        onClick={openAppSettings}
                      >
                        {t('Connect git account')}
                      </TaskButton>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <TaskSelect
                    value={connectionId}
                    options={connectionOptions}
                    onChange={setConnectionId}
                    ariaLabel={t('Git account')}
                    width="100%"
                  />
                  <TaskSelect
                    value={repoSlug}
                    options={repoOptions.map((option) => ({
                      value: option.slug,
                      label: option.name ?? option.slug,
                    }))}
                    onChange={setRepoSlug}
                    ariaLabel={t('Repository')}
                    width="100%"
                    isDisabled={isLoadingRepos || repoOptions.length === 0}
                  />
                  <div>
                    <TaskButton
                      variant="secondary"
                      size="small"
                      isDisabled={
                        isSaving ||
                        isLoadingRepos ||
                        connectionId === '' ||
                        repoSlug === ''
                      }
                      onClick={linkRepository}
                    >
                      <IconPlus size={14} />
                      {isLoadingRepos
                        ? t('Loading repositories…')
                        : t('Link repository')}
                    </TaskButton>
                  </div>
                  <span
                    style={{
                      color: TASK_TOKENS.textTertiary,
                      fontSize: 11,
                      lineHeight: 1.5,
                      padding: '0',
                    }}
                  >
                    {t(
                      'Linking registers the git webhook and backfills recent branches, commits and pull requests automatically.',
                    )}
                  </span>
                </>
              )}
            </div>
          )}
        </DevelopmentSection>
      </div>
      {loadError !== null && <TaskStatusLine text={loadError} tone="danger" />}
      {actionError !== null && (
        <TaskStatusLine text={actionError} tone="danger" />
      )}
      {isSaving && <TaskStatusLine text={t('Saving…')} tone="muted" />}
    </section>
  );
};
