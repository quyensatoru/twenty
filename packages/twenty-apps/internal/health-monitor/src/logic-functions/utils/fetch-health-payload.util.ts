import { readErrorMessage } from './read-error-message.util';

export type HealthFetchResult =
  | { ok: true; httpStatus: number; latencyMs: number; payload: unknown }
  | {
      ok: false;
      httpStatus: number | null;
      latencyMs: number | null;
      error: string;
    };

export const fetchHealthPayload = async ({
  endpointUrl,
  headerName,
  headerValue,
  timeoutSeconds,
}: {
  endpointUrl: string;
  headerName: string;
  headerValue: string;
  timeoutSeconds: number;
}): Promise<HealthFetchResult> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutSeconds * 1000);
  const startedAt = Date.now();

  try {
    const response = await fetch(endpointUrl, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        ...(headerValue.length > 0 ? { [headerName]: headerValue } : {}),
      },
      signal: controller.signal,
    });
    const latencyMs = Date.now() - startedAt;
    const body = await response.text();

    if (!response.ok) {
      return {
        ok: false,
        httpStatus: response.status,
        latencyMs,
        error: `HTTP ${response.status}`,
      };
    }

    try {
      return {
        ok: true,
        httpStatus: response.status,
        latencyMs,
        payload: JSON.parse(body),
      };
    } catch {
      return {
        ok: false,
        httpStatus: response.status,
        latencyMs,
        error: 'The response is not JSON',
      };
    }
  } catch (error) {
    return {
      ok: false,
      httpStatus: null,
      latencyMs: null,
      error: controller.signal.aborted
        ? `No response within ${timeoutSeconds} seconds`
        : readErrorMessage(error),
    };
  } finally {
    clearTimeout(timer);
  }
};
