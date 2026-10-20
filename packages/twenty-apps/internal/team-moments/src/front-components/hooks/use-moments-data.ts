import { useCallback, useEffect, useMemo, useState } from 'react';
import { useUserId } from 'twenty-sdk/front-component';

import {
  type MemberProfileRow,
  type MemberSummary,
  type TeamEventRow,
} from '../../types/moments-records';
import { buildOccurrences } from '../../utils/build-occurrences.util';
import { getTodayIct } from '../../utils/moments-date.util';
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

export const useMomentsData = () => {
  const userId = useUserId();
  const [members, setMembers] = useState<(MemberSummary & { userId: string | null })[]>([]);
  const [profiles, setProfiles] = useState<MemberProfileRow[]>([]);
  const [events, setEvents] = useState<TeamEventRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const [memberRows, profileRows, eventRows] = await Promise.all([
        listRecords<WorkspaceMemberRecord>('workspaceMembers', { limit: 500 }),
        listRecords<MemberProfileRow>('memberProfiles', { limit: 500 }),
        listRecords<TeamEventRow>('teamEvents', { limit: 500 }),
      ]);

      setMembers(
        memberRows.map((member) => ({
          id: member.id,
          userId: member.userId,
          name: formatName(member.name) || member.userEmail || 'Thành viên',
          email: member.userEmail,
          avatarUrl: member.avatarUrl,
        })),
      );
      setProfiles(profileRows);
      setEvents(eventRows);
      setError(null);
    } catch (loadError) {
      setError(readErrorText(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Recomputed when the ICT day changes, so a page left open overnight rolls
  // over to the new day's countdowns.
  const [todayIso, setTodayIso] = useState(() => getTodayIct(new Date()));

  useEffect(() => {
    const timer = setInterval(() => setTodayIso(getTodayIct(new Date())), 60_000);

    return () => clearInterval(timer);
  }, []);

  const memberNames = useMemo(
    () => Object.fromEntries(members.map((member) => [member.id, member.name])),
    [members],
  );

  const occurrences = useMemo(
    () => buildOccurrences({ todayIso, profiles, events, memberNames }),
    [todayIso, profiles, events, memberNames],
  );

  const currentMember = members.find((member) => member.userId === userId) ?? null;

  return {
    members,
    memberNames,
    profiles,
    events,
    occurrences,
    todayIso,
    currentMember,
    isLoading,
    error,
    reload,
  };
};

export type MomentsData = ReturnType<typeof useMomentsData>;
