import {
  MATTERMOST_BASE_URL_VARIABLE,
  MATTERMOST_BOT_TOKEN_VARIABLE,
  MATTERMOST_DEFAULT_CHANNEL_ID_VARIABLE,
} from '../../constants/application-variable-names';

const readVariable = (name: string): string => process.env[name]?.trim() ?? '';

export type MattermostAttachment = {
  color?: string;
  text?: string;
};

export type MattermostResult =
  | { ok: true; postId: string; channelId: string }
  | { ok: false; error: string };

// A plain fetch against the Mattermost REST API with a bot's personal access
// token, not an SDK: Mattermost has no first-party client here and the two
// calls this app needs (create post, patch post) are a handful of lines.
const request = async (path: string, init: RequestInit): Promise<Response> => {
  const baseUrl = readVariable(MATTERMOST_BASE_URL_VARIABLE).replace(/\/+$/, '');
  const token = readVariable(MATTERMOST_BOT_TOKEN_VARIABLE);

  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
  });
};

export const postToMattermost = async (
  channelId: string | null,
  message: string,
  attachments?: MattermostAttachment[],
): Promise<MattermostResult> => {
  const resolvedChannelId = channelId ?? readVariable(MATTERMOST_DEFAULT_CHANNEL_ID_VARIABLE);

  if (resolvedChannelId.length === 0) {
    return { ok: false, error: 'No Mattermost channel configured.' };
  }

  try {
    const response = await request('/api/v4/posts', {
      method: 'POST',
      body: JSON.stringify({
        channel_id: resolvedChannelId,
        message,
        props: attachments === undefined ? undefined : { attachments },
      }),
    });

    if (!response.ok) {
      return { ok: false, error: `Mattermost HTTP ${response.status}: ${await response.text()}` };
    }

    const post = (await response.json()) as { id: string; channel_id: string };

    return { ok: true, postId: post.id, channelId: post.channel_id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
};

export const patchMattermostPost = async (
  postId: string,
  message: string,
  attachments?: MattermostAttachment[],
): Promise<{ ok: true } | { ok: false; error: string }> => {
  try {
    const response = await request(`/api/v4/posts/${postId}/patch`, {
      method: 'PUT',
      body: JSON.stringify({
        message,
        props: attachments === undefined ? undefined : { attachments },
      }),
    });

    if (!response.ok) {
      return { ok: false, error: `Mattermost HTTP ${response.status}: ${await response.text()}` };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
};
