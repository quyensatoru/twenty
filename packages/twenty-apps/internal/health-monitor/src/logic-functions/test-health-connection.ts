import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  DEFAULT_HEADER_NAME,
  TIMEOUT_SECOND_OPTIONS,
} from '../constants/health-options';
import { TEST_HEALTH_CONNECTION_ROUTE_PATH } from '../constants/route-paths';
import { HEALTH_TEST_CONNECTION_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { flattenHealthPayload } from '../utils/flatten-health-payload.util';
import { fetchHealthPayload } from './utils/fetch-health-payload.util';
import { listHealthMonitors } from './utils/health-monitor-store.util';
import { assertCanConfigureMonitors } from './utils/resolve-caller-scope.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type TestBody = {
  appId?: string;
  endpointUrl?: string;
  headerName?: string;
  headerValue?: string | null;
  timeoutSeconds?: number;
};

// Tests the values still in the drawer, before they are saved. Without a new
// header value it falls back to the one stored for the app.
const handler = async (event: RoutePayload<TestBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const appId = requireString(event.body?.appId, 'appId');

    assertCanConfigureMonitors(scope);

    const endpointUrl = requireString(event.body?.endpointUrl, 'endpoint');

    if (!/^https?:\/\/\S+$/i.test(endpointUrl)) {
      throw new Error('The endpoint must be a valid http(s) URL.');
    }

    const typedValue =
      typeof event.body?.headerValue === 'string'
        ? event.body.headerValue.trim()
        : '';
    const [stored] =
      typedValue.length > 0
        ? []
        : await listHealthMonitors({
            client,
            filter: { appId: { eq: appId } },
          });
    const timeout =
      TIMEOUT_SECOND_OPTIONS.find(
        (option) => option === event.body?.timeoutSeconds,
      ) ?? 10;
    const result = await fetchHealthPayload({
      endpointUrl,
      headerName: event.body?.headerName?.trim() || DEFAULT_HEADER_NAME,
      headerValue:
        typedValue.length > 0 ? typedValue : (stored?.headerValue ?? ''),
      timeoutSeconds: timeout,
    });

    if (!result.ok) {
      return {
        ok: false,
        httpStatus: result.httpStatus,
        latencyMs: result.latencyMs,
        nodeCount: 0,
        processCount: 0,
        nodeKeys: [],
        error: result.error,
      };
    }

    const nodes = flattenHealthPayload(result.payload);

    return {
      ok: nodes.length > 0,
      httpStatus: result.httpStatus,
      latencyMs: result.latencyMs,
      nodeCount: nodes.length,
      processCount: nodes.reduce((sum, node) => sum + node.processes.length, 0),
      nodeKeys: nodes.map((node) => node.key),
      error:
        nodes.length > 0
          ? null
          : 'The endpoint answered without any node. Check the header secret.',
    };
  });

export default defineLogicFunction({
  universalIdentifier: HEALTH_TEST_CONNECTION_LOGIC_FUNCTION_UID,
  name: 'test-health-connection',
  description:
    'Route: calls a health endpoint with unsaved settings and reports what it found.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: TEST_HEALTH_CONNECTION_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
