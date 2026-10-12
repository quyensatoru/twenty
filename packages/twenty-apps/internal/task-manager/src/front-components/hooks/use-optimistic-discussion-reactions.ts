import { useEffect, useRef, useState } from 'react';

import {
  type DiscussionReaction,
  type DiscussionSnapshot,
} from './use-discussion-state';

type ReactionChange = DiscussionReaction & {
  issueId: string;
  active: boolean;
  confirmedActive: boolean;
  isSaving: boolean;
};

type OptimisticReactionInput = {
  issueId: string | null;
  snapshot: DiscussionSnapshot | null;
  persist: (
    commentId: string,
    emoji: string,
    active: boolean,
  ) => Promise<unknown>;
};

const matchesReaction = (
  reaction: DiscussionReaction,
  change: DiscussionReaction,
) =>
  reaction.commentId === change.commentId &&
  reaction.memberId === change.memberId &&
  reaction.emoji === change.emoji;

export const useOptimisticDiscussionReactions = ({
  issueId,
  snapshot,
  persist,
}: OptimisticReactionInput) => {
  const changes = useRef(new Map<string, ReactionChange>());
  const currentIssueId = useRef(issueId);
  currentIssueId.current = issueId;
  const mounted = useRef(true);
  const [revision, setRevision] = useState(0);
  const notify = () => {
    if (mounted.current) setRevision((previous) => previous + 1);
  };

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let changed = false;
    for (const [key, change] of changes.current) {
      if (
        change.issueId !== issueId ||
        (!change.isSaving &&
          snapshot !== null &&
          snapshot.reactions.some((reaction) =>
            matchesReaction(reaction, change),
          ) === change.active)
      ) {
        changes.current.delete(key);
        changed = true;
      }
    }
    if (changed) notify();
  }, [issueId, snapshot, revision]);

  const react = async (commentId: string, emoji: string, active: boolean) => {
    if (issueId === null || snapshot === null || !snapshot.canWrite)
      return false;
    const memberId = snapshot.currentMemberId;
    const key = JSON.stringify([issueId, commentId, memberId, emoji]);
    let change = changes.current.get(key);
    if (change === undefined) {
      change = {
        issueId,
        commentId,
        memberId,
        emoji,
        active,
        confirmedActive: snapshot.reactions.some((reaction) =>
          matchesReaction(reaction, { commentId, memberId, emoji }),
        ),
        isSaving: false,
      };
      changes.current.set(key, change);
    }
    change.active = active;
    notify();
    if (change.isSaving) return false;
    change.isSaving = true;
    try {
      while (change.active !== change.confirmedActive) {
        const requestedActive = change.active;
        try {
          await persist(commentId, emoji, requestedActive);
        } catch (error) {
          if (change.active === requestedActive)
            change.active = change.confirmedActive;
          throw error;
        }
        if (currentIssueId.current !== issueId || !mounted.current)
          return false;
        change.confirmedActive = requestedActive;
      }
      return true;
    } finally {
      change.isSaving = false;
      if (currentIssueId.current === issueId) notify();
    }
  };

  let reactions = snapshot?.reactions ?? [];
  for (const change of changes.current.values()) {
    if (
      change.issueId !== issueId ||
      change.memberId !== snapshot?.currentMemberId
    )
      continue;
    reactions = reactions.filter(
      (reaction) => !matchesReaction(reaction, change),
    );
    if (change.active)
      reactions = [
        ...reactions,
        {
          commentId: change.commentId,
          memberId: change.memberId,
          emoji: change.emoji,
        },
      ];
  }
  return { reactions, react };
};
