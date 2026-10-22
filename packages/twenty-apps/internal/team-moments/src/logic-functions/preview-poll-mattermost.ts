import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { PUBLIC_BASE_URL_VARIABLE } from '../constants/application-variable-names';
import { POLL_THUMBNAIL_ROUTE_PATH, PREVIEW_POLL_ROUTE_PATH } from '../constants/route-paths';
import { PREVIEW_POLL_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { buildPollAnchor } from '../utils/polls-anchor.util';
import { findPollById } from './utils/find-poll.util';
import { findPollsPagePath } from './utils/find-polls-page-path.util';
import { httpResponse } from './utils/http-response.util';

const readHeader = (headers: Record<string, string | undefined>, name: string): string | undefined =>
  Object.entries(headers).find(([key]) => key.toLowerCase() === name)?.[1];

// Same origin resolution as the publish/refresh routes.
const readOrigin = (headers: Record<string, string | undefined>): string | null => {
  const configured = process.env[PUBLIC_BASE_URL_VARIABLE]?.trim().replace(/\/+$/, '');

  if (configured !== undefined && configured.length > 0) {
    return configured;
  }

  const host = readHeader(headers, 'x-forwarded-host') ?? readHeader(headers, 'host');

  return host === undefined || host.length === 0
    ? null
    : `${readHeader(headers, 'x-forwarded-proto')?.split(',')[0] ?? 'https'}://${host}`;
};

const escapeHtml = (value: string): string =>
  value.replace(/[<>&"']/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[char] ?? char));

// A mock of the Mattermost message this poll would post, so a bot token can
// be set up later without blocking on "what will this actually look like".
// Renders the exact same question/options/thumbnail/link the real post uses,
// just wrapped in Mattermost-ish chrome instead of sent through its API.
const handler = async (event: RoutePayload) => {
  const poll = await findPollById(event.queryStringParameters?.id);

  if (poll === null) {
    return httpResponse('Không tìm thấy poll.', { 'content-type': 'text/plain; charset=utf-8' }, 404);
  }

  const origin = readOrigin(event.headers ?? {});
  const pollsPagePath = await findPollsPagePath();
  const voteUrl = pollsPagePath === null ? null : `${origin ?? ''}${pollsPagePath}${buildPollAnchor(poll.id)}`;
  const thumbnailUrl = `${origin ?? ''}/s${POLL_THUMBNAIL_ROUTE_PATH}?id=${poll.id}`;
  const voteCount = (poll.votes ?? []).length;

  const html = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8" />
<title>Preview Mattermost – ${escapeHtml(poll.question)}</title>
<style>
  :root { color-scheme: light; }
  body { margin: 0; background: #ebebeb; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; }
  .banner { background: #171a21; color: #fff; font-size: 13px; padding: 10px 24px; }
  .banner strong { color: #ffb199; }
  .stage { max-width: 640px; margin: 24px auto; padding: 0 16px 48px; }
  .channel { color: #4a4a4a; font-size: 13px; font-weight: 600; margin: 0 0 12px; }
  .post { background: #ffffff; border-radius: 4px; padding: 14px 16px; display: flex; gap: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.08); }
  .avatar { width: 36px; height: 36px; border-radius: 4px; background: #ff6353; color: #fff; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }
  .body { flex: 1; min-width: 0; }
  .author { font-weight: 700; color: #171a21; font-size: 15px; }
  .author .bot-tag { background: #e8e8e8; color: #666; font-size: 10px; font-weight: 600; border-radius: 3px; padding: 1px 5px; margin-left: 6px; vertical-align: middle; }
  .timestamp { color: #8a8a8a; font-size: 12px; margin-left: 6px; }
  .message { color: #171a21; font-size: 14.5px; line-height: 1.4; margin: 4px 0 0; }
  .attachment { border-left: 4px solid #ff6353; background: #fafafa; border-radius: 0 3px 3px 0; margin-top: 10px; padding: 10px 12px; }
  .attachment a { display: block; }
  .attachment img { max-width: 100%; display: block; border-radius: 4px; }
  .note { color: #8a8a8a; font-size: 12px; margin-top: 16px; }
</style>
</head>
<body>
  <div class="banner">👁️ <strong>Đây là bản xem trước</strong> — mô phỏng tin nhắn sẽ đăng lên Mattermost, không phải tin nhắn thật. Cấu hình bot token xong thì poll mới thật sự đăng được.</div>
  <div class="stage">
    <p class="channel"># team-moments (kênh mẫu)</p>
    <div class="post">
      <div class="avatar">TM</div>
      <div class="body">
        <span class="author">Team Moments Bot<span class="bot-tag">BOT</span></span><span class="timestamp">vừa xong</span>
        <p class="message">📊 <strong>${escapeHtml(poll.question)}</strong></p>
        <div class="attachment">
          ${
            voteUrl === null
              ? `<img src="${escapeHtml(thumbnailUrl)}" alt="Biểu đồ kết quả poll" />`
              : `<a href="${escapeHtml(voteUrl)}"><img src="${escapeHtml(thumbnailUrl)}" alt="Bấm để vote trong Twenty" /></a>`
          }
        </div>
      </div>
    </div>
    <p class="note">${voteCount} người đã vote · link ảnh thumbnail: <code>${escapeHtml(thumbnailUrl)}</code></p>
  </div>
</body>
</html>`;

  return httpResponse(html, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
  });
};

export default defineLogicFunction({
  universalIdentifier: PREVIEW_POLL_LOGIC_FUNCTION_UID,
  name: 'moments-preview-poll-mattermost',
  description: 'Public route: mocks the Mattermost post of a poll, for checking the thumbnail and link without a bot token.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: PREVIEW_POLL_ROUTE_PATH,
    httpMethod: 'GET',
    isAuthRequired: false,
  },
  handler,
});
