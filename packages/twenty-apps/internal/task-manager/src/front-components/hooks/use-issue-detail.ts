import { useCallback, useEffect, useState } from 'react';

import { ISSUE_DETAIL_ROUTE_PATH } from '../../constants/route-paths';
import {
  type EpicRow,
  type IssueRow,
  type IssueStatusRow,
  type SprintRow,
} from '../../types/task-manager-rows';
import {
  resolveSignedMarkdown,
  stripFileTokens,
} from '../../utils/resolve-signed-markdown.util';
import {
  type IssueViewSettings,
  readIssueViewSettings,
} from '../../utils/read-issue-view-settings.util';
import { postAppRoute } from '../utils/post-app-route.util';
import {
  type IssueAttachmentRow,
  readIssueAttachments,
} from '../utils/read-issue-attachments.util';
import { readErrorText } from '../utils/read-error-text.util';

type RichTextValue = { blocknote?: string | null; markdown?: string | null };

// The markdown the panels render, with live file URLs. When a refetch brings
// back the same body with only new tokens, the string already on screen is
// kept, so the host editor sees no change and does not reload the images.
const toDisplayedRichText = <TValue extends RichTextValue>(
  next: TValue | null | undefined,
  previous: RichTextValue | null | undefined,
): TValue | null | undefined => {
  if (next === null || next === undefined) {
    return next;
  }

  const markdown = resolveSignedMarkdown(next);
  const previousMarkdown = previous?.markdown;
  const isUnchanged =
    typeof previousMarkdown === 'string' &&
    stripFileTokens(previousMarkdown) === stripFileTokens(markdown);

  return { ...next, markdown: isUnchanged ? previousMarkdown : markdown };
};

export type IssueCommentRow = {
  id: string;
  authorId?: string | null;
  parentCommentId?: string | null;
  createdAt?: string | null;
  bodyV2?: { blocknote?: string | null; markdown?: string | null } | null;
};

export type WorklogRow = {
  id: string;
  description?: string | null;
  timeSpentMinutes?: number | null;
  startedAt?: string | null;
  memberId?: string | null;
};

export type IssueHistoryRow = {
  id: string;
  action?: string | null;
  fromStatusId?: string | null;
  toStatusId?: string | null;
  authorId?: string | null;
  createdAt?: string | null;
};

export type MemberRow = {
  id: string;
  name?: { firstName?: string | null; lastName?: string | null } | null;
  avatarUrl?: string | null;
  userEmail?: string | null;
};

export type LinkedIssueRow = {
  id: string;
  title?: string | null;
  issueKey?: string | null;
  statusId?: string | null;
  assigneeId?: string | null;
};

// A linked row the route could not shape into an id is not a row at all:
// the Subtasks widget keys everything off it.
const readLinkedIssue = (value: unknown): LinkedIssueRow | null => {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const { id, title, issueKey, statusId, assigneeId } =
    value as Record<string, unknown>;

  if (typeof id !== 'string') {
    return null;
  }

  return {
    id,
    title: typeof title === 'string' ? title : null,
    issueKey: typeof issueKey === 'string' ? issueKey : null,
    statusId: typeof statusId === 'string' ? statusId : null,
    assigneeId: typeof assigneeId === 'string' ? assigneeId : null,
  };
};

const readLinkedIssues = (value: unknown): LinkedIssueRow[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(readLinkedIssue)
    .filter((row): row is LinkedIssueRow => row !== null);
};

export type IssueDetail = {
  issue: IssueRow | null;
  issueComments: IssueCommentRow[];
  worklogs: WorklogRow[];
  issueHistories: IssueHistoryRow[];
  merchants: { id: string; name?: string | null }[];
  issueStatuses: IssueStatusRow[];
  sprints: SprintRow[];
  epics: EpicRow[];
  members: MemberRow[];
  // Assignee and owner options: members holding a grant on the issue's app,
  // resolved in the same round trip so the pickers never wait on a second one.
  assignableMembers: MemberRow[];
  parentIssue: LinkedIssueRow | null;
  childIssues: LinkedIssueRow[];
  attachments: IssueAttachmentRow[];
  currentWorkspaceMemberId: string | null;
  // Whether the caller may edit / delete this issue and its feed. False until
  // the route says otherwise, so nothing offers an edit it might refuse.
  canWrite: boolean;
  canSoftDelete: boolean;
  // The issue's project, as the Details panel labels it.
  project: { id: string; name: string | null; key: string | null } | null;
  // What the project shows in the Details panel and on board cards.
  issueViewSettings: IssueViewSettings;
  // The role's Manage Views: may change issueViewSettings for everyone.
  canManageViews: boolean;
};

const EMPTY_DETAIL: IssueDetail = {
  issue: null,
  issueComments: [],
  worklogs: [],
  issueHistories: [],
  merchants: [],
  issueStatuses: [],
  sprints: [],
  epics: [],
  members: [],
  assignableMembers: [],
  parentIssue: null,
  childIssues: [],
  attachments: [],
  currentWorkspaceMemberId: null,
  canWrite: false,
  canSoftDelete: false,
  project: null,
  issueViewSettings: readIssueViewSettings(null),
  canManageViews: false,
};

export const useIssueDetail = (issueId: string | null) => {
  const [data, setData] = useState<IssueDetail>(EMPTY_DETAIL);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (issueId === null) {
      setData(EMPTY_DETAIL);

      return;
    }

    try {
      const result = await postAppRoute<IssueDetail & { success: true }>(
        ISSUE_DETAIL_ROUTE_PATH,
        { issueId },
      );

      setData((previous) => ({
        issue:
          result.issue === null || result.issue === undefined
            ? null
            : {
                ...result.issue,
                description: toDisplayedRichText(
                  result.issue.description,
                  previous.issue?.id === result.issue.id
                    ? previous.issue.description
                    : null,
                ),
              },
        issueComments: (result.issueComments ?? []).map((comment) => ({
          ...comment,
          bodyV2: toDisplayedRichText(
            comment.bodyV2,
            previous.issueComments.find(
              (previousComment) => previousComment.id === comment.id,
            )?.bodyV2,
          ),
        })),
        worklogs: result.worklogs ?? [],
        issueHistories: result.issueHistories ?? [],
        merchants: result.merchants ?? [],
        issueStatuses: result.issueStatuses ?? [],
        sprints: result.sprints ?? [],
        epics: result.epics ?? [],
        members: result.members ?? [],
        assignableMembers: result.assignableMembers ?? [],
        parentIssue: readLinkedIssue(result.parentIssue),
        childIssues: readLinkedIssues(result.childIssues),
        attachments: readIssueAttachments(result.issue?.files),
        currentWorkspaceMemberId: result.currentWorkspaceMemberId ?? null,
        canWrite: result.canWrite === true,
        canSoftDelete: result.canSoftDelete === true,
        project: result.project ?? null,
        issueViewSettings: readIssueViewSettings(result.issueViewSettings),
        canManageViews: result.canManageViews === true,
      }));
      setLoadError(null);
    } catch (error) {
      setLoadError(readErrorText(error));
    }
  }, [issueId]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      // Dropped before the fetch, not after it: while another issue is loading
      // the panel has to be able to tell "nothing yet" from "the record I am
      // showing", and the callers distinguish the two by `issue === null`. A
      // reload that fails in the background then keeps the record on screen
      // instead of replacing the whole panel with an error.
      setData(EMPTY_DETAIL);
      await reload();
      setIsLoading(false);
    };

    void load();
  }, [reload]);

  return { data, isLoading, loadError, reload };
};
