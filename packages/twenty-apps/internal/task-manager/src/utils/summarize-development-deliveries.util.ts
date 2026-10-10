import { type DevelopmentDeliveryRow } from '../types/development-delivery';

export const getLatestDevelopmentDeliveries = (
  events: DevelopmentDeliveryRow[],
): DevelopmentDeliveryRow[] => {
  const latest = new Map<string, DevelopmentDeliveryRow>();
  for (const event of events) {
    const key = JSON.stringify([
      event.repositoryId,
      event.deliveryType,
      event.externalId,
    ]);
    const previous = latest.get(key);
    if (
      previous === undefined ||
      Date.parse(event.occurredAt) > Date.parse(previous.occurredAt) ||
      (event.occurredAt === previous.occurredAt &&
        event.eventId.localeCompare(previous.eventId, undefined, {
          numeric: true,
        }) > 0)
    )
      latest.set(key, event);
  }
  return [...latest.values()].sort(
    (left, right) =>
      Date.parse(right.startedAt ?? right.occurredAt) -
      Date.parse(left.startedAt ?? left.occurredAt),
  );
};

export const summarizeDevelopmentDeliveries = (
  events: DevelopmentDeliveryRow[],
) => {
  const latest = getLatestDevelopmentDeliveries(events);
  const environments = new Map<string, DevelopmentDeliveryRow>();
  const builds = new Map<string, DevelopmentDeliveryRow>();
  for (const event of latest) {
    const collection = event.deliveryType === 'BUILD' ? builds : environments;
    const key = JSON.stringify([
      event.repositoryId,
      event.deliveryType === 'BUILD' ? event.pipelineId : event.environmentName,
    ]);
    if (!collection.has(key)) collection.set(key, event);
  }
  return {
    builds: [...builds.values()],
    environments: [...environments.values()],
  };
};
