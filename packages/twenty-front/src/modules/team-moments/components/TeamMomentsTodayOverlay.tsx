import { useMemo, useState } from 'react';
import { isDefined } from 'twenty-shared/utils';

import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { TeamMomentsTodayDialog } from '@/team-moments/components/TeamMomentsTodayDialog';
import { TEAM_MOMENTS_CELEBRATED_DAY_STORAGE_KEY_PREFIX } from '@/team-moments/constants/TeamMomentsCelebratedDayStorageKeyPrefix';
import {
  getTeamMomentsToday,
  type TeamMomentsMemberProfileRecord,
  type TeamMomentsTeamEventRecord,
} from '@/team-moments/utils/getTeamMomentsToday';
import { getTeamMomentsTodayIsoDate } from '@/team-moments/utils/getTeamMomentsTodayIsoDate';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

const MEMBER_PROFILE_OBJECT_NAME = 'memberProfile';
const TEAM_EVENT_OBJECT_NAME = 'teamEvent';
const QUERY_LIMIT = 500;

const readCelebratedDay = (storageKey: string) => {
  try {
    return localStorage.getItem(storageKey);
  } catch {
    return null;
  }
};

const writeCelebratedDay = (storageKey: string, isoDate: string) => {
  try {
    localStorage.setItem(storageKey, isoDate);
  } catch {
    // Without storage the popup simply shows again on the next load.
  }
};

const TeamMomentsTodayOverlayContent = ({
  currentWorkspaceMemberId,
}: {
  currentWorkspaceMemberId: string;
}) => {
  const todayIsoDate = useMemo(
    () => getTeamMomentsTodayIsoDate(new Date()),
    [],
  );
  const storageKey = `${TEAM_MOMENTS_CELEBRATED_DAY_STORAGE_KEY_PREFIX}${currentWorkspaceMemberId}`;
  const [isDismissed, setIsDismissed] = useState(
    () => readCelebratedDay(storageKey) === todayIsoDate,
  );

  const { records: memberProfiles, loading: isLoadingProfiles } =
    useFindManyRecords<ObjectRecord & TeamMomentsMemberProfileRecord>({
      objectNameSingular: MEMBER_PROFILE_OBJECT_NAME,
      recordGqlFields: {
        id: true,
        memberId: true,
        birthday: true,
        joinedAt: true,
        gender: true,
      },
      limit: QUERY_LIMIT,
      skip: isDismissed,
    });

  const { records: teamEvents, loading: isLoadingEvents } = useFindManyRecords<
    ObjectRecord & TeamMomentsTeamEventRecord
  >({
    objectNameSingular: TEAM_EVENT_OBJECT_NAME,
    recordGqlFields: {
      id: true,
      name: true,
      kind: true,
      date: true,
      isYearly: true,
      audience: true,
    },
    limit: QUERY_LIMIT,
    skip: isDismissed,
  });

  const moments = useMemo(
    () =>
      getTeamMomentsToday({
        todayIsoDate,
        memberProfiles,
        teamEvents,
      }),
    [todayIsoDate, memberProfiles, teamEvents],
  );

  if (
    isDismissed ||
    isLoadingProfiles ||
    isLoadingEvents ||
    moments.length === 0
  ) {
    return null;
  }

  const handleClose = () => {
    writeCelebratedDay(storageKey, todayIsoDate);
    setIsDismissed(true);
  };

  return (
    <TeamMomentsTodayDialog
      moments={moments}
      currentWorkspaceMemberId={currentWorkspaceMemberId}
      onClose={handleClose}
    />
  );
};

// Fireworks and a summary of today's occasions, once per member per day, on
// whatever page the member opens first. Renders nothing unless the Team
// Moments app is installed in the workspace.
export const TeamMomentsTodayOverlay = () => {
  const { objectMetadataItems } = useObjectMetadataItems();
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);

  const isTeamMomentsInstalled =
    objectMetadataItems.some(
      (item) => item.nameSingular === MEMBER_PROFILE_OBJECT_NAME,
    ) &&
    objectMetadataItems.some(
      (item) => item.nameSingular === TEAM_EVENT_OBJECT_NAME,
    );

  if (!isTeamMomentsInstalled || !isDefined(currentWorkspaceMember)) {
    return null;
  }

  return (
    <TeamMomentsTodayOverlayContent
      currentWorkspaceMemberId={currentWorkspaceMember.id}
    />
  );
};
