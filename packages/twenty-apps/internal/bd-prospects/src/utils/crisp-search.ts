import { brandSpaced, domainOfEmail } from './build-linkedin-queries';
import { delay } from './rate-limiter';
import { type CrispWorkspace } from './read-crisp-settings';

const CRISP_API_BASE_URL = 'https://api.crisp.chat/v1';
const CONVERSATIONS_PER_REQUEST = 20;
const RATE_LIMIT_ATTEMPTS = 3;
const RATE_LIMIT_DELAY_MS = 5_000;

export type CrispConversation = {
  sessionId: string;
  email: string | null;
  nickname: string | null;
};

export type CrispMatch = {
  sessionId: string;
  email: string | null;
  nickname: string | null;
  url: string;
};

type CrispConversationResponse = {
  session_id?: string;
  meta?: {
    email?: string | null;
    nickname?: string | null;
  } | null;
};

const normalizeDomain = (domain: string): string =>
  domain.toLowerCase().trim().replace(/^www\./, '');

const emailDomainOf = (email: string | null): string | undefined => {
  if (typeof email !== 'string') {
    return undefined;
  }

  const domain = domainOfEmail(email);

  return typeof domain === 'string' ? normalizeDomain(domain) : undefined;
};

export const buildCrispConversationUrl = ({
  websiteId,
  sessionId,
}: {
  websiteId: string;
  sessionId: string;
}): string =>
  `https://app.crisp.chat/website/${websiteId}/inbox/${sessionId}/`;

// Text search is fuzzy, so a top hit is only trusted with name evidence: the
// visitor email living on the shop domain, or the nickname carrying the brand.
// Anything else stays a miss rather than linking BD to a stranger's chat.
export const pickCrispConversation = ({
  conversations,
  domain,
  shopName,
}: {
  conversations: CrispConversation[];
  domain: string;
  shopName?: string | null;
}): CrispConversation | undefined => {
  const cleanDomain = normalizeDomain(domain);

  if (cleanDomain.length === 0) {
    return undefined;
  }

  const withSession = conversations.filter(
    (conversation) => conversation.sessionId.length > 0,
  );

  const emailMatch = withSession.find(
    (conversation) => emailDomainOf(conversation.email) === cleanDomain,
  );

  if (emailMatch !== undefined) {
    return emailMatch;
  }

  const brand = (
    typeof shopName === 'string' && shopName.trim().length > 0
      ? shopName.trim().toLowerCase()
      : brandSpaced(cleanDomain).toLowerCase()
  ).trim();

  if (brand.length === 0) {
    return undefined;
  }

  return withSession.find((conversation) =>
    (conversation.nickname ?? '').toLowerCase().includes(brand),
  );
};

const toConversation = (raw: CrispConversationResponse): CrispConversation | undefined => {
  const sessionId = raw?.session_id?.trim() ?? '';

  if (sessionId.length === 0) {
    return undefined;
  }

  const email = raw?.meta?.email?.trim() ?? '';

  return {
    sessionId,
    email: email.length > 0 ? email : null,
    nickname: raw?.meta?.nickname?.trim() || null,
  };
};

export const searchCrispConversations = async ({
  workspace,
  domain,
}: {
  workspace: CrispWorkspace;
  domain: string;
}): Promise<CrispConversation[]> => {
  const url =
    `${CRISP_API_BASE_URL}/website/${workspace.websiteId}/conversations/1` +
    `?search_query=${encodeURIComponent(domain)}` +
    `&search_type=text&per_page=${CONVERSATIONS_PER_REQUEST}`;
  const authorization = `Basic ${Buffer.from(
    `${workspace.identifier}:${workspace.key}`,
  ).toString('base64')}`;

  for (let attempt = 0; ; attempt += 1) {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: authorization,
        'X-Crisp-Tier': 'plugin',
      },
    });

    if (response.status === 429 && attempt < RATE_LIMIT_ATTEMPTS) {
      await delay(RATE_LIMIT_DELAY_MS);
      continue;
    }

    if (!response.ok) {
      throw new Error(
        `Crisp search failed for ${JSON.stringify(domain)}: HTTP ${response.status}`,
      );
    }

    const body = (await response.json()) as {
      data?: CrispConversationResponse[];
    };
    const found: CrispConversation[] = [];

    for (const raw of body?.data ?? []) {
      const conversation = toConversation(raw);

      if (conversation !== undefined) {
        found.push(conversation);
      }
    }

    return found;
  }
};

export const resolveCrispMatch = async ({
  workspaces,
  domain,
  shopName,
}: {
  workspaces: CrispWorkspace[];
  domain: string;
  shopName?: string | null;
}): Promise<CrispMatch | undefined> => {
  for (const workspace of workspaces) {
    const conversations = await searchCrispConversations({
      workspace,
      domain,
    });
    const picked = pickCrispConversation({ conversations, domain, shopName });

    if (picked !== undefined) {
      return {
        sessionId: picked.sessionId,
        email: picked.email,
        nickname: picked.nickname,
        url: buildCrispConversationUrl({
          websiteId: workspace.websiteId,
          sessionId: picked.sessionId,
        }),
      };
    }
  }

  return undefined;
};
