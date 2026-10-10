import { type ApiClient } from '../../types/api-client';
import { type DevelopmentDelivery } from '../../types/development-delivery';
import { extractIssueKeys } from '../../utils/extract-issue-keys.util';
import { resolveEffectiveAppId } from '../app-scope/resolve-effective-app-id.util';
import { listScopedRecords } from './list-scoped-records.util';
import { getDevelopmentRecordId } from './upsert-development-links.util';

export const saveDevelopmentDeliveries = async ({
  client,
  repositoryId,
  deliveries,
}: {
  client: ApiClient;
  repositoryId: string;
  deliveries: DevelopmentDelivery[];
}): Promise<number> => {
  let saved = 0;
  for (const delivery of deliveries) {
    const keys = [
      ...new Set([
        ...extractIssueKeys(delivery.text),
        ...extractIssueKeys(delivery.branchName),
        ...extractIssueKeys(delivery.title),
      ]),
    ];
    for (const issueKey of keys) {
      const issues = await listScopedRecords<{ id: string }>({
        client,
        pluralName: 'issues',
        filter: { issueKey: { eq: issueKey } },
        selection: { id: true },
        maxRecords: 1,
      });
      const issueId = issues[0]?.id;
      if (issueId === undefined) continue;
      const id = getDevelopmentRecordId([
        'delivery',
        repositoryId,
        issueId,
        delivery.deliveryType,
        delivery.externalId,
        delivery.eventId,
      ]);
      const data = {
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
      };
      try {
        await client.mutation({
          createDevelopmentDelivery: {
            __args: {
              data: {
                ...data,
                id,
                repositoryId,
                issueId,
                appId: await resolveEffectiveAppId({
                  client,
                  objectNameSingular: 'developmentDelivery',
                  immediateForeignKeyValue: issueId,
                }),
              },
            },
            id: true,
          },
        });
      } catch (error) {
        // Only an existing immutable event makes a failed insert a successful retry.
        const existing = await listScopedRecords<{ id: string }>({
          client,
          pluralName: 'developmentDeliveries',
          filter: { id: { eq: id } },
          selection: { id: true },
          maxRecords: 1,
        });
        if (existing.length === 0) throw error;
      }
      saved++;
    }
  }
  return saved;
};
