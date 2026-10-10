import { isNonEmptyString, isObject } from '@sniptt/guards';

import { type DevelopmentDelivery } from '../types/development-delivery';

const record = (value: unknown): Record<string, unknown> =>
  isObject(value) && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const text = (value: unknown): string | null =>
  isNonEmptyString(value) ? value : null;
const identifier = (value: unknown): string | null =>
  typeof value === 'number' ? String(value) : text(value);
const time = (value: unknown): string | null => {
  const valueText = text(value);
  if (valueText === null) return null;
  const timestamp = Date.parse(valueText);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
};

const STATUS_BY_PROVIDER_STATE: Record<string, string> = {
  success: 'SUCCESSFUL',
  passed: 'SUCCESSFUL',
  failure: 'FAILED',
  failed: 'FAILED',
  error: 'FAILED',
  timed_out: 'FAILED',
  startup_failure: 'FAILED',
  running: 'IN_PROGRESS',
  in_progress: 'IN_PROGRESS',
  pending: 'PENDING',
  queued: 'PENDING',
  created: 'PENDING',
  waiting: 'PENDING',
  preparing: 'PENDING',
  blocked: 'BLOCKED',
  manual: 'BLOCKED',
  action_required: 'BLOCKED',
  canceled: 'CANCELLED',
  cancelled: 'CANCELLED',
  skipped: 'SKIPPED',
  neutral: 'SKIPPED',
  inactive: 'INACTIVE',
};
const status = (value: unknown): string =>
  STATUS_BY_PROVIDER_STATE[text(value) ?? ''] ?? 'UNKNOWN';
const environmentType = (name: string | null): string => {
  if (name === null) return 'OTHER';
  if (/^(prod|production)(?:$|[-/])/i.test(name)) return 'PRODUCTION';
  if (/^(stage|staging)(?:$|[-/])/i.test(name)) return 'STAGING';
  if (/^(test|testing|qa)(?:$|[-/])/i.test(name)) return 'TESTING';
  if (/^(dev|development|preview)(?:$|[-/])/i.test(name)) return 'DEVELOPMENT';
  return 'OTHER';
};

export const parseDevelopmentDeliveries = ({
  provider,
  eventName,
  payload,
}: {
  provider: 'github' | 'gitlab';
  eventName: string | null;
  payload: unknown;
}): DevelopmentDelivery[] => {
  const body = record(payload);
  let delivery: Partial<DevelopmentDelivery> = {};
  if (provider === 'github' && eventName === 'workflow_run') {
    const run = record(body.workflow_run);
    const headCommit = record(run.head_commit);
    const runId = identifier(run.id);
    delivery = {
      deliveryType: 'BUILD',
      externalId:
        runId === null
          ? undefined
          : `${runId}:${identifier(run.run_attempt) ?? '1'}`,
      title: text(run.name) ?? 'CI',
      pipelineId: identifier(run.workflow_id),
      status: status(run.conclusion ?? run.status),
      commitSha: text(run.head_sha),
      branchName: text(run.head_branch),
      occurredAt: time(run.updated_at) ?? undefined,
      startedAt: time(run.run_started_at ?? run.created_at),
      url: text(run.html_url),
      text: text(headCommit.message),
    };
  } else if (provider === 'github' && eventName === 'deployment_status') {
    const deployment = record(body.deployment);
    const state = record(body.deployment_status);
    const environmentName =
      text(state.environment) ?? text(deployment.environment);
    delivery = {
      deliveryType: 'DEPLOYMENT',
      externalId: identifier(deployment.id) ?? undefined,
      eventId: identifier(state.id) ?? undefined,
      title: text(deployment.description) ?? environmentName ?? 'Deployment',
      status: status(state.state),
      commitSha: text(deployment.sha),
      branchName: text(deployment.ref),
      environmentName,
      environmentType:
        deployment.production_environment === true
          ? 'PRODUCTION'
          : environmentType(environmentName),
      pipelineId:
        identifier(record(body.workflow_run).workflow_id) ??
        identifier(deployment.task),
      occurredAt: time(state.updated_at ?? state.created_at) ?? undefined,
      startedAt: time(deployment.created_at),
      url:
        text(state.log_url) ??
        text(state.target_url) ??
        text(state.environment_url),
      text: text(deployment.description),
    };
  } else if (provider === 'gitlab' && body.object_kind === 'pipeline') {
    const attributes = record(body.object_attributes);
    const project = record(body.project);
    const externalId = identifier(attributes.id);
    delivery = {
      deliveryType: 'BUILD',
      externalId: externalId ?? undefined,
      pipelineId: text(attributes.name) ?? text(attributes.ref) ?? 'pipeline',
      title: text(attributes.name) ?? 'Pipeline',
      status: status(attributes.status),
      commitSha: text(attributes.sha),
      branchName: text(attributes.ref),
      occurredAt:
        time(
          attributes.updated_at ??
            attributes.finished_at ??
            attributes.started_at ??
            attributes.created_at,
        ) ?? undefined,
      startedAt: time(attributes.started_at ?? attributes.created_at),
      url:
        text(attributes.url) ??
        (text(project.web_url) === null
          ? null
          : `${project.web_url}/-/pipelines/${externalId}`),
      text: text(record(body.commit).message),
    };
  } else if (provider === 'gitlab' && body.object_kind === 'deployment') {
    if (body.approval !== undefined) return [];
    const environmentName = text(body.environment);
    delivery = {
      deliveryType: 'DEPLOYMENT',
      externalId: identifier(body.deployment_id) ?? undefined,
      title: environmentName ?? 'Deployment',
      status: status(body.status),
      commitSha: text(body.sha) ?? text(body.short_sha),
      branchName: text(body.ref),
      environmentName,
      environmentType:
        text(body.environment_tier)?.toUpperCase() ??
        environmentType(environmentName),
      pipelineId: identifier(body.pipeline_id),
      occurredAt: time(body.status_changed_at) ?? undefined,
      startedAt: time(body.created_at),
      url: text(body.deployable_url) ?? text(body.environment_external_url),
      text: text(body.commit_title),
    };
  } else return [];
  if (delivery.externalId === undefined || delivery.occurredAt === undefined)
    return [];
  return [
    {
      deliveryType: delivery.deliveryType!,
      externalId: delivery.externalId,
      eventId: delivery.eventId ?? `${delivery.occurredAt}:${delivery.status}`,
      title: delivery.title!,
      status: delivery.status!,
      commitSha: delivery.commitSha ?? null,
      branchName: delivery.branchName ?? null,
      pipelineId: delivery.pipelineId ?? null,
      environmentName: delivery.environmentName ?? null,
      environmentType: delivery.environmentType ?? null,
      occurredAt: delivery.occurredAt,
      startedAt: delivery.startedAt ?? null,
      url: delivery.url ?? null,
      text: delivery.text ?? null,
    },
  ];
};
