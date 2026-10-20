export const getChatMentionQuery = (draft: string): string | null => {
  const match = draft.match(/(^|\s)@([^@\n]*)$/);

  return match?.[2] ?? null;
};

export const insertChatMention = (draft: string, label: string): string =>
  draft.replace(/(^|\s)@([^@\n]*)$/, (_, prefix: string) => `${prefix}@${label} `);
