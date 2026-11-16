import { type ApiClient } from '../../types/api-client';
import { type BcTaskRecord, type VipClientRecord } from '../../types/bc-records';
import { type BcScope } from '../../types/bc-scope';
import { type TaskClientSummary } from '../../types/tasks';
import { listAllRecords } from './list-all-records.util';

// Tasks are personal: a BC sees their own, a manager their team's plus the
// ones nobody owns yet (automatic tasks of unassigned clients), an admin all.
export const buildTaskScopeFilter = (
  scope: BcScope,
): Record<string, unknown> | null => {
  if (scope.visibleMemberIds === null) {
    return null;
  }

  const filters: Record<string, unknown>[] = [];

  if (scope.visibleMemberIds.length > 0) {
    filters.push({ ownerId: { in: scope.visibleMemberIds } });
  }

  if (scope.canSeeUnassigned) {
    filters.push({ ownerId: { is: 'NULL' } });
  }

  if (filters.length === 0) {
    return { id: { is: 'NULL' } };
  }

  return filters.length === 1 ? filters[0] : { or: filters };
};

export const canSeeTask = (
  scope: BcScope,
  task: Pick<BcTaskRecord, 'ownerId'>,
): boolean => {
  if (scope.visibleMemberIds === null) {
    return true;
  }

  return task.ownerId === null
    ? scope.canSeeUnassigned
    : scope.visibleMemberIds.includes(task.ownerId);
};

// Managers only look at their team's tasks; editing stays with the owner.
export const canEditTask = (
  scope: BcScope,
  task: Pick<BcTaskRecord, 'ownerId'>,
): boolean =>
  scope.role === 'ADMIN' ||
  (scope.workspaceMemberId !== null && task.ownerId === scope.workspaceMemberId);

const chunk = <TItem>(items: TItem[], size: number): TItem[][] => {
  const chunks: TItem[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};

export const loadClientSummaries = async (
  client: ApiClient,
  vipClientIds: string[],
): Promise<Map<string, TaskClientSummary>> => {
  const uniqueIds = [...new Set(vipClientIds)];
  const results = await Promise.all(
    chunk(uniqueIds, 200).map((ids) =>
      listAllRecords<Pick<VipClientRecord, 'id' | 'name' | 'shopDomain'>>({
        client,
        pluralName: 'vipClients',
        filter: { id: { in: ids } },
        selection: { id: true, name: true, shopDomain: true },
      }),
    ),
  );

  return new Map(
    results
      .flat()
      .map((vipClient) => [
        vipClient.id,
        { id: vipClient.id, name: vipClient.name, shopDomain: vipClient.shopDomain },
      ]),
  );
};
