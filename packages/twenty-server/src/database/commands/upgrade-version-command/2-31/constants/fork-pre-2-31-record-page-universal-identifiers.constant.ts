import {
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  STANDARD_OBJECTS,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-shared/metadata';

// Fork-only counterpart of the upstream pre-2.31 literals: the task-manager,
// merchant and shift record pages shipped with hardcoded identifiers before
// they moved to the derived scheme, so the 2-31 reconcile and every command
// registered before it need the literals to find the rows already stored in
// existing workspaces. Frozen: never mutate these values.
export const FORK_PRE_2_31_RECORD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER_BY_OBJECT_UNIVERSAL_IDENTIFIER: Record<
  string,
  string
> = {
  [STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.project]: '1b1204ab-f0ca-41aa-ac9f-2174d85af3ec',
  [STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.sprint]: 'd43665dc-d6e6-4521-9f8f-9473b37c5334',
  [STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.epic]: 'ab505298-a470-46e4-813e-5a552fe26eed',
  [STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.issue]: '54851c38-c3f6-4853-a40e-18e942e97e55',
  [STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.issueComment]: '57108a33-5331-4a0b-9649-171d0bfd4d40',
  [STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.worklog]: '07b7478a-ac07-42f2-b551-31f5f7a84f32',
  [STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.shiftTemplate]: '93448a17-a03a-4de2-9174-d0f811ee83f7',
  [STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.specialDay]: 'd5ee38ca-a2fe-408e-b71d-6673d48dd74b',
  [STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.shift]: '7bcd575f-feb9-43a3-b492-33333a734cf5',
  [STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.merchant]: '41a5a300-b048-4aba-8709-b45cc2c394d7',
};

export const FORK_PRE_2_31_RECORD_PAGE_UNIVERSAL_IDENTIFIER_BY_DERIVED: Record<
  string,
  string
> = {
  [STANDARD_OBJECTS.project.views.projectRecordPageFields.universalIdentifier]: '96e24b69-a724-4dfa-aa0f-d3e3d903ff26',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.projectRecordPage.universalIdentifier]: '1b1204ab-f0ca-41aa-ac9f-2174d85af3ec',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.projectRecordPage.tabs.home.universalIdentifier]: 'f6ca20a1-9f20-4dd4-aa7b-4f2c0598eae6',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.projectRecordPage.tabs.home.widgets.fields.universalIdentifier]: 'b187d9cf-2416-4e6f-a43e-0599880c6bde',
  [STANDARD_OBJECTS.sprint.views.sprintRecordPageFields.universalIdentifier]: '1dff7b19-4859-4298-b9ea-f9ee8a9832c7',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.sprintRecordPage.universalIdentifier]: 'd43665dc-d6e6-4521-9f8f-9473b37c5334',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.sprintRecordPage.tabs.home.universalIdentifier]: '448fc205-52a6-4e68-868a-6fb5e672cf66',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.sprintRecordPage.tabs.home.widgets.fields.universalIdentifier]: '874c7912-618b-412e-a84e-3c0ecba72910',
  [STANDARD_OBJECTS.epic.views.epicRecordPageFields.universalIdentifier]: '8c2c40a5-5f77-4cde-bf32-8e7b7cb4ff6d',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.epicRecordPage.universalIdentifier]: 'ab505298-a470-46e4-813e-5a552fe26eed',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.epicRecordPage.tabs.home.universalIdentifier]: '1384251a-9ce2-4850-9502-f14a6bb5a058',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.epicRecordPage.tabs.home.widgets.fields.universalIdentifier]: 'f953d36c-5086-4d0d-b259-5268800b10d3',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.epicRecordPage.tabs.timeline.universalIdentifier]: '9ed67505-a5ff-4742-9ff3-e760170c0d86',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.epicRecordPage.tabs.timeline.widgets.timeline.universalIdentifier]: 'd8aa7c29-0d36-4e3e-baf1-9c2643950d0b',
  [STANDARD_OBJECTS.issue.views.issueRecordPageFields.universalIdentifier]: '0c1496d8-f692-44fc-bfae-5827943ae4f8',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.issueRecordPage.universalIdentifier]: '54851c38-c3f6-4853-a40e-18e942e97e55',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.issueRecordPage.tabs.home.universalIdentifier]: 'c133e103-4229-47f9-b977-993d4e7d8555',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.issueRecordPage.tabs.home.widgets.fields.universalIdentifier]: '5d8b1f0f-d3ad-4b66-89b5-b81b7b92608c',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.issueRecordPage.tabs.timeline.universalIdentifier]: '9dd0bd67-8d35-4e23-b07c-0583e7b0b197',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.issueRecordPage.tabs.timeline.widgets.timeline.universalIdentifier]: '4b77d8d2-6464-45a8-9497-7cdb94ce908d',
  [STANDARD_OBJECTS.issueComment.views.issueCommentRecordPageFields.universalIdentifier]: 'c134b7b4-7a64-409f-9bb0-5ec4ead9c8fe',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.issueCommentRecordPage.universalIdentifier]: '57108a33-5331-4a0b-9649-171d0bfd4d40',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.issueCommentRecordPage.tabs.home.universalIdentifier]: '8c5e17d3-96b6-4857-84df-fad20de3d4d4',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.issueCommentRecordPage.tabs.home.widgets.fields.universalIdentifier]: '083d7abc-b699-4e64-b65f-f595b0f780da',
  [STANDARD_OBJECTS.worklog.views.worklogRecordPageFields.universalIdentifier]: '6dd98746-e30f-4598-9c01-53595bad2b5b',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.worklogRecordPage.universalIdentifier]: '07b7478a-ac07-42f2-b551-31f5f7a84f32',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.worklogRecordPage.tabs.home.universalIdentifier]: 'e59f540d-fc58-4f4b-b47f-b37b31149b51',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.worklogRecordPage.tabs.home.widgets.fields.universalIdentifier]: '26181cd9-cbeb-4f5e-9ef2-2b8ae51771c5',
  [STANDARD_OBJECTS.shiftTemplate.views.shiftTemplateRecordPageFields.universalIdentifier]: 'ed7e1a4e-9540-4dfb-8d1e-0943a9040b1f',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.shiftTemplateRecordPage.universalIdentifier]: '93448a17-a03a-4de2-9174-d0f811ee83f7',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.shiftTemplateRecordPage.tabs.home.universalIdentifier]: 'b2ca63c9-df6f-4744-bd18-7f131a24cd7a',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.shiftTemplateRecordPage.tabs.home.widgets.fields.universalIdentifier]: 'ad0bdb63-f170-4fdb-885f-a5f317829f68',
  [STANDARD_OBJECTS.specialDay.views.specialDayRecordPageFields.universalIdentifier]: 'be66aa00-a0c4-46a7-81c2-5bbb4cd5abcc',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.specialDayRecordPage.universalIdentifier]: 'd5ee38ca-a2fe-408e-b71d-6673d48dd74b',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.specialDayRecordPage.tabs.home.universalIdentifier]: '71698c40-9e46-4bc6-a782-1b9b6dee3f15',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.specialDayRecordPage.tabs.home.widgets.fields.universalIdentifier]: '7e7a231c-74ca-46d4-9332-fbad34d229ef',
  [STANDARD_OBJECTS.shift.views.shiftRecordPageFields.universalIdentifier]: '735d170d-641e-4aad-a7bb-d326051c7f04',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.shiftRecordPage.universalIdentifier]: '7bcd575f-feb9-43a3-b492-33333a734cf5',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.shiftRecordPage.tabs.home.universalIdentifier]: '7fccd49a-53e4-4cf8-936e-0d11bdd78220',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.shiftRecordPage.tabs.home.widgets.fields.universalIdentifier]: '1af603c5-71a4-42bc-b057-0e94309cab48',
  [STANDARD_OBJECTS.merchant.views.merchantRecordPageFields.universalIdentifier]: '58e3910e-f640-498a-b9db-932459bc9e64',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.merchantRecordPage.universalIdentifier]: '41a5a300-b048-4aba-8709-b45cc2c394d7',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.merchantRecordPage.tabs.home.universalIdentifier]: 'eb3851ec-a8ac-497f-b9d1-fb9ffbed0919',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.merchantRecordPage.tabs.home.widgets.fields.universalIdentifier]: 'f846ce25-18c2-4e7d-94ec-087ddde09396',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.merchantRecordPage.tabs.timeline.universalIdentifier]: 'd78224b7-c09c-49b2-b9d1-4eaf6d62e978',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.merchantRecordPage.tabs.timeline.widgets.timeline.universalIdentifier]: '0dcbd900-cb34-4bba-8597-a511f2f788b0',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.merchantRecordPage.tabs.tasks.universalIdentifier]: 'ae2a3830-0503-4573-b0e7-c8a58cde7334',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.merchantRecordPage.tabs.tasks.widgets.tasks.universalIdentifier]: 'bca6819d-53d3-4d6c-afa3-e4edc9205fee',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.merchantRecordPage.tabs.notes.universalIdentifier]: 'f4e56c49-a12b-4b3a-8918-031b162c115f',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.merchantRecordPage.tabs.notes.widgets.notes.universalIdentifier]: '9c324267-9e20-4b98-91d3-a5dba740ad27',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.merchantRecordPage.tabs.files.universalIdentifier]: 'c4835f3b-128c-4f16-86d8-c50db38d494d',
  [STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.merchantRecordPage.tabs.files.widgets.files.universalIdentifier]: 'a22110f2-1cfc-4987-b4db-d15af445673e',
};
