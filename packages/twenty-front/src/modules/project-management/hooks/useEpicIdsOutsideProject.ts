import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';

type EpicProjectRecord = {
  __typename: string;
  id: string;
  project: { id: string } | null;
};

// ponytail: fetches all epics and filters client-side rather than a server-side
// relation filter, since this dataset stays small (dev/demo scale)
export const useEpicIdsOutsideProject = ({
  projectId,
  skip,
}: {
  projectId: string | null | undefined;
  skip: boolean;
}) => {
  const { records: epics } = useFindManyRecords<EpicProjectRecord>({
    objectNameSingular: 'epic',
    recordGqlFields: { id: true, project: { id: true } },
    skip,
  });

  if (skip) {
    return [];
  }

  return epics
    .filter((epic) => epic.project?.id !== projectId)
    .map((epic) => epic.id);
};
