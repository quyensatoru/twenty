import { useCallback, useEffect, useState } from 'react';

import { ISSUE_DETAIL_ROUTE_PATH } from '../../constants/route-paths';
import {
  type EpicRow,
  type IssueRow,
  type IssueStatusRow,
  type SprintRow,
} from '../../types/task-manager-rows';
import { postAppRoute } from '../utils/post-app-route.util';
import { readErrorText } from '../utils/read-error-text.util';

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

type IssueDetail = {
  issue: IssueRow | null;
  issueComments: IssueCommentRow[];
  worklogs: WorklogRow[];
  issueHistories: IssueHistoryRow[];
  merchants: { id: string; name?: string | null }[];
  issueStatuses: IssueStatusRow[];
  sprints: SprintRow[];
  epics: EpicRow[];
  members: MemberRow[];
  currentWorkspaceMemberId: string | null;
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
  currentWorkspaceMemberId: null,
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

      setData({
        issue: result.issue ?? null,
        issueComments: result.issueComments ?? [],
        worklogs: result.worklogs ?? [],
        issueHistories: result.issueHistories ?? [],
        merchants: result.merchants ?? [],
        issueStatuses: result.issueStatuses ?? [],
        sprints: result.sprints ?? [],
        epics: result.epics ?? [],
        members: result.members ?? [],
        currentWorkspaceMemberId: result.currentWorkspaceMemberId ?? null,
      });
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
