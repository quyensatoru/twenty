import { isNonEmptyString, isObject } from '@sniptt/guards';

import { type DevelopmentDelivery } from '../../types/development-delivery';
import { parseDevelopmentDeliveries } from '../../utils/parse-development-deliveries.util';
import { type GitRepository } from './get-active-git-repository.util';
import { readGitApiJson } from './git-api.util';

const RECENT_DELIVERY_LIMIT = 20;
const INITIAL_COMMIT_LIMIT = 100;
const MAX_COMPARISON_COMMITS = 1000;

type ApiRow = Record<string, unknown>;
type DeliveryApiOptions = { repository: GitRepository; accessToken: string };
const record = (value: unknown): ApiRow =>
  isObject(value) ? (value as ApiRow) : {};
const text = (value: unknown): string | null =>
  isNonEmptyString(value) ? value : null;

const api = ({ repository, accessToken }: DeliveryApiOptions) => {
  if (repository.connectionId === null || repository.slug === null)
    throw new Error('Incomplete repository connection.');
  const isGitHub = repository.provider === 'GITHUB';
  const root = isGitHub
    ? `${repository.baseUrl ?? 'https://api.github.com'}/repos/${repository.slug}`
    : `${repository.baseUrl ?? 'https://gitlab.com'}/api/v4/projects/${encodeURIComponent(repository.externalId ?? repository.slug)}`;
  return <TData>(path: string): Promise<TData> =>
    readGitApiJson<TData>({
      url: `${root}${path}`,
      accessToken,
      connectionId: repository.connectionId!,
    });
};

export const listRecentDevelopmentDeliveries = async (
  options: DeliveryApiOptions,
): Promise<DevelopmentDelivery[]> => {
  const read = api(options);
  if (options.repository.provider === 'GITHUB') {
    const runs = await read<{ workflow_runs: ApiRow[] }>(
      `/actions/runs?per_page=${RECENT_DELIVERY_LIMIT}`,
    );
    const deliveries = (runs.workflow_runs ?? []).flatMap((workflow_run) =>
      parseDevelopmentDeliveries({
        provider: 'github',
        eventName: 'workflow_run',
        payload: { workflow_run },
      }),
    );
    const deployments = await read<ApiRow[]>(
      `/deployments?per_page=${RECENT_DELIVERY_LIMIT}`,
    );
    for (const deployment of deployments) {
      const states = await read<ApiRow[]>(
        `/deployments/${deployment.id}/statuses?per_page=1`,
      );
      if (states[0] !== undefined)
        deliveries.push(
          ...parseDevelopmentDeliveries({
            provider: 'github',
            eventName: 'deployment_status',
            payload: { deployment, deployment_status: states[0] },
          }),
        );
    }
    return deliveries;
  }
  const pipelines = await read<ApiRow[]>(
    `/pipelines?per_page=${RECENT_DELIVERY_LIMIT}&order_by=updated_at&sort=desc`,
  );
  const deliveries: DevelopmentDelivery[] = [];
  for (const pipeline of pipelines) {
    const detail = await read<ApiRow>(`/pipelines/${pipeline.id}`);
    deliveries.push(
      ...parseDevelopmentDeliveries({
        provider: 'gitlab',
        eventName: null,
        payload: {
          object_kind: 'pipeline',
          object_attributes: detail,
          project: { web_url: options.repository.remoteUrl },
        },
      }),
    );
  }
  const deployments = await read<ApiRow[]>(
    `/deployments?per_page=${RECENT_DELIVERY_LIMIT}&order_by=updated_at&sort=desc`,
  );
  for (const deployment of deployments) {
    const environment = await readGitLabEnvironment(read, deployment);
    deliveries.push(...gitLabDeploymentEvents({ ...deployment, environment }));
  }
  return deliveries;
};

