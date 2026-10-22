import { useCallback, useEffect, useState } from 'react';
import { useUserId } from 'twenty-sdk/front-component';

import { type MemberSummary, type PollRow } from '../../types/moments-records';
import { listRecords, readErrorText } from '../utils/moments-rest.util';

type WorkspaceMemberRecord = {
  id: string;
  userId: string | null;
  userEmail: string | null;
  avatarUrl: string | null;
  name: { firstName?: string | null; lastName?: string | null } | null;
};

const formatName = (name: WorkspaceMemberRecord['name']): string =>
  [name?.firstName, name?.lastName].filter((part) => (part ?? '').trim().length > 0).join(' ').trim();

export const usePollsData = () => {
  const userId = useUserId();
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [polls, setPolls] = useState<PollRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const [memberRows, pollRows] = await Promise.all([
        listRecords<WorkspaceMemberRecord>('workspaceMembers', { limit: 500 }),
        listRecords<PollRow>('polls', { limit: 200 }),
      ]);

      setMembers(
        memberRows.map((member) => ({
          id: member.id,
          name: formatName(member.name) || member.userEmail || 'Thành viên',
          email: member.userEmail,
          avatarUrl: member.avatarUrl,
        })),
      );
      setCurrentMemberId(memberRows.find((member) => member.userId === userId)?.id ?? null);
      setPolls([...pollRows].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setError(null);
    } catch (loadError) {
      setError(readErrorText(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { members, polls, currentMemberId, isLoading, error, reload };
};

export type PollsData = ReturnType<typeof usePollsData>;
