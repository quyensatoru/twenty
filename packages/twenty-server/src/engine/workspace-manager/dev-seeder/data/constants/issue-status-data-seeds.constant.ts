import { PROJECT_DATA_SEED_IDS } from 'src/engine/workspace-manager/dev-seeder/data/constants/project-data-seeds.constant';

type IssueStatusDataSeed = {
  id: string;
  position: number;
  name: string;
  color: string;
  category: string;
  projectId: string;
};

export const ISSUE_STATUS_DATA_SEED_COLUMNS: (keyof IssueStatusDataSeed)[] = [
  'id',
  'position',
  'name',
  'color',
  'category',
  'projectId',
];

// Direct port of the old global Issue.status SELECT options - each seed
// project now gets its own copy of these 5 statuses as real IssueStatus
// records, matching what project.createOne seeds for real projects.
const DEFAULT_ISSUE_STATUSES = [
  { legacyValue: 'BACKLOG', name: 'Backlog', color: 'gray', category: 'UNSTARTED' },
  { legacyValue: 'TODO', name: 'Todo', color: 'sky', category: 'UNSTARTED' },
  {
    legacyValue: 'IN_PROGRESS',
    name: 'In Progress',
    color: 'purple',
    category: 'STARTED',
  },
  {
    legacyValue: 'IN_REVIEW',
    name: 'In Review',
    color: 'orange',
    category: 'STARTED',
  },
  { legacyValue: 'DONE', name: 'Done', color: 'green', category: 'DONE' },
] as const;

type LegacyIssueStatusValue = (typeof DEFAULT_ISSUE_STATUSES)[number]['legacyValue'];

const SEED_PROJECT_IDS = [PROJECT_DATA_SEED_IDS.ID_1, PROJECT_DATA_SEED_IDS.ID_2];

const buildIssueStatusId = (projectIndex: number, statusIndex: number): string =>
  `77777776-${projectIndex}${statusIndex}00-4e7c-8001-123456789abc`;

export const ISSUE_STATUS_DATA_SEEDS: IssueStatusDataSeed[] =
  SEED_PROJECT_IDS.flatMap((projectId, projectIndex) =>
    DEFAULT_ISSUE_STATUSES.map((status, statusIndex) => ({
      id: buildIssueStatusId(projectIndex, statusIndex),
      position: statusIndex,
      name: status.name,
      color: status.color,
      category: status.category,
      projectId,
    })),
  );

// Resolves the seeded IssueStatus id for a given project + legacy string
// value, so ISSUE_DATA_SEEDS can point issues at a real statusId.
export const getIssueStatusDataSeedId = (
  projectId: string,
  legacyValue: LegacyIssueStatusValue,
): string => {
  const projectIndex = SEED_PROJECT_IDS.indexOf(projectId);
  const statusIndex = DEFAULT_ISSUE_STATUSES.findIndex(
    (status) => status.legacyValue === legacyValue,
  );

  return buildIssueStatusId(projectIndex, statusIndex);
};
