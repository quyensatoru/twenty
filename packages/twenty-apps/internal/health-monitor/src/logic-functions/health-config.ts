import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { DEFAULT_HEALTH_RULES } from '../constants/default-health-rules';
import {
  DEFAULT_HEADER_NAME,
  DEFAULT_MONITOR_POLICY,
} from '../constants/health-options';
import { HEALTH_CONFIG_ROUTE_PATH } from '../constants/route-paths';
import { HEALTH_CONFIG_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type HealthMonitorConfig } from '../types/health-monitor-config';
import { type HealthMonitorRecord } from '../types/health-monitor-record';
import { listHealthMonitors } from './utils/health-monitor-store.util';
import { listAllRecords } from './utils/list-all-records.util';
import { listApps } from './utils/list-apps.util';
import { listWorkspaceMembers } from './utils/list-member-emails.util';
import { assertCanConfigureMonitors } from './utils/resolve-caller-scope.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type ConfigBody = { appId?: string };

const toConfig = (
  monitor: HealthMonitorRecord | undefined,
): HealthMonitorConfig =>
  monitor === undefined
    ? {
        ...DEFAULT_MONITOR_POLICY,
        isEnabled: false,
        endpointUrl: '',
        headerName: DEFAULT_HEADER_NAME,
        headerValue: null,
        hasHeaderValue: false,
        recipients: [],
        extraEmails: [],
        rules: DEFAULT_HEALTH_RULES,
        mutedNodeKeys: [],
        nodeLabels: {},
      }
    : {
        isEnabled: monitor.isEnabled,
        endpointUrl: monitor.endpointUrl,
        headerName: monitor.headerName,
        headerValue: null,
        hasHeaderValue: monitor.headerValue.length > 0,
        intervalMinutes: monitor.intervalMinutes,
        timeoutSeconds: monitor.timeoutSeconds,
        openAfterBreaches: monitor.openAfterBreaches,
        renotifyMinutes: monitor.renotifyMinutes,
        unreachableAfterFailures: monitor.unreachableAfterFailures,
        sendRecovery: monitor.sendRecovery,
        criticalOnlyOffHours: monitor.criticalOnlyOffHours,
        snapshotRetentionHours: monitor.snapshotRetentionHours,
        recipients: monitor.recipients,
        extraEmails: monitor.extraEmails,
        rules: monitor.rules,
        mutedNodeKeys: monitor.mutedNodeKeys,
        nodeLabels: monitor.nodeLabels,
      };

const handler = async (event: RoutePayload<ConfigBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const appId = requireString(event.body?.appId, 'appId');

    assertCanConfigureMonitors(scope);

    const [[app], [monitor], members, grants] = await Promise.all([
      listApps(client, { id: { eq: appId } }),
      listHealthMonitors({ client, filter: { appId: { eq: appId } } }),
      listWorkspaceMembers(client),
      listAllRecords<{ memberId?: string | null }>({
        client,
        pluralName: 'appAccesses',
        filter: { appId: { eq: appId } },
        selection: { id: true, memberId: true },
      }),
    ]);

    if (app === undefined) {
      throw new Error('App not found.');
    }

    const accessMemberIds = new Set(grants.map((grant) => grant.memberId));
    const nodes = monitor?.lastSnapshot?.nodes ?? [];

    return {
      appId,
      appName: app.name,
      monitorId: monitor?.id ?? null,
      config: toConfig(monitor),
      members: members
        .map((member) => ({
          ...member,
          hasAppAccess: accessMemberIds.has(member.id),
        }))
        .sort(
          (left, right) =>
            Number(right.hasAppAccess) - Number(left.hasAppAccess) ||
            left.name.localeCompare(right.name),
        ),
      knownNodeKeys: nodes.map((node) => node.key),
      knownServiceNames: [
        ...new Set(
          nodes.flatMap((node) =>
            node.processes.map((process) => process.name),
          ),
        ),
      ].sort(),
    };
  });

export default defineLogicFunction({
  universalIdentifier: HEALTH_CONFIG_LOGIC_FUNCTION_UID,
  name: 'health-config',
  description:
    "Route: an app's monitor configuration (without the secret) and the members it can alert.",
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: HEALTH_CONFIG_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
