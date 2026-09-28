import { escapeHtml } from './escape-html.util';

export const renderUnsubscribePage = ({
  lang,
  title,
  message,
  formAction,
  buttonLabel = '',
}: {
  lang: string;
  title: string;
  message: string;
  formAction?: string;
  buttonLabel?: string;
}): string => `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;background:#f4f5f7;font-family:Helvetica,Arial,sans-serif;color:#333;">
<div style="max-width:480px;margin:80px auto;padding:32px;background:#fff;border-radius:8px;text-align:center;">
<h1 style="font-size:22px;margin:0 0 12px;">${escapeHtml(title)}</h1>
<p style="font-size:15px;line-height:1.6;margin:0 0 24px;">${escapeHtml(message)}</p>
${
  formAction === undefined
    ? ''
    : `<form method="POST" action="${escapeHtml(formAction)}"><button type="submit" style="background:#1961ed;color:#fff;border:0;border-radius:6px;padding:12px 24px;font-size:15px;cursor:pointer;">${escapeHtml(buttonLabel)}</button></form>`
}
</div>
</body>
</html>`;
