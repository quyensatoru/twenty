import { type ApiClient } from '../../types/api-client';
import { type HealthIncidentDraft } from '../../types/health-incident-plan';
import { type HealthIncidentRecord } from '../../types/health-incident-record';
import { listAllRecords } from './list-all-records.util';

export const HEALTH_INCIDENT_SELECTION = {
  id: true,
  monitorId: true,
  title: true,
  dedupeKey: true,
  nodeKey: true,
  host: true,
  serviceName: true,
  metric: true,
  severity: true,
  peakSeverity: true,
  status: true,
  breachCount: true,
  lastValue: true,
  peakValue: true,
  threshold: true,
  firstBreachAt: true,
  openedAt: true,
  resolvedAt: true,
  lastNotifiedAt: true,
  notifyCount: true,
  acknowledgedByMemberId: true,
  acknowledgedAt: true,
};

export const ACTIVE_INCIDENT_STATUSES = ['PENDING', 'OPEN', 'ACKNOWLEDGED'];

export const toHealthIncidentRecord = (
  node: Record<string, unknown>,
): HealthIncidentRecord =>
  ({
    ...node,
    breachCount: typeof node.breachCount === 'number' ? node.breachCount : 0,
    notifyCount: typeof node.notifyCount === 'number' ? node.notifyCount : 0,
  }) as HealthIncidentRecord;

export const listHealthIncidents = async ({
  client,
  filter,
  orderBy,
  maxRecords,
}: {
  client: ApiClient;
  filter: Record<string, unknown>;
  orderBy?: unknown;
  maxRecords?: number;
}): Promise<HealthIncidentRecord[]> =>
  (
    await listAllRecords<Record<string, unknown>>({
      client,
      pluralName: 'healthIncidents',
      filter,
      selection: HEALTH_INCIDENT_SELECTION,
      orderBy,
      maxRecords,
    })
  ).map(toHealthIncidentRecord);

const toWriteData = (
  incident: HealthIncidentDraft,
): Record<string, unknown> => {
  const data: Record<string, unknown> = { ...incident };

  delete data.id;

  return data;
};

export const createHealthIncidents = async ({
  client,
  monitorId,
  incidents,
}: {
  client: ApiClient;
  monitorId: string;
  incidents: HealthIncidentDraft[];
}): Promise<void> => {
  if (incidents.length === 0) {
    return;
  }

  await client.mutation({
    createHealthIncidents: {
      __args: {
        data: incidents.map((incident) => ({
          ...toWriteData(incident),
          monitorId,
        })),
      },
      id: true,
    },
  });
};

export const updateHealthIncident = async ({
  client,
  incident,
}: {
  client: ApiClient;
  incident: HealthIncidentDraft & { id: string };
}): Promise<void> => {
  await client.mutation({
    updateHealthIncident: {
      __args: { id: incident.id, data: toWriteData(incident) },
      id: true,
    },
  });
};

export const destroyHealthIncidents = async ({
  client,
  ids,
}: {
  client: ApiClient;
  ids: string[];
}): Promise<void> => {
  if (ids.length === 0) {
    return;
  }

  await client.mutation({
    destroyHealthIncidents: {
      __args: { filter: { id: { in: ids } } },
      id: true,
    },
  });
};
