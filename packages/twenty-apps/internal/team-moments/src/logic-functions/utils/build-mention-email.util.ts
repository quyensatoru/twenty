import { PUBLIC_BASE_URL_VARIABLE } from '../../constants/application-variable-names';

export type MentionEmail = { subject: string; html: string; text: string };

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Left empty, the email still says what happened — it just has no button to
// click through to it.
const buildMomentsUrl = (): string | null => {
  const baseUrl = (process.env[PUBLIC_BASE_URL_VARIABLE] ?? '')
    .trim()
    .replace(/\/+$/, '');

  return baseUrl === '' ? null : `${baseUrl}/objects/eventMessages`;
};

export const buildMentionEmail = ({
  actorName,
  eventTitle,
  commentExcerpt,
}: {
  actorName: string;
  eventTitle: string;
  commentExcerpt: string;
}): MentionEmail => {
  const url = buildMomentsUrl();
  const subject = `[Team Moments] ${actorName} mentioned you in ${eventTitle}`;

  const quoteHtml = `<blockquote style="margin:16px 0 0;padding:10px 14px;border-left:3px solid #7E3AF2;background:#FAFAFA;border-radius:0 6px 6px 0;color:#3F3F46;font-size:13px;line-height:1.5">${escapeHtml(commentExcerpt)}</blockquote>`;
  const link =
    url === null
      ? ''
      : `<div style="margin-top:24px"><a href="${escapeHtml(url)}" style="display:inline-block;padding:10px 18px;border-radius:6px;background:#18181B;color:#FFFFFF;text-decoration:none;font-weight:600;font-size:13px">Open chat →</a></div>`;

  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,Inter,Arial,sans-serif;max-width:560px;margin:0 auto">
<div style="background:#F3E8FD;border-radius:10px 10px 0 0;padding:18px 24px">
<div style="font-size:11px;font-weight:700;letter-spacing:0.06em;color:#7E3AF2">MENTIONED</div>
<div style="font-size:17px;font-weight:600;color:#18181B;margin-top:4px">${escapeHtml(actorName)} mentioned you</div>
</div>
<div style="border:1px solid #E4E4E7;border-top:0;border-radius:0 0 10px 10px;padding:20px 24px">
<div style="font-size:13px;color:#52525B">In the chat for <strong>${escapeHtml(eventTitle)}</strong>:</div>
${quoteHtml}
${link}
</div>
</div>`;

  const text = [
    `[MENTIONED] ${actorName} mentioned you`,
    `In the chat for ${eventTitle}:`,
    `"${commentExcerpt}"`,
    ...(url === null ? [] : ['', `Open chat: ${url}`]),
  ].join('\n');

  return { subject, html, text };
};
