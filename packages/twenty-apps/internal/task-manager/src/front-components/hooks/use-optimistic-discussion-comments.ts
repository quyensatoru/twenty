import { useEffect, useRef, useState } from 'react';

import { buildRichTextValue } from '../../utils/read-rich-text-plain-value.util';
import { readErrorText } from '../utils/read-error-text.util';
import { type DiscussionCreateInput } from '../components/discussion-composer';
import { type IssueCommentRow } from './use-issue-detail';

type PendingComment = {
  input: DiscussionCreateInput;
  comment: IssueCommentRow;
  status: 'sending' | 'failed' | 'confirmed';
  error?: string;
};

type OptimisticDiscussionInput = {
  comments: IssueCommentRow[];
  currentMemberId: string | null;
  onCreate: (input: DiscussionCreateInput) => Promise<IssueCommentRow | void>;
};

export const useOptimisticDiscussionComments = ({
  comments,
  currentMemberId,
  onCreate,
}: OptimisticDiscussionInput) => {
  const [pendingComments, setPendingComments] = useState<PendingComment[]>([]);
  const mounted = useRef(true);
  const requestsInFlight = useRef(new Set<string>());

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    setPendingComments((previous) => {
      const next = previous.filter(
        (entry) =>
          entry.status !== 'confirmed' ||
          !comments.some(
            (comment) =>
              comment.id === entry.comment.id ||
              comment.requestId === entry.input.requestId,
          ),
      );
      return next.length === previous.length ? previous : next;
    });
  }, [comments, pendingComments]);

  const persist = async (input: DiscussionCreateInput) => {
    if (requestsInFlight.current.has(input.requestId)) return;
    requestsInFlight.current.add(input.requestId);
    setPendingComments((previous) =>
      previous.map((entry) =>
        entry.input.requestId === input.requestId
          ? { ...entry, status: 'sending', error: undefined }
          : entry,
      ),
    );
    try {
      const savedComment = await onCreate(input);
      if (!mounted.current) return;
      setPendingComments((previous) =>
        previous.map((entry) =>
          entry.input.requestId === input.requestId
            ? {
                ...entry,
                status: 'confirmed',
                comment: savedComment ?? entry.comment,
              }
            : entry,
        ),
      );
    } catch (error) {
      if (!mounted.current) return;
      setPendingComments((previous) =>
        previous.map((entry) =>
          entry.input.requestId === input.requestId
            ? { ...entry, status: 'failed', error: readErrorText(error) }
            : entry,
        ),
      );
    } finally {
      requestsInFlight.current.delete(input.requestId);
    }
  };

  const create = async (input: DiscussionCreateInput) => {
    setPendingComments((previous) => [
      ...previous,
      {
        input,
        status: 'sending',
        comment: {
          id: `pending-${input.requestId}`,
          requestId: input.requestId,
          authorId: currentMemberId,
          parentCommentId: input.parentCommentId,
          createdAt: new Date().toISOString(),
          bodyV2: buildRichTextValue(input.markdown),
        },
      },
    ]);
    void persist(input);
  };

  const mergedComments = [
    ...comments,
    ...pendingComments
      .filter(
        (entry) =>
          !comments.some(
            (comment) =>
              comment.id === entry.comment.id ||
              comment.requestId === entry.input.requestId,
          ),
      )
      .map((entry) => entry.comment),
  ];
  const deliveryFor = (comment: IssueCommentRow) =>
    pendingComments.find(
      (entry) =>
        entry.comment.id === comment.id ||
        entry.input.requestId === comment.requestId,
    );

  return {
    comments: mergedComments,
    create,
    deliveryFor,
    retry: (entry: PendingComment) => {
      void persist(entry.input);
    },
  };
};
