import { RestApiClient } from 'twenty-client-sdk/rest';

type RouteResult = { success?: boolean; error?: string } & Record<
  string,
  unknown
>;

// App routes answer 200 with `success: false` for business errors, so both the
// transport error and that flag are turned into one thrown message.
export const postAppRoute = async <TResult extends RouteResult>(
  routePath: string,
  body: Record<string, unknown>,
): Promise<TResult> => {
  const result = (await new RestApiClient().post(
    `/s${routePath}`,
    body,
  )) as TResult;

  if (result?.success !== true) {
    throw new Error(result?.error ?? 'The request failed.');
  }

  return result;
};
