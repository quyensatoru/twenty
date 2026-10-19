import { type ApiClient } from '../../types/api-client';
import { type CrispConversationPayload } from '../../types/crisp-api';
import { createAppClient } from './create-app-client.util';
import {
  CRISP_CONVERSATIONS_PER_PAGE,
  getCrispConversation,
  searchCrispConversations,
  updateCrispConversationData,
} from './crisp-api.util';
import { executeWithRetry } from './execute-with-retry.util';
import {
  extractContactEmails,
  extractShopDomains,
} from './extract-shop-domains.util';
import { matchMerchant, readAppId } from './match-merchant.util';
import {
  buildCrispPlanData,
  type CrispPlanData,
  hasCrispPlanData,
  type PlanDataMerchant,
} from './plan-data.util';
import {
  canWritePlanData,
  type CrispSettings,
  type CrispWebsite,
  findCrispWebsite,
  isCrispApiConfigured,
  listWebsiteAppNames,
  readCrispSettings,
} from './read-crisp-settings.util';
import { resolveConversationAppName } from './resolve-conversation-app-name.util';

// Everything here reads chats from Crisp itself. The CRM's support inbox only
// copies the chats it needs to link to issues, so it cannot say which chats a
// shop has.
type PlanDataMerchantRow = PlanDataMerchant & {
  id: string;
  name: string | null;
  appId: string | null;
};

type Connection<TNode> = {
  edges?: { node: TNode }[];
};

export type CrispChat = {
  website: CrispWebsite;
  conversation: CrispConversationPayload;
};

export type PlanDataChange = {
  websiteId: string;
  sessionId: string;
  planData: CrispPlanData;
};

const PLAN_DATA_MERCHANT_SELECTION = {
  id: true,
  name: true,
  appId: true,
  pricingPlan: true,
  planStartedAt: true,
  using: true,
} as const;

const readPlanDataMerchant = async (
  client: ApiClient,
  merchantId: string,
): Promise<PlanDataMerchantRow | undefined> => {
  const result = await executeWithRetry<{
    merchants?: Connection<PlanDataMerchantRow>;
  }>(() =>
    client.query({
      merchants: {
        __args: { first: 1, filter: { id: { eq: merchantId } } },
        edges: { node: PLAN_DATA_MERCHANT_SELECTION },
      },
    }),
  );

  return result?.merchants?.edges?.[0]?.node;
};

// One query per product for a whole page of chats, keyed by shop domain; the
// merchant name is the shop's myshopify domain.
const readPlanDataMerchantsByShopDomain = async (
  client: ApiClient,
  appId: string,
  shopDomains: string[],
): Promise<Map<string, PlanDataMerchantRow>> => {
  const merchantsByDomain = new Map<string, PlanDataMerchantRow>();
  const uniqueDomains = [...new Set(shopDomains)];

  if (uniqueDomains.length === 0) {
    return merchantsByDomain;
  }

  const result = await executeWithRetry<{
    merchants?: Connection<PlanDataMerchantRow>;
  }>(() =>
    client.query({
      merchants: {
        __args: {
          first: uniqueDomains.length,
          filter: {
            and: [{ appId: { eq: appId } }, { name: { in: uniqueDomains } }],
          },
        },
        edges: { node: PLAN_DATA_MERCHANT_SELECTION },
      },
    }),
  );

  for (const { node } of result?.merchants?.edges ?? []) {
    if (node.name !== null) {
      merchantsByDomain.set(node.name, node);
    }
  }

  return merchantsByDomain;
};

// For each chat, the shop's merchant row of every product its website serves:
// a shop on MIDA and FRAUD chats in one website and has a plan on each.
const resolvePlanDataMerchants = async (
  client: ApiClient,
  chats: CrispChat[],
): Promise<Map<string, PlanDataMerchant>[]> => {
  const items = chats.map(({ website, conversation }) => ({
    website,
    appNames: listWebsiteAppNames(website),
    sessionData: conversation.meta?.data,
    shopDomains: extractShopDomains(conversation.meta),
    emails: extractContactEmails(conversation.meta),
  }));
  const merchantsByAppAndDomain = new Map<
    string,
    Map<string, PlanDataMerchantRow>
  >();

  for (const appName of new Set(items.flatMap((item) => item.appNames))) {
    const appId = await readAppId(client, appName);

    // A product with no app row has no merchants to read.
    if (appId === null) {
      continue;
    }

    merchantsByAppAndDomain.set(
      appName,
      await readPlanDataMerchantsByShopDomain(
        client,
        appId,
        items
          .filter((item) => item.appNames.includes(appName))
          .flatMap((item) => item.shopDomains),
      ),
    );
  }

  const resolved: Map<string, PlanDataMerchant>[] = [];

  for (const item of items) {
    const merchantsByAppName = new Map<string, PlanDataMerchant>();

    for (const appName of item.appNames) {
      const merchant = item.shopDomains
        .map((shopDomain) =>
          merchantsByAppAndDomain.get(appName)?.get(shopDomain),
        )
        .find((match) => match !== undefined);

      if (merchant !== undefined) {
        merchantsByAppName.set(appName, merchant);
      }
    }

    // A chat that names no shop can still be told apart by its email.
    if (merchantsByAppName.size === 0 && item.emails.length > 0) {
      const appName = resolveConversationAppName(
        item.website.appName,
        item.sessionData,
      );
      const emailMatch = await matchMerchant({
        client,
        appName,
        shopDomains: [],
        emails: item.emails,
      });
      const merchant =
        emailMatch === undefined
          ? undefined
          : await readPlanDataMerchant(client, emailMatch.merchantId);

      if (merchant !== undefined) {
        merchantsByAppName.set(appName, merchant);
      }
    }

    resolved.push(merchantsByAppName);
  }

  return resolved;
};

