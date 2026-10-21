import { type ApiClient } from '../../types/api-client';
import { listAllRecords } from './list-all-records.util';

export type AppSummary = { id: string; name: string };

export const listApps = async (
  client: ApiClient,
  filter?: Record<string, unknown>,
): Promise<AppSummary[]> =>
  (
    await listAllRecords<{ id: string; name?: string | null }>({
      client,
      pluralName: 'apps',
      filter,
      selection: { id: true, name: true },
    })
  )
    .map((app) => ({ id: app.id, name: app.name?.trim() || 'App' }))
    .sort((left, right) => left.name.localeCompare(right.name));
