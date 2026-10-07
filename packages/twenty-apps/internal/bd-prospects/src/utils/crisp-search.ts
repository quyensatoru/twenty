import { brandSpaced, domainOfEmail } from './build-linkedin-queries';
import { delay } from './rate-limiter';
import {
  type AppCrispWorkspace,
  type CrispWorkspace,
} from './read-crisp-settings';

const CRISP_API_BASE_URL = 'https://api.crisp.chat/v1';
const CONVERSATIONS_PER_REQUEST = 20;
const RATE_LIMIT_ATTEMPTS = 3;
const RATE_LIMIT_DELAY_MS = 5_000;
// Marketplace plugin tokens and personal user tokens look identical but are
// only accepted under their own tier, and BD may paste either kind.
const CRISP_TIERS = ['plugin', 'user'] as const;

export type CrispConversation = {
  sessionId: string;
  email: string | null;
  nickname: string | null;
};

export type CrispMatch = {
  appKey: string;
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

export class CrispAuthError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

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

  let tierIndex = 0;

  for (let attempt = 0; ; attempt += 1) {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: authorization,
        'X-Crisp-Tier': CRISP_TIERS[tierIndex],
      },
    });

    if (response.status === 429 && attempt < RATE_LIMIT_ATTEMPTS) {
      await delay(RATE_LIMIT_DELAY_MS);
      continue;
    }

    if (
      (response.status === 401 || response.status === 403) &&
      tierIndex < CRISP_TIERS.length - 1
    ) {
      tierIndex += 1;
      continue;
    }

    if (!response.ok) {
      const message = `Crisp search failed for ${JSON.stringify(domain)} on website ${workspace.websiteId}: HTTP ${response.status}`;

      if (response.status === 401 || response.status === 403) {
        throw new CrispAuthError(message, response.status);
      }

      throw new Error(message);
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

export type CrispMatchResult = {
  matches: CrispMatch[];
  // Apps whose workspace rejected the credentials: the shop was not fully
  // searched, so the caller must not treat the result as a miss.
  blockedAppKeys: string[];
};

// One conversation per app, each searched only in that app's own workspace. A
// workspace that rejects its credentials is remembered in brokenWebsiteIds so
// the rest of the run stops calling it, while the other apps carry on.
export const resolveCrispMatches = async ({
  workspaces,
  domain,
  shopName,
  brokenWebsiteIds = new Set<string>(),
  onAuthFailure,
}: {
  workspaces: AppCrispWorkspace[];
  domain: string;
  shopName?: string | null;
  brokenWebsiteIds?: Set<string>;
  onAuthFailure?: (appKey: string, error: CrispAuthError) => void;
}): Promise<CrispMatchResult> => {
  const result: CrispMatchResult = { matches: [], blockedAppKeys: [] };

  for (const { appKey, workspace } of workspaces) {
    if (brokenWebsiteIds.has(workspace.websiteId)) {
      result.blockedAppKeys.push(appKey);
      continue;
    }

    let conversations: CrispConversation[];

    try {
      conversations = await searchCrispConversations({ workspace, domain });
    } catch (error) {
      if (!(error instanceof CrispAuthError)) {
        throw error;
      }

      brokenWebsiteIds.add(workspace.websiteId);
      onAuthFailure?.(appKey, error);
      result.blockedAppKeys.push(appKey);
      continue;
    }

    const picked = pickCrispConversation({ conversations, domain, shopName });

    if (picked !== undefined) {
      result.matches.push({
        appKey,
        sessionId: picked.sessionId,
        email: picked.email,
        nickname: picked.nickname,
        url: buildCrispConversationUrl({
          websiteId: workspace.websiteId,
          sessionId: picked.sessionId,
        }),
      });
    }
  }

  return result;
};