// Writes the plan keys into the chats that lack them. The chats were just read
// from Crisp, so their data is sent back whole with the plan keys changed:
// Crisp does not document whether `data` is merged or replaced, and the
// product apps keep their own keys there. A dry run only reports.
export const writePlanDataToChats = async ({
  client,
  settings,
  chats,
  dryRun = false,
}: {
  client: ApiClient;
  settings: CrispSettings;
  chats: CrispChat[];
  dryRun?: boolean;
}): Promise<PlanDataChange[]> => {
  const merchantsByChat = await resolvePlanDataMerchants(client, chats);
  const changes: PlanDataChange[] = [];

  for (const [index, { website, conversation }] of chats.entries()) {
    const planData = buildCrispPlanData(merchantsByChat[index]);
    const currentData = conversation.meta?.data ?? {};
    const sessionId = conversation.session_id;

    if (
      sessionId === undefined ||
      planData === null ||
      hasCrispPlanData(currentData, planData)
    ) {
      continue;
    }

    if (!dryRun) {
      await updateCrispConversationData(
        settings,
        website.websiteId,
        sessionId,
        {
          ...currentData,
          ...planData,
        },
      );
    }

    changes.push({ websiteId: website.websiteId, sessionId, planData });
  }

  return changes;
};

// A shop rarely has more chats than this; past it the daily sweep picks up
// the rest.
const MAX_SHOP_SEARCH_PAGES = 4;

// Every chat of the shop in Crisp. The search also matches chats that merely
// mention the domain in a message, so only chats whose own profile or session
// data names the shop are taken.
const findShopChats = async (
  settings: CrispSettings,
  websites: CrispWebsite[],
  shopDomain: string,
): Promise<CrispChat[]> => {
  const chats: CrispChat[] = [];

  for (const website of websites) {
    for (
      let pageNumber = 1;
      pageNumber <= MAX_SHOP_SEARCH_PAGES;
      pageNumber += 1
    ) {
      const page = await searchCrispConversations(settings, website.websiteId, {
        pageNumber,
        text: shopDomain,
      });

      chats.push(
        ...page
          .filter((conversation) =>
            extractShopDomains(conversation.meta).includes(shopDomain),
          )
          .map((conversation) => ({ website, conversation })),
      );

      if (page.length < CRISP_CONVERSATIONS_PER_PAGE) {
        break;
      }
    }
  }

  return chats;
};

const readAppName = async (
  client: ApiClient,
  appId: string,
): Promise<string | null> => {
  const result = await executeWithRetry<{
    apps?: Connection<{ name: string | null }>;
  }>(() =>
    client.query({
      apps: {
        __args: { filter: { id: { eq: appId } }, first: 1 },
        edges: { node: { name: true } },
      },
    }),
  );

  return result?.apps?.edges?.[0]?.node?.name ?? null;
};

// Every chat of the merchant's shop on the websites its product answers in.
// A dry run lists them and what would change, without writing.
export const syncMerchantPlanData = async (
  merchantId: string,
  { dryRun }: { dryRun: boolean },
) => {
  const settings = readCrispSettings();
  const canRun = dryRun
    ? settings.enabled && isCrispApiConfigured(settings)
    : canWritePlanData(settings);

  if (!canRun) {
    return { skipped: 'Crisp plan data is off or Crisp is not configured' };
  }

  const client = createAppClient();
  const merchant = await readPlanDataMerchant(client, merchantId);

  if (merchant === undefined || merchant.name === null) {
    return { skipped: 'Merchant not found or has no shop domain' };
  }

  const appName =
    merchant.appId === null ? null : await readAppName(client, merchant.appId);
  const websites = settings.websites.filter(
    (website) =>
      appName !== null && listWebsiteAppNames(website).includes(appName),
  );
  const chats = await findShopChats(settings, websites, merchant.name);

  return {
    shopDomain: merchant.name,
    appName,
    chatsFound: chats.length,
    changes: await writePlanDataToChats({ client, settings, chats, dryRun }),
  };
};

export const syncMerchantPlanDataFromEvent = (merchantId: string) =>
  syncMerchantPlanData(merchantId, { dryRun: false });

// A chat just opened in Crisp: read it there and write its shop's plans.
export const syncSessionPlanData = async ({
  websiteId,
  sessionId,
}: {
  websiteId: string;
  sessionId: string;
}) => {
  const settings = readCrispSettings();
  const website = findCrispWebsite(settings, websiteId);

  if (!canWritePlanData(settings) || website === undefined) {
    return { skipped: 'Crisp plan data is off or the website is unknown' };
  }

  const conversation = await getCrispConversation(
    settings,
    website.websiteId,
    sessionId,
  );

  if (conversation === undefined) {
    return { skipped: 'Conversation not found in Crisp' };
  }

  return {
    changes: await writePlanDataToChats({
      client: createAppClient(),
      settings,
      chats: [
        { website, conversation: { ...conversation, session_id: sessionId } },
      ],
    }),
  };
};
