import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { DISCOUNT_CONSOLE_SAVE_ROUTE_PATH } from '../constants/discount';
import { DISCOUNT_CONSOLE_SAVE_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type ApiClient } from '../types/api-client';
import {
  buildDiscountName,
  type DiscountDraft,
  normalizeDiscountCode,
  resolveAssignedDomains,
  validateDiscountDraft,
} from '../utils/discount-rules.util';
import {
  listDiscounts,
  readDiscount,
  toDiscountListItem,
  updateDiscount,
} from './utils/discount-store.util';
import { listAllRecords } from './utils/list-all-records.util';
import {
  assertCanEditDiscounts,
  resolveDiscountCaller,
} from './utils/resolve-discount-editor.util';
import { runRoute } from './utils/run-route.util';

type SaveBody = {
  discountId?: string | null;
  draft?: DiscountDraft;
  isDraft?: boolean;
};

const RULE_MESSAGES: Record<string, string> = {
  required: 'is required',
  not_positive: 'must be above 0',
  over_hundred_percent: 'cannot be above 100%',
  not_whole: 'must be a whole number',
  end_before_start: 'must not be before the start date',
  code_format: 'may only use A-Z, 0-9, _ and -, 3 to 40 characters',
  domain_format: 'must be shop domains like shop.myshopify.com',
  too_many_domains: 'can list at most 20 shops',
};

const readMerchantDomain = async (
  client: ApiClient,
  merchantId: string | null,
): Promise<string | null> => {
  if (merchantId === null) {
    return null;
  }

  const [merchant] = await listAllRecords<{ name?: string | null }>({
    client,
    pluralName: 'merchants',
    filter: { id: { eq: merchantId } },
    selection: { id: true, name: true },
    maxRecords: 1,
  });

  if (merchant === undefined) {
    throw new Error('The chosen merchant no longer exists.');
  }

  return merchant.name ?? null;
};

const handler = async (event: RoutePayload<SaveBody>) =>
  runRoute(async (client) => {
    assertCanEditDiscounts(await resolveDiscountCaller());

    const input = event.body?.draft;

    if (input === undefined || input === null) {
      throw new Error('Missing discount.');
    }

    const isDraft = event.body?.isDraft === true;
    const discountId = event.body?.discountId ?? null;
    const merchantDomain =
      input.scope === 'SINGLE'
        ? await readMerchantDomain(client, input.merchantId)
        : null;
    const draft: DiscountDraft = {
      ...input,
      merchantId: input.scope === 'SINGLE' ? input.merchantId : null,
      merchantDomain,
      discountCode: normalizeDiscountCode(input.discountCode ?? ''),
    };

    if (!isDraft) {
      const [firstError] = validateDiscountDraft(draft);

      if (firstError !== undefined) {
        throw new Error(
          `${firstError.field} ${RULE_MESSAGES[firstError.code] ?? firstError.code}.`,
        );
      }
    }

    if (draft.discountCode.length > 0 && draft.appId !== null) {
      const sameCode = await listDiscounts(client, {
        appId: { eq: draft.appId },
        discountCode: { ilike: draft.discountCode },
      });

      if (sameCode.some((record) => record.id !== discountId)) {
        throw new Error(
          `${draft.appName ?? 'This app'} already has a discount with code ${draft.discountCode}.`,
        );
      }
    }

    const assignedDomains = resolveAssignedDomains(draft);
    const data = {
      name: buildDiscountName({
        discountCode: draft.discountCode,
        scope: draft.scope,
        merchantDomain,
        assignedDomains,
      }),
      discountCode: draft.discountCode,
      discountType: draft.discountType,
      discountValue: draft.discountValue,
      limitInIntervals: draft.limitInIntervals,
      limitUsage: draft.limitUsage,
      startDate: draft.startDate,
      endDate: draft.endDate,
      status: draft.status,
      scope: draft.scope,
      reason: draft.reason.trim(),
      assignedDomains,
      appId: draft.appId,
      merchantId: draft.merchantId,
      // PENDING is what the delivery trigger waits for, so saving is sending.
      syncStatus: isDraft ? 'DRAFT' : 'PENDING',
      syncError: null,
      syncAttempts: 0,
      nextSyncAt: null,
    };

    let savedId = discountId;

    if (discountId === null) {
      const created = (await client.mutation({
        createDiscount: { __args: { data }, id: true },
      })) as { createDiscount?: { id?: string } };

      savedId = created.createDiscount?.id ?? null;
    } else {
      await updateDiscount(client, discountId, data);
    }

    const record = savedId === null ? null : await readDiscount(client, savedId);

    if (record === null) {
      throw new Error('The discount was saved but could not be read back.');
    }

    return { discount: toDiscountListItem(record) };
  });

export default defineLogicFunction({
  universalIdentifier: DISCOUNT_CONSOLE_SAVE_LOGIC_FUNCTION_UID,
  name: 'discount-console-save',
  description:
    'Route: checks and saves a discount from the Discounts page, which queues it for its app unless it is saved as a draft.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: DISCOUNT_CONSOLE_SAVE_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
