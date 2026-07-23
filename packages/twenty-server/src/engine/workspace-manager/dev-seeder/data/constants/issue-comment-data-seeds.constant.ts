import { ISSUE_DATA_SEED_IDS } from 'src/engine/workspace-manager/dev-seeder/data/constants/issue-data-seeds.constant';
import { WORKSPACE_MEMBER_DATA_SEED_IDS } from 'src/engine/workspace-manager/dev-seeder/data/constants/workspace-member-data-seeds.constant';

type IssueCommentDataSeed = {
  id: string;
  position: number;
  bodyV2Blocknote: string;
  bodyV2Markdown: string;
  issueId: string;
  authorId: string;
  createdBySource: string;
  createdByWorkspaceMemberId: string;
  createdByName: string;
  updatedBySource: string;
  updatedByWorkspaceMemberId: string;
  updatedByName: string;
};

export const ISSUE_COMMENT_DATA_SEED_COLUMNS: (keyof IssueCommentDataSeed)[] = [
  'id',
  'position',
  'bodyV2Blocknote',
  'bodyV2Markdown',
  'issueId',
  'authorId',
  'createdBySource',
  'createdByWorkspaceMemberId',
  'createdByName',
  'updatedBySource',
  'updatedByWorkspaceMemberId',
  'updatedByName',
];

export const ISSUE_COMMENT_DATA_SEED_IDS = {
  ID_1: '77777773-0001-4e7c-8001-123456789abc',
  ID_2: '77777773-0002-4e7c-8001-123456789abc',
  ID_3: '77777773-0003-4e7c-8001-123456789abc',
  ID_4: '77777773-0004-4e7c-8001-123456789abc',
  ID_5: '77777773-0005-4e7c-8001-123456789abc',
  ID_6: '77777773-0006-4e7c-8001-123456789abc',
};

const { TIM, JONY, PHIL, JANE } = WORKSPACE_MEMBER_DATA_SEED_IDS;

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

const BUILD_CREATED_UPDATED_BY = (workspaceMemberId: string, name: string) => ({
  createdBySource: 'MANUAL',
  createdByWorkspaceMemberId: workspaceMemberId,
  createdByName: name,
  updatedBySource: 'MANUAL',
  updatedByWorkspaceMemberId: workspaceMemberId,
  updatedByName: name,
});

export const ISSUE_COMMENT_DATA_SEEDS: IssueCommentDataSeed[] = [
  {
    id: ISSUE_COMMENT_DATA_SEED_IDS.ID_1,
    position: 1,
    bodyV2Blocknote: BUILD_BLOCKNOTE_BODY(
      'Nav bar looks great, ready to merge.',
    ),
    bodyV2Markdown: 'Nav bar looks great, ready to merge.',
    issueId: ISSUE_DATA_SEED_IDS.ID_2,
    authorId: TIM,
    ...BUILD_CREATED_UPDATED_BY(TIM, 'Tim Apple'),
  },
  {
    id: ISSUE_COMMENT_DATA_SEED_IDS.ID_2,
    position: 1,
    bodyV2Blocknote: BUILD_BLOCKNOTE_BODY(
      "Let's use the new brand color for the hero background.",
    ),
    bodyV2Markdown: "Let's use the new brand color for the hero background.",
    issueId: ISSUE_DATA_SEED_IDS.ID_3,
    authorId: JONY,
    ...BUILD_CREATED_UPDATED_BY(JONY, 'Jony Ive'),
  },
  {
    id: ISSUE_COMMENT_DATA_SEED_IDS.ID_3,
    position: 1,
    bodyV2Blocknote: BUILD_BLOCKNOTE_BODY(
      'Confirmed this happens only in Safari.',
    ),
    bodyV2Markdown: 'Confirmed this happens only in Safari.',
    issueId: ISSUE_DATA_SEED_IDS.ID_5,
    authorId: JANE,
    ...BUILD_CREATED_UPDATED_BY(JANE, 'Jane Austen'),
  },
  {
    id: ISSUE_COMMENT_DATA_SEED_IDS.ID_4,
    position: 1,
    bodyV2Blocknote: BUILD_BLOCKNOTE_BODY(
      'Welcome screens approved by design team.',
    ),
    bodyV2Markdown: 'Welcome screens approved by design team.',
    issueId: ISSUE_DATA_SEED_IDS.ID_8,
    authorId: JONY,
    ...BUILD_CREATED_UPDATED_BY(JONY, 'Jony Ive'),
  },
  {
    id: ISSUE_COMMENT_DATA_SEED_IDS.ID_5,
    position: 1,
    bodyV2Blocknote: BUILD_BLOCKNOTE_BODY(
      'Please add analytics tracking to the opt-in toggle.',
    ),
    bodyV2Markdown: 'Please add analytics tracking to the opt-in toggle.',
    issueId: ISSUE_DATA_SEED_IDS.ID_9,
    authorId: JONY,
    ...BUILD_CREATED_UPDATED_BY(JONY, 'Jony Ive'),
  },
  {
    id: ISSUE_COMMENT_DATA_SEED_IDS.ID_6,
    position: 1,
    bodyV2Blocknote: BUILD_BLOCKNOTE_BODY(
      'Reproduced on iOS 17, stack trace attached.',
    ),
    bodyV2Markdown: 'Reproduced on iOS 17, stack trace attached.',
    issueId: ISSUE_DATA_SEED_IDS.ID_10,
    authorId: PHIL,
    ...BUILD_CREATED_UPDATED_BY(PHIL, 'Phil Schiler'),
  },
];
