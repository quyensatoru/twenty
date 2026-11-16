import { type ApiClient } from '../../types/api-client';
import { listAllRecords } from './list-all-records.util';

// Product names come from Task Manager's app records, the same names merchant
// rows, Crisp conversations and discounts use.
export const listAppNames = async (client: ApiClient): Promise<string[]> => {
  const apps = await listAllRecords<{ id: string; name: string | null }>({
    client,
    pluralName: 'apps',
    selection: { id: true, name: true },
    orderBy: [{ name: 'AscNullsLast' }],
  });

  return apps
    .map((app) => app.name ?? '')
    .filter((name) => name.length > 0);
};
