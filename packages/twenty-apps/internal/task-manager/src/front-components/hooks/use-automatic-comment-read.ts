import { useEffect, useRef } from 'react';

import { type DiscussionReadState } from './use-discussion-state';
import { type IssueCommentRow } from './use-issue-detail';
import { hasReadComment } from '../utils/has-read-comment.util';

const READ_DWELL_MS = 2000;
const VISIBILITY_CHECK_MS = 250;
const FAILED_READ_RETRY_MS = 10000;

type AutomaticCommentReadInput = {
  comments: IssueCommentRow[];
  readStates: DiscussionReadState[];
  currentMemberId: string | null;
  onRead?: (commentIds: string[]) => Promise<void> | void;
};

const isCommentVisible = (element: HTMLElement): boolean => {
  const rectangle = element.getBoundingClientRect();
  if (rectangle.width <= 0 || rectangle.height <= 0) return false;
  let top = 0;
  let bottom = window.innerHeight;
  let left = 0;
  let right = window.innerWidth;
  for (
    let parent = element.parentElement;
    parent !== null &&
    parent !== document.body &&
    parent !== document.documentElement;
    parent = parent.parentElement
  ) {
    if (parent.clientHeight > 0 && parent.scrollHeight > parent.clientHeight) {
      const parentRectangle = parent.getBoundingClientRect();
      top = Math.max(top, parentRectangle.top);
      bottom = Math.min(bottom, parentRectangle.bottom);
      left = Math.max(left, parentRectangle.left);
      right = Math.min(right, parentRectangle.right);
    }
  }
  if (bottom <= top || right <= left) return false;
  const visibleHeight =
    Math.min(bottom, rectangle.bottom) - Math.max(top, rectangle.top);
  const visibleWidth =
    Math.min(right, rectangle.right) - Math.max(left, rectangle.left);
  return (
    visibleWidth > 0 &&
    visibleHeight >= Math.min(rectangle.height * 0.6, (bottom - top) * 0.6)
  );
};

export const useAutomaticCommentRead = (input: AutomaticCommentReadInput) => {
  const inputRef = useRef(input);
  inputRef.current = input;
  const elements = useRef(new Map<string, HTMLElement>());
  const elementCallbacks = useRef(
    new Map<string, (element: HTMLDivElement | null) => void>(),
  );

  useEffect(() => {
    const visibleSince = new Map<string, number>();
    const acknowledged = new Set<string>();
    const retryAfter = new Map<string, number>();
    let disposed = false;
    let previousTick = Date.now();
    const check = () => {
      const now = Date.now();
      const current = inputRef.current;
      if (
        document.visibilityState === 'hidden' ||
        (typeof document.hasFocus === 'function' && !document.hasFocus()) ||
        now - previousTick > VISIBILITY_CHECK_MS * 4
      )
        visibleSince.clear();
      previousTick = now;
      if (
        current.currentMemberId === null ||
        current.onRead === undefined ||
        document.visibilityState === 'hidden' ||
        (typeof document.hasFocus === 'function' && !document.hasFocus())
      )
        return;
      const dueCommentIds: string[] = [];
      for (const comment of current.comments) {
        if (
          comment.authorId === current.currentMemberId ||
          hasReadComment(
            current.readStates,
            current.currentMemberId,
            comment,
          ) ||
          acknowledged.has(comment.id) ||
          (retryAfter.get(comment.id) ?? 0) > now
        )
          continue;
        const element = elements.current.get(comment.id);
        if (element === undefined || !isCommentVisible(element)) {
          visibleSince.delete(comment.id);
          continue;
        }
        const startedAt = visibleSince.get(comment.id) ?? now;
        visibleSince.set(comment.id, startedAt);
        if (now - startedAt < READ_DWELL_MS) continue;
        acknowledged.add(comment.id);
        dueCommentIds.push(comment.id);
      }
      if (dueCommentIds.length === 0) return;
      // One route call per tick: each call runs in its own server process.
      void Promise.resolve()
        .then(() => current.onRead?.(dueCommentIds))
        .catch(() => {
          if (disposed) return;
          const retryAt = Date.now() + FAILED_READ_RETRY_MS;
          for (const commentId of dueCommentIds) {
            acknowledged.delete(commentId);
            visibleSince.delete(commentId);
            retryAfter.set(commentId, retryAt);
          }
        });
    };
    check();
    const interval = setInterval(check, VISIBILITY_CHECK_MS);
    return () => {
      disposed = true;
      clearInterval(interval);
    };
  }, []);

  return (commentId: string) => {
    let callback = elementCallbacks.current.get(commentId);
    if (callback === undefined) {
      callback = (element) => {
        if (element === null) elements.current.delete(commentId);
        else elements.current.set(commentId, element);
      };
      elementCallbacks.current.set(commentId, callback);
    }
    return callback;
  };
};