const readGitLabEnvironment = async (
  read: <TData>(path: string) => Promise<TData>,
  deployment: ApiRow,
): Promise<ApiRow> => {
  const environment = record(deployment.environment);
  if (environment.id === undefined || environment.id === null)
    return environment;
  return {
    ...environment,
    ...(await read<ApiRow>(
      `/environments/${encodeURIComponent(String(environment.id))}`,
    )),
  };
};

const gitLabDeploymentEvents = (deployment: ApiRow): DevelopmentDelivery[] => {
  const environment = record(deployment.environment);
  const job = record(deployment.deployable);
  const pipeline = record(job.pipeline);
  return parseDevelopmentDeliveries({
    provider: 'gitlab',
    eventName: null,
    payload: {
      object_kind: 'deployment',
      deployment_id: deployment.id,
      status: deployment.status,
      status_changed_at: deployment.updated_at,
      created_at: deployment.created_at,
      sha: deployment.sha,
      ref: deployment.ref,
      environment: environment.name,
      environment_tier: environment.tier,
      pipeline_id: pipeline.id,
      deployable_url: job.web_url,
    },
  });
};

export const enrichDevelopmentDelivery = async (
  options: DeliveryApiOptions & { delivery: DevelopmentDelivery },
): Promise<DevelopmentDelivery> => {
  const read = api(options);
  let delivery = options.delivery;
  const isGitHub = options.repository.provider === 'GITHUB';
  if (!isGitHub) {
    if (delivery.deliveryType === 'DEPLOYMENT') {
      const detail = await read<ApiRow>(
        `/deployments/${encodeURIComponent(delivery.externalId)}`,
      );
      const environment = await readGitLabEnvironment(read, detail);
      // GitLab webhooks expose a short SHA; the API supplies the exact deployed commit.
      delivery = {
        ...delivery,
        commitSha: text(detail.sha) ?? delivery.commitSha,
        environmentName: text(environment.name) ?? delivery.environmentName,
        environmentType:
          text(environment.tier)?.toUpperCase() ?? delivery.environmentType,
        branchName: text(detail.ref) ?? delivery.branchName,
        pipelineId:
          text(String(record(record(detail.deployable).pipeline).id ?? '')) ??
          delivery.pipelineId,
        startedAt: text(detail.created_at) ?? delivery.startedAt,
      };
    } else {
      const detail = await read<ApiRow>(
        `/pipelines/${encodeURIComponent(delivery.externalId)}`,
      );
      delivery =
        parseDevelopmentDeliveries({
          provider: 'gitlab',
          eventName: null,
          payload: {
            object_kind: 'pipeline',
            object_attributes: detail,
            project: { web_url: options.repository.remoteUrl },
          },
        })[0] ?? delivery;
    }
  }
  if (delivery.commitSha === null) return delivery;
  const texts: string[] = delivery.text === null ? [] : [delivery.text];
  const sha = encodeURIComponent(delivery.commitSha);
  if (delivery.deliveryType === 'BUILD') {
    const commit = await read<ApiRow>(
      isGitHub ? `/commits/${sha}` : `/repository/commits/${sha}`,
    );
    const message = isGitHub
      ? text(record(commit.commit).message)
      : text(commit.message);
    if (message !== null) texts.push(message);
    const pulls = await read<ApiRow[]>(
      isGitHub
        ? `/commits/${sha}/pulls?per_page=100`
        : `/repository/commits/${sha}/merge_requests?per_page=100`,
    );
    for (const pull of pulls)
      texts.push(
        [pull.title, record(pull.head).ref, pull.source_branch]
          .filter((value) => typeof value === 'string')
          .join('\n'),
      );
  } else {
    const previous = await findPreviousSuccessfulDeployment(
      read,
      delivery,
      isGitHub,
    );
    if (previous === null) {
      const commits = await read<ApiRow[]>(
        isGitHub
          ? `/commits?sha=${sha}&per_page=${INITIAL_COMMIT_LIMIT}`
          : `/repository/commits?ref_name=${sha}&per_page=${INITIAL_COMMIT_LIMIT}`,
      );
      for (const commit of commits)
        texts.push(
          String(
            isGitHub
              ? (record(commit.commit).message ?? '')
              : (commit.message ?? ''),
          ),
        );
    } else if (previous !== delivery.commitSha) {
      if (isGitHub) {
        for (let page = 1; page <= MAX_COMPARISON_COMMITS / 100; page++) {
          const comparison = await read<{
            commits: ApiRow[];
            total_commits: number;
            status?: string;
          }>(
            `/compare/${encodeURIComponent(previous)}...${sha}?per_page=100&page=${page}`,
          );
          if (
            comparison.status === 'diverged' ||
            comparison.status === 'behind'
          ) {
            // A rollback has no forward delta; associate the actual deployed snapshot.
            const commits = await read<ApiRow[]>(
              `/commits?sha=${sha}&per_page=${INITIAL_COMMIT_LIMIT}`,
            );
            for (const commit of commits)
              texts.push(String(record(commit.commit).message ?? ''));
            break;
          }
          if (comparison.total_commits > MAX_COMPARISON_COMMITS)
            throw new Error(
              'Deployment commit comparison exceeds 1000 commits.',
            );
          for (const commit of comparison.commits)
            texts.push(String(record(commit.commit).message ?? ''));
          if (page * 100 >= comparison.total_commits) break;
        }
      } else {
        const comparison = await read<{
          commits: ApiRow[];
          compare_timeout?: boolean;
        }>(
          `/repository/compare?from=${encodeURIComponent(previous)}&to=${sha}&straight=true`,
        );
        if (comparison.compare_timeout === true)
          throw new Error('Deployment commit comparison timed out.');
        for (const commit of comparison.commits)
          texts.push(String(commit.message ?? ''));
      }
    } else {
      // A rollback/redeploy still belongs to the issues in its deployed commit.
      const commit = await read<ApiRow>(
        isGitHub ? `/commits/${sha}` : `/repository/commits/${sha}`,
      );
      texts.push(
        String(
          isGitHub
            ? (record(commit.commit).message ?? '')
            : (commit.message ?? ''),
        ),
      );
    }
  }
  return { ...delivery, text: texts.join('\n') };
};

