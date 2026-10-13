import { type CrispConversationStatus } from '../../constants/crisp';
import { type CrispConversationPayload } from '../../types/crisp-api';
import { computeCrispConversationId } from './crisp-record-id.util';
import { type CrispWebsite } from './read-crisp-settings.util';

export type CrispConversationRecord = {
  id: string;
  sessionId: string;
  websiteId: string;
  appName: string;
  visitorName?: string | null;
  visitorEmail?: string | null;
  status?: CrispConversationStatus;
  startedAt?: string | null;
  waitingSince?: string | null;
  segments?: string[];
  country?: string | null;
  sessionData?: Record<string, unknown> | null;
};

const CRISP_STATES: Record<string, CrispConversationStatus> = {
  pending: 'PENDING',
  unresolved: 'UNRESOLVED',
  resolved: 'RESOLVED',
};

export const toConversationStatus = (
  state: unknown,
): CrispConversationStatus | undefined =>
  typeof state === 'string' ? CRISP_STATES[state] : undefined;

const toIsoDate = (milliseconds: unknown): string | null =>
  typeof milliseconds === 'number' && milliseconds > 0
    ? new Date(milliseconds).toISOString()
    : null;

const readText = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

// Everything about a conversation that Crisp states directly. The fields the
// thread itself decides (last message, message count, agent) are written by
// whoever imported the messages.
export const buildConversationRecord = ({
  conversation,
  website,
  sessionId,
}: {
  conversation: CrispConversationPayload;
  website: CrispWebsite;
  sessionId: string;
}): CrispConversationRecord => {
  const meta = conversation.meta ?? {};
  const status = toConversationStatus(conversation.state);

  return {
    id: computeCrispConversationId({
      websiteId: website.websiteId,
      sessionId,
    }),
    sessionId,
    websiteId: website.websiteId,
    appName: website.appName,
    visitorName: readText(meta.nickname),
    visitorEmail: readText(meta.email)?.toLowerCase() ?? null,
    ...(status === undefined ? {} : { status }),
    startedAt: toIsoDate(conversation.created_at),
    waitingSince:
      status === 'RESOLVED' ? null : toIsoDate(conversation.waiting_since),
    segments: Array.isArray(meta.segments) ? meta.segments : [],
    country: readText(meta.device?.geolocation?.country),
    sessionData:
      meta.data !== undefined && Object.keys(meta.data).length > 0
        ? meta.data
        : null,
  };
};
