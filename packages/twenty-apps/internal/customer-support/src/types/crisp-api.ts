// The subset of Crisp's REST and web hook payloads the sync reads. Every field
// is optional: Crisp omits keys freely, and a missing one must not throw.
export type CrispConversationMeta = {
  nickname?: string;
  email?: string;
  phone?: string;
  subject?: string;
  origin?: string;
  segments?: string[];
  data?: Record<string, string | number | boolean>;
  device?: {
    geolocation?: { country?: string; city?: string };
  };
};

export type CrispConversationPayload = {
  session_id?: string;
  website_id?: string;
  state?: string;
  created_at?: number;
  updated_at?: number;
  waiting_since?: number;
  preview_message?: {
    type?: string;
    from?: string;
    excerpt?: string;
    fingerprint?: number;
  };
  meta?: CrispConversationMeta;
};

export type CrispMessagePayload = {
  session_id?: string;
  website_id?: string;
  type?: string;
  from?: string;
  origin?: string;
  content?: unknown;
  fingerprint?: number | string;
  timestamp?: number;
  user?: { nickname?: string; user_id?: string; type?: string };
};

export type CrispWebhookBody = {
  website_id?: string;
  event?: string;
  data?: Record<string, unknown>;
  timestamp?: number;
};