const findPreviousSuccessfulDeployment = async (
  read: <TData>(path: string) => Promise<TData>,
  delivery: DevelopmentDelivery,
  isGitHub: boolean,
): Promise<string | null> => {
  const environment = encodeURIComponent(delivery.environmentName ?? '');
  const previous = await read<ApiRow[]>(
    isGitHub
      ? `/deployments?environment=${environment}&per_page=${RECENT_DELIVERY_LIMIT}`
      : `/deployments?environment=${environment}&status=success&order_by=finished_at&sort=desc&per_page=${RECENT_DELIVERY_LIMIT}`,
  );
  const cutoff = Date.parse(delivery.startedAt ?? delivery.occurredAt);
  let latestSuccessAt = -Infinity;
  let previousSha: string | null = null;
  for (const deployment of previous) {
    if (String(deployment.id) === delivery.externalId) continue;
    let successTimes: number[];
    if (isGitHub) {
      const states = await read<ApiRow[]>(
        `/deployments/${deployment.id}/statuses?per_page=100`,
      );
      successTimes = states
        .filter((state) => state.state === 'success')
        .map((state) =>
          Date.parse(String(state.created_at ?? state.updated_at)),
        );
    } else {
      successTimes = [
        Date.parse(
          String(
            record(deployment.deployable).finished_at ?? deployment.updated_at,
          ),
        ),
      ];
    }
    const sha = text(deployment.sha);
    for (const succeededAt of successTimes) {
      if (
        sha !== null &&
        succeededAt < cutoff &&
        succeededAt > latestSuccessAt
      ) {
        latestSuccessAt = succeededAt;
        previousSha = sha;
      }
    }
  }
  return previousSha;
};
