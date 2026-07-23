import { WORKSPACE_MEMBER_DATA_SEED_IDS } from 'src/engine/workspace-manager/dev-seeder/data/constants/workspace-member-data-seeds.constant';

type ProjectDataSeed = {
  id: string;
  position: number;
  name: string;
  key: string;
  nextIssueNumber: number;
  descriptionBlocknote: string;
  descriptionMarkdown: string;
  category: string;
  leadId: string;
  createdBySource: string;
  createdByWorkspaceMemberId: string;
  createdByName: string;
  updatedBySource: string;
  updatedByWorkspaceMemberId: string;
  updatedByName: string;
};

export const PROJECT_DATA_SEED_COLUMNS: (keyof ProjectDataSeed)[] = [
  'id',
  'position',
  'name',
  'key',
  'nextIssueNumber',
  'descriptionBlocknote',
  'descriptionMarkdown',
  'category',
  'leadId',
  'createdBySource',
  'createdByWorkspaceMemberId',
  'createdByName',
  'updatedBySource',
  'updatedByWorkspaceMemberId',
  'updatedByName',
];

export const PROJECT_DATA_SEED_IDS = {
  ID_1: '77777770-0001-4e7c-8001-123456789abc',
  ID_2: '77777770-0002-4e7c-8001-123456789abc',
};

const BUILD_BLOCKNOTE_BODY = (text: string): string =>
  JSON.stringify([
    {
      id: 'block-1',
      type: 'paragraph',
      props: {
        textColor: 'default',
        backgroundColor: 'default',
        textAlignment: 'left',
      },
      content: [{ type: 'text', text, styles: {} }],
      children: [],
    },
  ]);

export const PROJECT_DATA_SEEDS: ProjectDataSeed[] = [
  {
    id: PROJECT_DATA_SEED_IDS.ID_1,
    position: 1,
    name: 'Website Revamp',
    key: 'WEB',
    nextIssueNumber: 7,
    descriptionBlocknote: BUILD_BLOCKNOTE_BODY(
      'Redesign the marketing website and improve conversion.',
    ),
    descriptionMarkdown:
      'Redesign the marketing website and improve conversion.',
    category: 'SOFTWARE',
    leadId: WORKSPACE_MEMBER_DATA_SEED_IDS.TIM,
    createdBySource: 'MANUAL',
    createdByWorkspaceMemberId: WORKSPACE_MEMBER_DATA_SEED_IDS.TIM,
    createdByName: 'Tim A',
    updatedBySource: 'MANUAL',
    updatedByWorkspaceMemberId: WORKSPACE_MEMBER_DATA_SEED_IDS.TIM,
    updatedByName: 'Tim A',
  },
  {
    id: PROJECT_DATA_SEED_IDS.ID_2,
    position: 2,
    name: 'Mobile App',
    key: 'MOB',
    nextIssueNumber: 7,
    descriptionBlocknote: BUILD_BLOCKNOTE_BODY(
      'Native mobile app for iOS and Android.',
    ),
    descriptionMarkdown: 'Native mobile app for iOS and Android.',
    category: 'SOFTWARE',
    leadId: WORKSPACE_MEMBER_DATA_SEED_IDS.JONY,
    createdBySource: 'MANUAL',
    createdByWorkspaceMemberId: WORKSPACE_MEMBER_DATA_SEED_IDS.JONY,
    createdByName: 'Jony Ive',
    updatedBySource: 'MANUAL',
    updatedByWorkspaceMemberId: WORKSPACE_MEMBER_DATA_SEED_IDS.JONY,
    updatedByName: 'Jony Ive',
  },
];
