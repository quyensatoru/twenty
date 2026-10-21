import { RECORD_PAGE_BASE_URL_VARIABLE } from '../../constants/application-variables';

export type NotificationEmail = { subject: string; html: string; text: string };

export type NotificationIssue = {
  id: string;
  title: string;
  issueKey: string | null;
};

type Accent = { background: string; ink: string; label: string };

const ACCENT_BY_KIND: Record<'ASSIGNED' | 'MENTION' | 'COMMENT', Accent> = {
  ASSIGNED: { background: '#E8F0FE', ink: '#1A56DB', label: 'ASSIGNED' },
  MENTION: { background: '#F3E8FD', ink: '#7E3AF2', label: 'MENTIONED' },
  COMMENT: { background: '#EEF0F2', ink: '#52525B', label: 'COMMENT' },
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Left empty, the email still says what happened — it just has no button to
// click through to it.
const buildIssueUrl = (issueId: string): string | null => {
  const baseUrl = (process.env[RECORD_PAGE_BASE_URL_VARIABLE] ?? '')
    .trim()
    .replace(/\/+$/, '');

  return baseUrl === '' ? null : `${baseUrl}/object/issue/${issueId}`;
};

const issueLabel = (issue: NotificationIssue): string =>
  issue.issueKey === null ? issue.title : `${issue.issueKey} — ${issue.title}`;

const buildEmail = ({
  kind,
  headline,
  issue,
  actorName,
  quote,
}: {
  kind: 'ASSIGNED' | 'MENTION' | 'COMMENT';
  headline: string;
  issue: NotificationIssue;
  actorName: string;
  quote?: string;
}): NotificationEmail => {
  const accent = ACCENT_BY_KIND[kind];
  const url = buildIssueUrl(issue.id);
  const subject = `[Task Manager] ${headline}: ${issueLabel(issue)}`;

  const quoteHtml =
    quote === undefined
      ? ''
      : `<blockquote style="margin:16px 0 0;padding:10px 14px;border-left:3px solid ${accent.ink};background:#FAFAFA;border-radius:0 6px 6px 0;color:#3F3F46;font-size:13px;line-height:1.5">${escapeHtml(quote)}</blockquote>`;

  const link =
    url === null
      ? ''
      : `<div style="margin-top:24px"><a href="${escapeHtml(url)}" style="display:inline-block;padding:10px 18px;border-radius:6px;background:#18181B;color:#FFFFFF;text-decoration:none;font-weight:600;font-size:13px">Open issue →</a></div>`;

  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,Inter,Arial,sans-serif;max-width:560px;margin:0 auto">
<div style="background:${accent.background};border-radius:10px 10px 0 0;padding:18px 24px">
<div style="font-size:11px;font-weight:700;letter-spacing:0.06em;color:${accent.ink}">${escapeHtml(accent.label)}</div>
<div style="font-size:17px;font-weight:600;color:#18181B;margin-top:4px">${escapeHtml(headline)}</div>
</div>
<div style="border:1px solid #E4E4E7;border-top:0;border-radius:0 0 10px 10px;padding:20px 24px">
${issue.issueKey === null ? '' : `<span style="display:inline-block;font-size:11px;font-weight:700;color:#52525B;background:#F4F4F5;border-radius:4px;padding:2px 8px;letter-spacing:0.03em">${escapeHtml(issue.issueKey)}</span>`}
<div style="font-size:15px;font-weight:600;color:#18181B;margin-top:8px">${escapeHtml(issue.title)}</div>
<div style="font-size:13px;color:#52525B;margin-top:10px">${escapeHtml(actorName)}${kind === 'ASSIGNED' ? ' assigned you this issue.' : kind === 'MENTION' ? ' mentioned you in a comment:' : ' commented:'}</div>
${quoteHtml}
${link}
</div>
</div>`;

  const text = [
    `[${accent.label}] ${headline}`,
    issueLabel(issue),
    '',
    `${actorName}${kind === 'ASSIGNED' ? ' assigned you this issue.' : kind === 'MENTION' ? ' mentioned you in a comment:' : ' commented:'}`,
    ...(quote === undefined ? [] : [`"${quote}"`]),
    ...(url === null ? [] : ['', `Open issue: ${url}`]),
  ].join('\n');

  return { subject, html, text };
};

export const buildIssueAssignedEmail = ({
  issue,
  actorName,
}: {
  issue: NotificationIssue;
  actorName: string;
}): NotificationEmail =>
  buildEmail({ kind: 'ASSIGNED', headline: 'Assigned to you', issue, actorName });

export const buildIssueCommentEmail = ({
  issue,
  actorName,
  commentExcerpt,
  isMention,
}: {
  issue: NotificationIssue;
  actorName: string;
  commentExcerpt: string;
  isMention: boolean;
}): NotificationEmail =>
  buildEmail({
    kind: isMention ? 'MENTION' : 'COMMENT',
    headline: isMention ? 'You were mentioned' : 'New comment',
    issue,
    actorName,
    quote: commentExcerpt,
  });
