import { RestApiClient } from 'twenty-client-sdk/rest';

type RestQuery = Record<string, string | number | boolean | null | undefined>;

const client = new RestApiClient();

const readData = (response: unknown): Record<string, unknown> => {
  const data = (response as { data?: Record<string, unknown> } | null)?.data;

  return data ?? {};
};

// Reads and writes go through the member's own REST access, so the workspace's
// object permissions apply as they do everywhere else in the CRM.
export const listRecords = async <TRow>(namePlural: string, query: RestQuery = {}): Promise<TRow[]> => {
  const response = await client.request('GET', `/rest/${namePlural}`, { query: { limit: 200, depth: 0, ...query } });
  const rows = readData(response)[namePlural];

  return Array.isArray(rows) ? (rows as TRow[]) : [];
};

const readSingle = <TRow>(response: unknown): TRow => {
  const value = Object.values(readData(response))[0];

  if (value === undefined || value === null) {
    throw new Error('Không nhận được dữ liệu từ máy chủ.');
  }

  return value as TRow;
};

export const createRecord = async <TRow>(namePlural: string, body: Record<string, unknown>): Promise<TRow> =>
  readSingle<TRow>(await client.request('POST', `/rest/${namePlural}`, { body }));

export const updateRecord = async <TRow>(namePlural: string, id: string, body: Record<string, unknown>): Promise<TRow> =>
  readSingle<TRow>(await client.request('PATCH', `/rest/${namePlural}/${id}`, { body }));

export const deleteRecord = async (namePlural: string, id: string): Promise<void> => {
  await client.request('DELETE', `/rest/${namePlural}/${id}`);
};

export const resolveAppRouteUrl = (routePath: string, query: RestQuery): string =>
  client.resolveUrl(`/s${routePath}`, { query });

// App routes answer 200 with `success: false` for business errors, so both the
// transport error and that flag are turned into one thrown message.
export const postAppRoute = async <TResult extends { success?: boolean; error?: string }>(
  routePath: string,
  body: Record<string, unknown>,
): Promise<TResult> => {
  const result = (await client.request('POST', `/s${routePath}`, { body })) as TResult;

  if (result?.success !== true) {
    throw new Error(result?.error ?? 'The request failed.');
  }

  return result;
};

export const readErrorText = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
