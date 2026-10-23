import { defineLogicFunction } from 'twenty-sdk/define';

import { DISCOUNT_CONNECTIONS_ROUTE_PATH } from '../constants/discount';
import { DISCOUNT_CONNECTIONS_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type DiscountConnectionItem } from '../types/discount';
import { listDiscounts } from './utils/discount-store.util';
import { listAllRecords } from './utils/list-all-records.util';
import { readStoredDiscountConnection } from './utils/read-discount-settings.util';
import {
  assertCanConfigureDiscounts,
  resolveDiscountCaller,
} from './utils/resolve-discount-editor.util';
import { runRoute } from './utils/run-route.util';

// The secret itself never leaves the server: the page only learns whether
// one is set.
const handler = async () =>
  runRoute(async (client) => {
    assertCanConfigureDiscounts(await resolveDiscountCaller());

    const [apps, discounts] = await Promise.all([
      listAllRecords<{ id: string; name?: string | null }>({
        client,
        pluralName: 'apps',
        selection: { id: true, name: true },
      }),
      listDiscounts(client),
    ]);

    const connections: DiscountConnectionItem[] = await Promise.all(
      apps
        .filter((app) => typeof app.name === 'string' && app.name.length > 0)
        .sort((left, right) =>
          (left.name as string).localeCompare(right.name as string),
        )
        .map(async (app) => {
          const stored = await readStoredDiscountConnection(app.id);

          return {
            appId: app.id,
            appName: app.name as string,
            endpoint: stored?.endpoint ?? '',
            hasSecret: (stored?.secret ?? '').length > 0,
            updatedAt: stored?.updatedAt ?? null,
            updatedBy: stored?.updatedBy ?? null,
            discountCount: discounts.filter(
              (discount) => discount.appId === app.id,
            ).length,
          };
        }),
    );

    return { connections };
  });

export default defineLogicFunction({
  universalIdentifier: DISCOUNT_CONNECTIONS_LOGIC_FUNCTION_UID,
  name: 'discount-connections',
  description:
    'Route (Admin role): every Task Manager app with the endpoint its discounts are sent to and whether a signing secret is set.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: DISCOUNT_CONNECTIONS_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
