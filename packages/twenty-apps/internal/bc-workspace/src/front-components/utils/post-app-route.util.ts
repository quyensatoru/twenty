import { RestApiClient } from 'twenty-client-sdk/rest';
import { t } from 'twenty-sdk/front-component';

type RouteResult = { success?: boolean; error?: string } & Record<
  string,
  unknown
>;

// Routes answer 200 with `success: false` and an English message for business
// errors; both that and a transport error become one translated message.
export const postAppRoute = async <TResult extends Record<string, unknown>>(
  routePath: string,
  body: Record<string, unknown>,
): Promise<TResult> => {
  const result = (await new RestApiClient().post(
    `/s${routePath}`,
    body,
  )) as RouteResult;

  if (result?.success !== true) {
    throw new Error(
      typeof result?.error === 'string'
        ? t(result.error)
        : t('The request failed.'),
    );
  }

  return result as unknown as TResult;
};

export const readErrorText = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
