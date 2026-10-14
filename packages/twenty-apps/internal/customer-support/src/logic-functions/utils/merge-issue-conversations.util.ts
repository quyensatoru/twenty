type IssueConversationNode = Record<string, unknown> & {
  id: string;
  lastMessageAt?: unknown;
};

const readTime = (value: unknown): number =>
  typeof value === 'string' && value !== '' ? Date.parse(value) || 0 : 0;

// An issue shows the chats of the merchants it concerns and the ones someone
// linked to it by hand or by note; a chat that is both is listed once.
export const mergeIssueConversations = <TNode extends IssueConversationNode>(
  linkedConversations: readonly TNode[],
  merchantConversations: readonly TNode[],
): TNode[] => {
  const byId = new Map<string, TNode>();

  for (const conversation of [
    ...linkedConversations,
    ...merchantConversations,
  ]) {
    byId.set(conversation.id, conversation);
  }

  return [...byId.values()].sort(
    (left, right) =>
      readTime(right.lastMessageAt) - readTime(left.lastMessageAt),
  );
};
