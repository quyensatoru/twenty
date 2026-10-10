import { describe, expect, it } from 'vitest';
import { parseDevelopmentDeliveries } from '../parse-development-deliveries.util';
import {
  getLatestDevelopmentDeliveries,
  summarizeDevelopmentDeliveries,
} from '../summarize-development-deliveries.util';

const repository = { id: 'repository-1', full_name: 'acme/repo' };
describe('delivery events', () => {
  it('normalizes GitHub workflow status and rerun identity', () => {
    const events = parseDevelopmentDeliveries({
      provider: 'github',
      eventName: 'workflow_run',
      payload: {
        repository,
        workflow_run: {
          id: 9,
          run_attempt: 2,
          workflow_id: 5,
          name: 'CI',
          status: 'completed',
          conclusion: 'failure',
          head_sha: 'abc',
          head_branch: 'PROJ-1-change',
          updated_at: '2026-10-10T01:00:00Z',
          html_url: 'https://github.com/acme/repo/actions/runs/9',
        },
      },
    });
    expect(events[0]).toMatchObject({
      deliveryType: 'BUILD',
      externalId: '9:2',
      status: 'FAILED',
      commitSha: 'abc',
      branchName: 'PROJ-1-change',
      pipelineId: '5',
    });
  });
  it('keeps deployment environment separate from pipeline status', () => {
    const events = parseDevelopmentDeliveries({
      provider: 'github',
      eventName: 'deployment_status',
      payload: {
        repository,
        deployment: {
          id: 8,
          sha: 'abc',
          ref: 'main',
          environment: 'production',
          production_environment: true,
          created_at: '2026-10-10T00:00:00Z',
        },
        deployment_status: {
          id: 11,
          state: 'success',
          environment: 'production',
          updated_at: '2026-10-10T01:00:00Z',
          log_url: 'https://ci.example/log',
        },
      },
    });
    expect(events[0]).toMatchObject({
      deliveryType: 'DEPLOYMENT',
      externalId: '8',
      status: 'SUCCESSFUL',
      environmentName: 'production',
      environmentType: 'PRODUCTION',
      url: 'https://ci.example/log',
    });
  });
  it('normalizes GitLab pipeline and deployment events', () => {
    const pipeline = parseDevelopmentDeliveries({
      provider: 'gitlab',
      eventName: null,
      payload: {
        object_kind: 'pipeline',
        project: { web_url: 'https://gitlab.com/acme/repo' },
        object_attributes: {
          id: 10,
          status: 'running',
          ref: 'PROJ-2',
          sha: 'def',
          created_at: '2026-10-10T00:00:00Z',
        },
        commit: { message: 'PROJ-2 fix' },
      },
    });
    expect(pipeline[0]).toMatchObject({
      status: 'IN_PROGRESS',
      externalId: '10',
      deliveryType: 'BUILD',
    });
    const deployment = parseDevelopmentDeliveries({
      provider: 'gitlab',
      eventName: null,
      payload: {
        object_kind: 'deployment',
        deployment_id: 12,
        status: 'failed',
        environment: 'staging',
        short_sha: 'def1234',
        status_changed_at: '2026-10-10T01:00:00Z',
        project: { web_url: 'https://gitlab.com/acme/repo' },
        deployable_url: 'https://gitlab.com/acme/repo/-/jobs/1',
      },
    });
    expect(deployment[0]).toMatchObject({
      deliveryType: 'DEPLOYMENT',
      externalId: '12',
      environmentName: 'staging',
      status: 'FAILED',
    });
  });
  it('ignores malformed deliveries without a stable identity or provider time', () => {
    expect(
      parseDevelopmentDeliveries({
        provider: 'github',
        eventName: 'deployment_status',
        payload: { deployment: {}, deployment_status: {} },
      }),
    ).toEqual([]);
  });
  it('uses provider event time when old events arrive after a successful deployment', () => {
    const parsed = parseDevelopmentDeliveries({
      provider: 'github',
      eventName: 'deployment_status',
      payload: {
        deployment: { id: 8, environment: 'staging' },
        deployment_status: {
          id: 11,
          state: 'success',
          updated_at: '2026-10-10T02:00:00Z',
        },
      },
    });
    const latest = { ...parsed[0], id: 'latest', repositoryId: 'repo-1' };
    const stale = {
      ...latest,
      id: 'stale',
      status: 'IN_PROGRESS',
      occurredAt: '2026-10-10T01:00:00.000Z',
    };
    expect(getLatestDevelopmentDeliveries([latest, stale])).toEqual([latest]);
    expect(
      summarizeDevelopmentDeliveries([latest, stale]).environments[0],
    ).toMatchObject({ status: 'SUCCESSFUL', environmentName: 'staging' });
  });
});
