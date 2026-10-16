// From this many replies a thread folds to its first reply and a summary row,
// so one long side conversation does not push the rest of the issue away.
export const THREAD_COLLAPSE_THRESHOLD = 3;

const FACEPILE_LIMIT = 3;

type ThreadReply = {
  id: string;
  authorId?: string | null;
  createdAt?: string | null;
};

export type CollapsedThread<TReply extends ThreadReply> = {
  visibleReplies: TReply[];
  hiddenCount: number;
  // Distinct authors of the folded replies, most recent first.
  hiddenAuthorIds: string[];
  lastReplyAt: string | null;
};

// `replies` are oldest first. A folded thread still opens by itself when the
// reply a deep link points at would otherwise be hidden.
export const collapseThreadReplies = <TReply extends ThreadReply>({
  replies,
  isExpanded,
  highlightedReplyId = null,
}: {
  replies: TReply[];
  isExpanded: boolean;
  highlightedReplyId?: string | null;
}): CollapsedThread<TReply> => {
  const hiddenReplies = replies.slice(1);
  const isHighlightHidden = hiddenReplies.some(
    (reply) => reply.id === highlightedReplyId,
  );

  if (
    isExpanded ||
    isHighlightHidden ||
    replies.length < THREAD_COLLAPSE_THRESHOLD
  ) {
    return {
      visibleReplies: replies,
      hiddenCount: 0,
      hiddenAuthorIds: [],
      lastReplyAt: null,
    };
  }

  const hiddenAuthorIds = [
    ...new Set(
      [...hiddenReplies]
        .reverse()
        .map((reply) => reply.authorId)
        .filter((authorId): authorId is string => typeof authorId === 'string'),
    ),
  ].slice(0, FACEPILE_LIMIT);

  return {
    visibleReplies: replies.slice(0, 1),
    hiddenCount: hiddenReplies.length,
    hiddenAuthorIds,
    lastReplyAt: hiddenReplies[hiddenReplies.length - 1]?.createdAt ?? null,
  };
};
