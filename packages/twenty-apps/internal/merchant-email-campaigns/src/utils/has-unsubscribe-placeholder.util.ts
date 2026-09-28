export const hasUnsubscribePlaceholder = (html: string): boolean =>
  /\{\{\s*unsubscribeUrl\s*\}\}/.test(html);
