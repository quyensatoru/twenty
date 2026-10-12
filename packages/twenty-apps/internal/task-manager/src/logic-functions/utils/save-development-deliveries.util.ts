import { type ApiClient } from '../../types/api-client';
import { type DevelopmentDelivery } from '../../types/development-delivery';
import { extractIssueKeys } from '../../utils/extract-issue-keys.util';
import {
  chunkItems,
  resolveIssueTargetsByKey,
} from './resolve-issue-targets-by-key.util';
import { getDevelopmentRecordId } from './upsert-development-links.util';

const DELIVERY_WRITE_BATCH_SIZE = 100;

const readDeliveryIssueKeys = (delivery: DevelopmentDelivery): string[] => [
  ...new Set([
    ...extractIssueKeys(delivery.text),
    ...extractIssueKeys(delivery.branchName),
    ...extractIssueKeys(delivery.title),
  ]),
];

// Each event id is immutable, so its stable primary key plus `upsert` makes a
// redelivered or concurrently retried event rewrite identical data instead of
// failing, and the whole batch costs a handful of requests.
export const saveDevelopmentDeliveries = async ({
  client,
  repositoryId,
  deliveries,
}: {
  client: ApiClient;
  repositoryId: string;
  deliveries: DevelopmentDelivery[];
}): Promise<number> => {
  const keysByDelivery = deliveries.map((delivery) => ({
    delivery,
    issueKeys: readDeliveryIssueKeys(delivery),
  }));
  const allIssueKeys = keysByDelivery.flatMap(({ issueKeys }) => issueKeys);

  if (allIssueKeys.length === 0) {
    return 0;
  }

  const targets = await resolveIssueTargetsByKey({
    client,
    issueKeys: allIssueKeys,
  });

  const rowsById = new Map<string, Record<string, unknown>>();

  for (const { delivery, issueKeys } of keysByDelivery) {
    for (const issueKey of issueKeys) {
      const target = targets.get(issueKey);

      if (target === undefined) {
        continue;
      }

      const id = getDevelopmentRecordId([
        'delivery',
        repositoryId,
        target.issueId,
        delivery.deliveryType,
        delivery.externalId,
        delivery.eventId,
      ]);

      rowsById.set(id, {
        id,
        deliveryType: delivery.deliveryType,
        externalId: delivery.externalId,
        eventId: delivery.eventId,
        title: delivery.title,
        status: delivery.status,
        commitSha: delivery.commitSha,
        branchName: delivery.branchName,
        pipelineId: delivery.pipelineId,
        environmentName: delivery.environmentName,
        environmentType: delivery.environmentType,
        occurredAt: delivery.occurredAt,
        startedAt: delivery.startedAt,
        url: delivery.url,
        repositoryId,
        issueId: target.issueId,
        appId: target.appId,
      });
    }
  }

  const rows = [...rowsById.values()];

  for (const batch of chunkItems(rows, DELIVERY_WRITE_BATCH_SIZE)) {
    await client.mutation({
      createDevelopmentDeliveries: {
        __args: { data: batch, upsert: true },
        id: true,
      },
    });
  }

  return rows.length;
};
