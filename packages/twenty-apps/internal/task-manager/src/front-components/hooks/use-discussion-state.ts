import { useCallback, useEffect, useRef, useState } from 'react';

import {
  resolveSignedMarkdown,
  stripFileTokens,
} from '../../utils/resolve-signed-markdown.util';
import { APP_SCOPE_PERMISSION_DENIED } from '../../constants/app-scope-permission-denied';
import { type IssueCommentRow, type MemberRow } from './use-issue-detail';
import { postAppRoute } from '../utils/post-app-route.util';
import { useOptimisticDiscussionReactions } from './use-optimistic-discussion-reactions';
import { readErrorText } from '../utils/read-error-text.util';

export const DISCUSSION_ROUTE_PATH = '/task-manager/discussion-state';
export const DISCUSSION_REACTIONS = ['👍', '❤️', '🎉', '👀'] as const;
export type DiscussionReaction = {
  commentId: string;
  memberId: string;
  emoji: string;
};
export type DiscussionReadState = {
  memberId: string;
  commentId?: string | null;
  lastReadAt: string;
};
export type DiscussionSnapshot = {
  success: true;
  comments: IssueCommentRow[];
  reactions: DiscussionReaction[];
  readStates: DiscussionReadState[];
  members: MemberRow[];
  currentMemberId: string;
  canWrite: boolean;
  canSoftDelete: boolean;
  nextCursor?: string | null;
};

export const useDiscussionState = (issueId: string | null) => {
  const [snapshot, setSnapshot] = useState<DiscussionSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const snapshotIssueId = useRef<string | null>(null);
  const issueIdRef = useRef(issueId);
  issueIdRef.current = issueId;
  const loadedPageCount = useRef(1);
  const requestGeneration = useRef(0);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);

  const reload = useCallback(async () => {
    if (issueId === null) return;
    const generation = ++requestGeneration.current;
    try {
      const result = await postAppRoute<DiscussionSnapshot>(
        DISCUSSION_ROUTE_PATH,
        { issueId, action: 'snapshot' },
      );
      for (
        let page = 1;
        page < loadedPageCount.current && result.nextCursor;
        page += 1
      ) {
        const earlier = await postAppRoute<DiscussionSnapshot>(
          DISCUSSION_ROUTE_PATH,
          { issueId, action: 'snapshot', cursor: result.nextCursor },
        );
        result.comments.push(...earlier.comments);
        result.nextCursor = earlier.nextCursor;
      }
      if (
        issueIdRef.current !== issueId ||
        requestGeneration.current !== generation
      )
        return;
      setIsPermissionDenied(false);
      snapshotIssueId.current = issueId;
      setSnapshot((previous) => ({
        ...result,
        comments: result.comments.map((comment) => {
          if (comment.bodyV2 === null || comment.bodyV2 === undefined)
            return comment;
          const markdown = resolveSignedMarkdown(comment.bodyV2);
          const previousMarkdown = previous?.comments.find(
            (previousComment) => previousComment.id === comment.id,
          )?.bodyV2?.markdown;
          const isUnchanged =
            typeof previousMarkdown === 'string' &&
            stripFileTokens(previousMarkdown) === stripFileTokens(markdown);
          return {
            ...comment,
            bodyV2: {
              ...comment.bodyV2,
              markdown: isUnchanged ? previousMarkdown : markdown,
            },
          };
        }),
      }));
      setError(null);
    } catch (caught) {
      if (
        issueIdRef.current !== issueId ||
        requestGeneration.current !== generation
      )
        return;
      setError(readErrorText(caught));
      if (
        caught instanceof Error &&
        caught.message === APP_SCOPE_PERMISSION_DENIED
      ) {
        setIsPermissionDenied(true);
        setSnapshot(null);
      }
    }
  }, [issueId]);

  useEffect(() => {
    setSnapshot(null);
    setIsPermissionDenied(false);
    setError(null);
    loadedPageCount.current = 1;
    void reload();
  }, [reload]);

  const optimisticReactions = useOptimisticDiscussionReactions({
    issueId,
    snapshot: snapshotIssueId.current === issueId ? snapshot : null,
    persist: (commentId, emoji, active) =>
      postAppRoute(DISCUSSION_ROUTE_PATH, {
        issueId,
        action: 'react',
        commentId,
        emoji,
        active,
      }),
  });

  const act = useCallback(
    async (action: string, input: Record<string, unknown>) => {
      try {
        if (
          action === 'react' &&
          typeof input.commentId === 'string' &&
          typeof input.emoji === 'string' &&
          typeof input.active === 'boolean'
        ) {
          const completed = await optimisticReactions.react(
            input.commentId,
            input.emoji,
            input.active,
          );
          if (completed && issueIdRef.current === issueId) void reload();
          return;
        }
        const result = await postAppRoute<{ readState?: DiscussionReadState }>(
          DISCUSSION_ROUTE_PATH,
          {
            issueId,
            action,
            ...input,
          },
        );
        const readState = result.readState;
        if (action === 'read' && readState !== undefined) {
          if (issueIdRef.current === issueId)
            setSnapshot((previous) =>
              previous === null
                ? null
                : {
                    ...previous,
                    readStates: [
                      ...previous.readStates.filter(
                        (state) =>
                          !(
                            state.memberId === readState.memberId &&
                            state.commentId === readState.commentId
                          ),
                      ),
                      readState,
                    ],
                  },
            );
        } else await reload();
      } catch (caught) {
        if (issueIdRef.current !== issueId) throw caught;
        setError(readErrorText(caught));
        if (
          caught instanceof Error &&
          caught.message === APP_SCOPE_PERMISSION_DENIED
        ) {
          setIsPermissionDenied(true);
          setSnapshot(null);
        }
        throw caught;
      }
    },
    [issueId, reload, optimisticReactions.react],
  );

  const loadEarlier = async () => {
    if (!snapshot?.nextCursor) return;
    loadedPageCount.current += 1;
    await reload();
  };

  return {
    snapshot:
      snapshotIssueId.current === issueId && snapshot !== null
        ? { ...snapshot, reactions: optimisticReactions.reactions }
        : null,
    error,
    isPermissionDenied,
    reload,
    act,
    loadEarlier,
  };
};
