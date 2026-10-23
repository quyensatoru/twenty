import { defineLogicFunction } from 'twenty-sdk/define';

import { DISCOUNT_CONSOLE_LIST_ROUTE_PATH } from '../constants/discount';
import { DISCOUNT_CONSOLE_LIST_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type DiscountAppOption } from '../types/discount';
import { listDiscounts, toDiscountListItem } from './utils/discount-store.util';
import { listAllRecords } from './utils/list-all-records.util';
import { readDiscountAppConnection } from './utils/read-discount-settings.util';
import { resolveDiscountCaller } from './utils/resolve-discount-editor.util';
import { runRoute } from './utils/run-route.util';

const handler = async () =>
  runRoute(async (client) => {
    const [records, appRecords, caller] = await Promise.all([
      listDiscounts(client),
      listAllRecords<{ id: string; name?: string | null }>({
        client,
        pluralName: 'apps',
        selection: { id: true, name: true },
      }),
      resolveDiscountCaller(),
    ]);
    // Every app of Task Manager, so one added there shows up here at once,
    // as not connected until an admin gives it an endpoint.
    const apps: DiscountAppOption[] = await Promise.all(
      appRecords
        .filter((app) => typeof app.name === 'string' && app.name.length > 0)
        .sort((left, right) =>
          (left.name as string).localeCompare(right.name as string),
        )
        .map(async (app) => ({
          id: app.id,
          name: app.name as string,
          isConnected: (await readDiscountAppConnection(app.id)) !== null,
        })),
    );

    return {
      discounts: records.map(toDiscountListItem),
      apps,
      canEdit: caller.canEdit,
      canConfigure: caller.canConfigure,
    };
  });

export default defineLogicFunction({
  universalIdentifier: DISCOUNT_CONSOLE_LIST_LOGIC_FUNCTION_UID,
  name: 'discount-console-list',
  description:
    'Route: every discount with its app and merchant, the apps discounts can be sent to, and whether the caller may edit.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: DISCOUNT_CONSOLE_LIST_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
