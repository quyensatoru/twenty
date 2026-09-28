// Mail clients drop scripts anyway; removing them keeps the preview and the
// sent message identical and stops a pasted snippet from phoning home.
export const stripUnsafeHtml = (html: string): string =>
  html
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<script\b[^>]*\/?>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
