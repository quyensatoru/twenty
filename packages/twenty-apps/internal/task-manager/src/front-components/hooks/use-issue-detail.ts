import { useCallback, useEffect, useState } from 'react';

import { ISSUE_DETAIL_ROUTE_PATH } from '../../constants/route-paths';
import {
  type IssueRow,
  type IssueStatusRow,
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

export type MemberRow = {
  id: string;
  name?: { firstName?: string | null; lastName?: string | null } | null;
  avatarUrl?: string | null;
};

type IssueDetail = {
  issue: IssueRow | null;
  issueComments: IssueCommentRow[];
  worklogs: WorklogRow[];
  merchants: { id: string; name?: string | null }[];
  issueStatuses: IssueStatusRow[];
  members: MemberRow[];
  currentWorkspaceMemberId: string | null;
};

const EMPTY_DETAIL: IssueDetail = {
  issue: null,
  issueComments: [],
  worklogs: [],
  merchants: [],
  issueStatuses: [],
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
        merchants: result.merchants ?? [],
        issueStatuses: result.issueStatuses ?? [],
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
      await reload();
      setIsLoading(false);
    };

    void load();
  }, [reload]);

  return { data, isLoading, loadError, reload };
};
