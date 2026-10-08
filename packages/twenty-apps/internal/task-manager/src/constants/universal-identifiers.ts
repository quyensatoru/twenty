// Every universalIdentifier this app declares, in one place: a duplicate or a
// typo silently creates a second entity on install instead of updating the
// existing one. Never change a value after the first sync.
//
// The object and field identifiers below are copied VERBATIM from the fork
// where these were standard objects (twenty-shared/src/metadata/constants/
// standard-object-universal-identifiers.constant.ts and
// standard-object-fields.constant.ts). Identity is (workspaceId,
// universalIdentifier), so reusing them is what turns the production
// migration into a re-parent instead of a rebuild.

export const APPLICATION_UID = '819550d5-882b-4b96-8afd-b02e0d2b41c1';
export const APP_RUNTIME_ROLE_UID = '3a405c7a-1416-4383-a531-337017193cce';

// Standard object of upstream Twenty — referenced, never redeclared.
export const WORKSPACE_MEMBER_OBJECT_UID =
  '20202020-3319-4234-a34c-82d5c0e881a6';

export const APP_OBJECT_UID = '4d71d304-ea37-457c-9422-48812659d75e';
export const APP_NAME_FIELD_UID = '0b606e4c-6db6-45f8-90b0-4a1ab763115e';
export const APP_FIELD_SCHEMA_FIELD_UID =
  '33cdb6b1-afbb-4074-a695-996956e49cab';
export const APP_PROJECTS_FIELD_UID = 'feaf1e72-565a-4e98-a501-547e03dcf70b';
export const APP_APP_ACCESSES_FIELD_UID =
  'b045db21-0fa7-4ebd-89be-15d3882aa060';

export const APP_ACCESS_OBJECT_UID = '467cc684-c385-4536-bd9a-dfdf80c2d60f';
export const APP_ACCESS_MEMBER_FIELD_UID =
  'b8791f54-d5c3-4ea8-b050-5807a1867403';
export const APP_ACCESS_APP_FIELD_UID = '5acf2ea8-1d2d-4c54-a9ec-9109563e0d37';
export const APP_ACCESS_PERMISSIONS_FIELD_UID =
  'fd277f1c-807f-4845-a895-e5f1d45d2036';

// `merchant` belongs to the customer-support app now. This app keeps the id
// because it still owns fields ON that object — the app relation and the
// issue junction — the same way merchant-email-campaigns owns its own.
export const MERCHANT_OBJECT_UID = '5d9a58bd-983c-4ca4-9f0a-b53cdec4cfca';
export const MERCHANT_ISSUES_FIELD_UID =
  'bbdb64fd-f399-45b0-bf07-8c913e52ed73';
// `merchant.app` moved to customer-support with the object. Referenced, never
// redeclared: the member role scopes merchants by it, and a predicate names a
// field by identifier whoever owns it.
export const MERCHANT_APP_FIELD_UID = '050c5e37-f2b2-452f-84f3-6d9396ccfbe4';
// The upload target a FILE custom setting names. `uploadFileByHandle` has to
// file every upload against a real FILES field — there is no anonymous store —
// so merchants get one of their own rather than borrowing issue.attachments.
export const MERCHANT_CUSTOM_SETTING_FILES_FIELD_UID =
  'a5861788-6399-4033-9677-febddf6ba9fe';

export const PROJECT_OBJECT_UID = 'bf773e17-d100-40b8-9e8d-ef476c1d2fb8';
export const PROJECT_NAME_FIELD_UID = '955f07c4-9e4a-44ba-9c31-3d5ac2d21070';
export const PROJECT_KEY_FIELD_UID = 'ae48add5-4d3a-4308-b158-8e63ad68700a';
export const PROJECT_NEXT_ISSUE_NUMBER_FIELD_UID =
  'cf46bf2b-8c71-4925-9533-9abc7d2e57cb';
export const PROJECT_DESCRIPTION_FIELD_UID =
  '21a68c5d-8d68-46e2-a53a-943a8d135795';
export const PROJECT_ISSUE_VIEW_SETTINGS_FIELD_UID =
  '37a1ac5c-a930-4be4-8288-6f8b0ac7357b';
export const PROJECT_CATEGORY_FIELD_UID =
  '427396a5-36d1-4b9c-ba7b-29667191a578';
export const PROJECT_LEAD_FIELD_UID = 'e5e2b42e-4568-4498-96e6-9a35546ac1f9';
export const PROJECT_APP_FIELD_UID = 'c4dc0e3e-edcf-4b84-8673-f1a3e69d6bb9';
export const PROJECT_SPRINTS_FIELD_UID =
  'a980d736-d31e-473e-a599-7702d6f53c22';
export const PROJECT_ISSUES_FIELD_UID = '8ef104d2-8d9f-436b-8764-7d1b07b65e8d';
export const PROJECT_EPICS_FIELD_UID = 'f36c7cb9-591d-4edd-8e21-89e2f3872779';
export const PROJECT_ISSUE_STATUSES_FIELD_UID =
  '802294d3-be17-4e77-9271-0ca81f40bd20';

export const SPRINT_OBJECT_UID = '6acc95fa-4a04-49f1-ac53-50efe1032cbf';
export const SPRINT_NAME_FIELD_UID = '6876a9c0-c38f-4637-844e-c873ad3742d7';
export const SPRINT_STATE_FIELD_UID = '529c560f-5953-4113-a67b-06b67167ea85';
export const SPRINT_GOAL_FIELD_UID = '47e4562e-7d9d-4ac8-bda5-bf0cbca9863a';
export const SPRINT_START_DATE_FIELD_UID =
  '78eb74f1-6246-470e-bc7e-cc6991721756';
export const SPRINT_END_DATE_FIELD_UID =
  'f98825ea-49e8-4dcc-9d81-88cccbf42a85';
export const SPRINT_COMPLETE_DATE_FIELD_UID =
  'a1896ecc-77e8-4e13-8b47-732bf3dcaf72';
export const SPRINT_OWNER_FIELD_UID = '3d1fb297-a26d-4261-90d1-e831822f491c';
export const SPRINT_PROJECT_FIELD_UID = '490bf2b4-6329-4b6e-9439-9a8b8f665f65';
export const SPRINT_ISSUES_FIELD_UID = '6c883b2e-192a-4ccc-aa18-b8845b49ebaf';

export const EPIC_OBJECT_UID = '4aef1443-d2b0-42a9-9ce9-f08891b93430';
export const EPIC_NAME_FIELD_UID = 'ede3b828-7820-4f7e-a698-ea8ab024ca8b';
export const EPIC_COLOR_FIELD_UID = 'b7aa53e9-bbae-427d-aa8d-4b5a9422df79';
export const EPIC_ASSIGNEE_FIELD_UID = 'b5b99d32-cff8-4b09-b8a5-671104ccd7a6';
export const EPIC_PROJECT_FIELD_UID = '6d21b491-e9a0-46b2-8714-731bf3ad008d';
export const EPIC_ISSUES_FIELD_UID = 'e879d34e-d571-4cf7-a80c-6c9b9618748e';

export const ISSUE_STATUS_OBJECT_UID = '3439277b-2995-4a5c-b497-1b75396533a4';
export const ISSUE_STATUS_NAME_FIELD_UID =
  '27c289c3-34f8-4062-9a13-38486a3a0e5e';
export const ISSUE_STATUS_COLOR_FIELD_UID =
  '4b980ce6-15ce-45d4-9d5c-a2bc969dc0f9';
export const ISSUE_STATUS_CATEGORY_FIELD_UID =
  '04311de5-09f0-4b4e-ae49-7840648f97ce';
export const ISSUE_STATUS_PROJECT_FIELD_UID =
  'f0d5b889-710a-4dc0-816a-9f551259ee8a';
export const ISSUE_STATUS_ISSUES_FIELD_UID =
  '885d3691-a8b2-4f48-8b9d-447daf9a62f1';

export const ISSUE_OBJECT_UID = 'e14a5928-2bbe-4e20-b766-ea8975ee819f';
export const ISSUE_TITLE_FIELD_UID = '46ef3a12-88e2-414b-bc23-0dc959250e63';
export const ISSUE_KEY_FIELD_UID = '36c20308-3437-4099-a70b-23a0a82fa971';
export const ISSUE_DESCRIPTION_FIELD_UID =
  '18b0e949-24c2-4944-936b-2ec0dcfafa48';
export const ISSUE_TYPE_FIELD_UID = '8971bffb-e416-4f48-8da6-9072b813d767';
export const ISSUE_STATUS_FIELD_UID = '09023d91-7408-459d-8a3b-e4f02ae7d33e';
export const ISSUE_PRIORITY_FIELD_UID = '664598fb-f6e5-4576-a26a-0bd5ac9b4f71';
export const ISSUE_RESOLUTION_FIELD_UID =
  '45052024-8df9-415a-8371-a117028ca651';
export const ISSUE_STORY_POINTS_FIELD_UID =
  '824f542f-b031-4eef-b8d2-7d4359b74727';
export const ISSUE_LABELS_FIELD_UID = '4a698498-1f09-4b0c-b6e6-8bcb0a48ea32';
export const ISSUE_DUE_DATE_FIELD_UID = '26e9639e-9e13-4877-889a-2d6da1a90298';
export const ISSUE_ORIGINAL_ESTIMATE_MINUTES_FIELD_UID =
  '4152dfdd-eca6-48b9-b95b-d64da6a4a1d5';
export const ISSUE_REMAINING_ESTIMATE_MINUTES_FIELD_UID =
  '9e9692be-7e86-4b1a-921a-c2fa831a0974';
export const ISSUE_TIME_SPENT_MINUTES_FIELD_UID =
  '6f89e0b5-df29-46cc-92f9-17ef18c7b247';
export const ISSUE_ASSIGNEE_FIELD_UID = 'e73c84a8-d843-4029-8d87-6ce1506b09cd';
export const ISSUE_REPORTER_FIELD_UID = 'a7b3391d-bbb2-4913-8b48-42190b5f950c';
export const ISSUE_MERCHANTS_FIELD_UID =
  '4c7b2f4a-f668-4f5c-ab30-52e5127aa1db';
// `createdAt` is engine-derived, so it is never declared in issue.object.ts
// and the engine computes its identifier from (application, object, name). It
// is written out here rather than recomputed, because the logic-function
// bundler replaces everything imported from `twenty-sdk/define` with a stub —
// a value derived at runtime is correct in a view manifest and garbage inside
// a route. __tests__/derived-label-identifiers.test.ts pins it.
export const ISSUE_CREATED_AT_FIELD_UID =
  '193ea224-6a73-549d-a0b9-ce666fd4178c';
export const ISSUE_PROJECT_FIELD_UID = '3c15d323-c131-4e6f-ad8c-86515f55420e';
export const ISSUE_SPRINT_FIELD_UID = 'fc7e57b3-900e-423d-beda-0ab1edcd1248';
export const ISSUE_EPIC_FIELD_UID = 'de86605c-2590-4f74-b30e-631dba1aa097';
export const ISSUE_PARENT_FIELD_UID = '96ebe5cd-d301-4ab0-b8c8-8f4ca022f2fe';
export const ISSUE_CHILDREN_FIELD_UID = '42e7d2a1-6fae-4108-b18b-55b1a67734c6';
export const ISSUE_ISSUE_COMMENTS_FIELD_UID =
  'ded94e18-47ed-4805-afeb-dadb6cce328a';
export const ISSUE_WORKLOGS_FIELD_UID = '2e5f8197-da23-4336-84d7-495101b0ceba';
// Never existed in the fork: a brand new identifier, not a copied standard one.
export const ISSUE_ATTACHMENTS_FIELD_UID =
  '43fa7568-bd3f-4434-9fee-6c6bf75dc489';

export const ISSUE_MERCHANT_OBJECT_UID =
  'a469cd28-a0f7-4132-8f5d-d89fa044f516';
export const ISSUE_MERCHANT_ISSUE_FIELD_UID =
  '146b6f20-9357-43be-8149-1d94968e5530';
export const ISSUE_MERCHANT_MERCHANT_FIELD_UID =
  '04541d26-3c33-43d8-9d9b-d70788c71dd4';

export const ISSUE_COMMENT_OBJECT_UID = '860287e4-e447-4e1b-85e4-4952c02f57dd';
export const ISSUE_COMMENT_BODY_V2_FIELD_UID =
  'e2016fcf-bfb3-437e-9976-06e0e44ad802';
export const ISSUE_COMMENT_ISSUE_FIELD_UID =
  '5a6c596e-eef7-4a9b-9c04-36dd27ea70ba';
export const ISSUE_COMMENT_AUTHOR_FIELD_UID =
  '26a86ec5-49c3-4426-913b-7a58f7d6186f';
export const ISSUE_COMMENT_PARENT_COMMENT_FIELD_UID =
  '9ba28755-5027-4181-bb3c-6c24686a9906';
export const ISSUE_COMMENT_REPLIES_FIELD_UID =
  '786c8e13-fc3e-4739-9770-cc4211458765';

export const WORKLOG_OBJECT_UID = '8e4d81e8-6ab8-42c4-9e61-16b98bab83fa';
export const WORKLOG_DESCRIPTION_FIELD_UID =
  'd27d1366-e4fd-4bfd-931e-1981243f6c2d';
export const WORKLOG_TIME_SPENT_MINUTES_FIELD_UID =
  '368bbf52-cc3f-4e65-8bf0-fdf9ae36db36';
export const WORKLOG_STARTED_AT_FIELD_UID =
  '55f3a290-2e79-42e4-a6de-634f7398f9b9';
export const WORKLOG_ISSUE_FIELD_UID = '7afd6d88-94bc-48a9-8c10-1b630327c791';
export const WORKLOG_MEMBER_FIELD_UID = 'bb8f503c-a020-4112-816f-d90c76dd853d';

// System-event feed of an issue: one row per creation and per tracked field
// change, rendered by the History tab. Brand new identifiers, never in the
// fork: the fork read timelineActivity, whose morph branches the cutover
// deleted, so there is nothing to re-parent here.
export const ISSUE_HISTORY_OBJECT_UID = 'b6713eb0-e2f7-4597-b57b-fed07f32a94d';
export const ISSUE_HISTORY_ACTION_FIELD_UID =
  'ac15c452-925a-4b41-93d0-cf277a8fa890';
export const ISSUE_HISTORY_FROM_STATUS_ID_FIELD_UID =
  'c5989500-8c38-4578-af7f-aa117a73a4ee';
export const ISSUE_HISTORY_TO_STATUS_ID_FIELD_UID =
  '1151b071-4ed9-497b-b604-14ca9fbcc8ed';
export const ISSUE_HISTORY_ISSUE_FIELD_UID =
  'cc097730-abfd-4d2e-ab88-957722ff7319';
export const ISSUE_HISTORIES_FIELD_UID = 'a7db2c78-506c-4f97-98aa-970eda8ee917';
export const ISSUE_HISTORY_AUTHOR_FIELD_UID =
  '3bf730d3-638c-411b-833a-ab3507b48515';

// Reverse relation fields this app adds to the standard `workspaceMember`
// object. Same identifiers as the fork's, so the re-parent migration keeps
// the existing metadata rows and their pairing with the owning side.
export const WORKSPACE_MEMBER_LED_PROJECTS_FIELD_UID =
  '7fc50f3f-4899-47ea-b2a7-16be876df920';
export const WORKSPACE_MEMBER_ASSIGNED_ISSUES_FIELD_UID =
  '927b149b-b4f0-4805-b867-42609cd029c6';
export const WORKSPACE_MEMBER_REPORTED_ISSUES_FIELD_UID =
  '664aacfe-c0e0-49b1-8f1f-f8cfab07cf2f';
export const WORKSPACE_MEMBER_ASSIGNED_EPICS_FIELD_UID =
  'a5f85db6-3ecb-47bd-8dd3-854a3fdb0160';
export const WORKSPACE_MEMBER_OWNED_SPRINTS_FIELD_UID =
  'efcc2e97-f62b-4994-8c14-84053fd0d67c';
export const WORKSPACE_MEMBER_ISSUE_COMMENTS_FIELD_UID =
  'da781bbf-a15e-4948-9712-3dcc14ab5545';
export const WORKSPACE_MEMBER_WORKLOGS_FIELD_UID =
  'c0bf79c9-1bbd-438a-b4de-3a0a7960e212';
export const WORKSPACE_MEMBER_ISSUE_HISTORIES_FIELD_UID =
  'e803878f-d204-4e48-91bc-130301cbd7c2';
export const WORKSPACE_MEMBER_APP_ACCESSES_FIELD_UID =
  '288d8f20-66ea-40e6-afc8-f2c73aa18d99';

// Indexes. The per-object identifiers are the fork's; the index-FIELD
// identifiers never existed there (the engine derived them), so they are new.
export const APP_ACCESS_MEMBER_ID_INDEX_UID =
  '781c730c-4540-41ec-8dd9-74dae7520dce';
export const APP_ACCESS_APP_ID_INDEX_UID =
  '561123c4-af46-4ecb-ab4e-8889c7236b2b';
export const PROJECT_LEAD_ID_INDEX_UID =
  'c57bc5a8-1475-418e-ad82-2641bfc6f6a7';
export const PROJECT_APP_ID_INDEX_UID = '4ddfeef7-afb4-4d24-b2a5-d7a44da5a37b';
export const SPRINT_OWNER_ID_INDEX_UID =
  '18fd19f9-03d1-44de-830a-31b60bc0f16a';
export const SPRINT_PROJECT_ID_INDEX_UID =
  'f56963a7-0c8a-440e-8087-d4995473a62c';
export const EPIC_ASSIGNEE_ID_INDEX_UID =
  '2bb103c0-fc1a-45e9-924e-7ebc072f897a';
export const EPIC_PROJECT_ID_INDEX_UID =
  '6191217a-a13b-4a4f-9e54-45c7343f1e65';
export const ISSUE_STATUS_PROJECT_ID_INDEX_UID =
  '194eb3e9-808d-4d7b-a5e7-506378d0fdf0';
export const ISSUE_ASSIGNEE_ID_INDEX_UID =
  'e99fc4ed-39d5-4864-a5f7-6c7122649eae';
export const ISSUE_REPORTER_ID_INDEX_UID =
  'db480adb-fdcd-4792-a658-4dd9391bc683';
export const ISSUE_PROJECT_ID_INDEX_UID =
  '8a2c3728-f10a-4f47-8d72-9a373044f8b7';
export const ISSUE_SPRINT_ID_INDEX_UID =
  '7e8773bb-0a48-4562-8fde-dff731d6db71';
export const ISSUE_EPIC_ID_INDEX_UID = 'aa9f5d42-57e4-4088-bc58-85152a313318';
export const ISSUE_PARENT_ID_INDEX_UID =
  '0f908335-064f-43c1-951d-eef07bac75a0';
export const ISSUE_MERCHANT_ISSUE_ID_INDEX_UID =
  'c02503bc-259a-4118-9e3d-4fc9747b154b';
export const ISSUE_MERCHANT_UNIQUE_INDEX_UID =
  '0a544ae5-b2d6-442f-826b-66e21f1648d7';
export const ISSUE_COMMENT_ISSUE_ID_INDEX_UID =
  'b925954e-c188-4f94-8ae6-6077595aa9ee';
export const ISSUE_COMMENT_AUTHOR_ID_INDEX_UID =
  'b807834c-9291-4c6d-a221-5097a8015e4b';
export const ISSUE_COMMENT_PARENT_COMMENT_ID_INDEX_UID =
  '6a9645b0-f8c7-41fc-9375-80c660aa31ed';
export const WORKLOG_ISSUE_ID_INDEX_UID =
  '40ec70bd-7fc8-40fa-9c9b-d3221b0ca083';
export const WORKLOG_MEMBER_ID_INDEX_UID =
  '5a2cfc6c-52a1-4a90-8f12-72c516f5e293';
export const ISSUE_HISTORY_ISSUE_ID_INDEX_UID =
  '465cdf76-661c-4701-9061-7db73c638e6a';

// Index fields (new: derived by the engine in the fork, declared here).
export const APP_ACCESS_MEMBER_ID_INDEX_FIELD_UID =
  '3b6d5cb1-5b2f-4ad7-9d7b-6b6c8ef4b6b1';
export const APP_ACCESS_APP_ID_INDEX_FIELD_UID =
  '5e1c96da-1f58-4d29-a63a-5c85b8a1aa2f';
export const PROJECT_LEAD_ID_INDEX_FIELD_UID =
  '8cf1a3f7-73ad-4a4c-9b27-8a2e2e3b4c15';
export const PROJECT_APP_ID_INDEX_FIELD_UID =
  'f1c4d7a4-3a68-4b5d-9d24-6e45a0e0f0a3';
export const SPRINT_OWNER_ID_INDEX_FIELD_UID =
  'ab0cd7e2-98c9-4f30-8c1f-0e6d1a4b9e77';
export const SPRINT_PROJECT_ID_INDEX_FIELD_UID =
  'c6e3d71a-5d6b-4f9a-8a35-1b42a3c5f9d8';
export const EPIC_ASSIGNEE_ID_INDEX_FIELD_UID =
  'd8b5f2c9-0e4a-4bb1-9fd0-2c9a7e1b3f46';
export const EPIC_PROJECT_ID_INDEX_FIELD_UID =
  'e5a2c8b3-6f71-4e02-b8ad-7d3f1c0a5b92';
export const ISSUE_STATUS_PROJECT_ID_INDEX_FIELD_UID =
  'b7d9e014-4c82-4a6f-93b1-5e8c2f7a0d63';
export const ISSUE_ASSIGNEE_ID_INDEX_FIELD_UID =
  '9f2a6c05-8b13-4d7e-a4c6-3f1b8e5d2a70';
export const ISSUE_REPORTER_ID_INDEX_FIELD_UID =
  '0c4e7b38-2d95-4f16-8e3a-6b9d1c7f4a52';
export const ISSUE_PROJECT_ID_INDEX_FIELD_UID =
  '1d6f8a27-3e04-4b95-9c78-4a2e5b8d3f61';
export const ISSUE_SPRINT_ID_INDEX_FIELD_UID =
  '2e7b9c48-5f16-4a03-8d69-5b3f6c9e4a70';
export const ISSUE_EPIC_ID_INDEX_FIELD_UID =
  '3f8c0d59-6a27-4b14-9e7a-6c4a7d0f5b81';
export const ISSUE_PARENT_ID_INDEX_FIELD_UID =
  '4a9d1e60-7b38-4c25-8f8b-7d5b8e1a6c92';
export const ISSUE_MERCHANT_ISSUE_ID_INDEX_FIELD_UID =
  '5b0e2f71-8c49-4d36-9a9c-8e6c9f2b7d03';
export const ISSUE_MERCHANT_UNIQUE_INDEX_ISSUE_FIELD_UID =
  '6c1f3a82-9d50-4e47-8bad-9f7d0a3c8e14';
export const ISSUE_MERCHANT_UNIQUE_INDEX_MERCHANT_FIELD_UID =
  '7d2a4b93-0e61-4f58-9cbe-0a8e1b4d9f25';
export const ISSUE_COMMENT_ISSUE_ID_INDEX_FIELD_UID =
  '8e3b5ca4-1f72-4a69-8dcf-1b9f2c5e0a36';
export const ISSUE_COMMENT_AUTHOR_ID_INDEX_FIELD_UID =
  '9f4c6db5-2a83-4b70-9ed0-2c0a3d6f1b47';
export const ISSUE_COMMENT_PARENT_COMMENT_ID_INDEX_FIELD_UID =
  'a05d7ec6-3b94-4c81-8fe1-3d1b4e702c58';
export const WORKLOG_ISSUE_ID_INDEX_FIELD_UID =
  'b16e8fd7-4ca5-4d92-90f2-4e2c5f813d69';
export const WORKLOG_MEMBER_ID_INDEX_FIELD_UID =
  'c27f90e8-5db6-4ea3-a103-5f3d60924e7a';
export const ISSUE_HISTORY_ISSUE_ID_INDEX_FIELD_UID =
  '83864620-c96b-486c-a8f1-097d26a9e055';

// Views.
export const ALL_PROJECTS_VIEW_UID = '3eec03a9-65c4-4307-8358-8050056d7446';
export const ALL_SPRINTS_VIEW_UID = '9c85c09d-bccc-425d-a9fe-2038b77e04dd';
export const ALL_EPICS_VIEW_UID = '8df38d57-39ef-417c-b8f4-9eef2bb62596';
export const ALL_ISSUE_STATUSES_VIEW_UID =
  '0ecaaf80-4bd9-4fb8-808b-0cd26aa55c7e';
export const ALL_ISSUE_COMMENTS_VIEW_UID =
  '97333006-46a5-4628-b3cb-d08acf7a3953';
export const ALL_WORKLOGS_VIEW_UID = '0470a4ad-84a1-4825-a8b6-872bd32bb71f';
export const ALL_APPS_VIEW_UID = '0d449895-a053-49ff-926a-1c0450543e09';
export const ALL_APP_ACCESSES_VIEW_UID =
  'a25e1d47-7b3d-4ae1-afe3-48c6326a25b0';

// Navigation.
export const TASK_MANAGER_FOLDER_NAV_ITEM_UID =
  '203067fc-6551-45bd-b3f3-9fd4dabe5b09';
export const PROJECTS_NAV_ITEM_UID = 'df0304b5-36e3-4f7d-b787-9a5b54a44951';
export const SPRINTS_NAV_ITEM_UID = '28187522-2df6-4a0e-a856-7828dd81f3e2';
export const APPS_NAV_ITEM_UID = 'c8ff4ad2-edc4-4d62-ada9-561dcbbb36f9';
export const APP_ACCESSES_NAV_ITEM_UID =
  '7ec0097c-c929-441a-9ede-0a428281c1c0';

// Row-level app-scope prototype. The engine can only compare a field ON the
// record being read, so `issue.app` mirrors what `issue -> project -> app`
// already says, and `workspaceMember.scopedAppIds` mirrors the caller's
// appAccess grants. Both mirrors are maintained by sync-app-scope-mirror.
export const ISSUE_APP_FIELD_UID = 'a7d5087b-a1de-4e6e-a39d-69e54cf43842';
export const APP_ISSUES_FIELD_UID = '0f2340e5-63d1-4e55-9b9c-522c707cdfeb';
export const WORKSPACE_MEMBER_SCOPED_APP_IDS_FIELD_UID =
  '83531a7b-7a44-456a-a165-72bfe31c6eae';
export const APP_SCOPED_MEMBER_ROLE_UID =
  'd84279c1-7315-4dae-8539-f35ecc9c5570';
export const ISSUE_APP_SCOPE_PREDICATE_UID =
  'ad849e17-4eae-40ff-9a82-9b3b09ce301d';
export const SYNC_APP_SCOPE_MIRROR_LOGIC_FUNCTION_UID =
  'da171bd7-4e0f-4fb5-9065-685c39ae8f8b';
export const ON_APP_ACCESS_CHANGED_LOGIC_FUNCTION_UID =
  '938877ad-8e59-442b-a10d-c70e26f9fd4c';
export const ON_ISSUE_CREATED_LOGIC_FUNCTION_UID =
  'a978dfe4-1aa6-4b2f-96f0-bf8e3ee48112';
export const ON_WORKLOG_CHANGED_LOGIC_FUNCTION_UID =
  '7f606bec-3354-4146-9b4b-5474850c521d';
export const ON_PROJECT_CREATED_LOGIC_FUNCTION_UID =
  'e74407b7-5b9b-4d24-8956-b87b191e32f6';
// The only issue boards are the per-project Kanbans built at run time by the
// project.created trigger. There is deliberately no workspace-wide board: it
// would carry no project or app filter, so creating an issue from it arrives
// with neither and the row-level predicate refuses the write.
export const CREATE_PROJECT_BOARD_VIEW_LOGIC_FUNCTION_UID =
  '401f76ff-b653-4407-b5b9-9d010d171549';
export const PROJECT_APP_SCOPE_PREDICATE_UID =
  '3ce36d9b-afce-4fd6-a917-696f783005de';
export const SPRINT_APP_FIELD_UID = '2e507c2e-d208-42a9-802d-1b9eb72cc99b';
export const APP_SPRINTS_FIELD_UID = 'c1cd63e8-1a6a-4f6b-be26-81c8b1af9897';
export const SPRINT_APP_SCOPE_PREDICATE_UID =
  '1329c721-075b-48c7-8c89-00baa6ca4005';
export const EPIC_APP_FIELD_UID = '0c0740cf-13ee-4f1e-9d57-bd63edfbd2a5';
export const APP_EPICS_FIELD_UID = '4f68081a-afca-4eda-8166-235abfbc0523';
export const EPIC_APP_SCOPE_PREDICATE_UID =
  '3f8386c9-9ecc-4528-9eb5-b353a43d695e';
export const ISSUE_STATUS_APP_FIELD_UID = 'bdf54eee-fffe-49d5-8252-25e1bcb8a7bb';
export const APP_ISSUE_STATUSS_FIELD_UID = '4d4c5bd3-cb22-4a2e-80f6-74aaba3d056c';
export const ISSUE_STATUS_APP_SCOPE_PREDICATE_UID =
  'f9926678-00a0-4e72-bd63-47abbc19251a';
export const ISSUE_COMMENT_APP_FIELD_UID = '3b10b502-38ff-4939-a367-9428cf4de9fa';
export const APP_ISSUE_COMMENTS_FIELD_UID = '63daa720-3e7b-4f72-921a-deaa481d22bc';
export const ISSUE_COMMENT_APP_SCOPE_PREDICATE_UID =
  '48479697-ee86-4098-88f2-0843ba0502b9';
export const WORKLOG_APP_FIELD_UID = '5f771578-d39f-4959-b912-c260353e6aec';
export const APP_WORKLOGS_FIELD_UID = '8a38c776-6d7c-4ad2-8bba-32963449e22e';
export const WORKLOG_APP_SCOPE_PREDICATE_UID =
  '28ee62c8-8231-4acd-a8ca-23a2769615de';
export const ISSUE_MERCHANT_APP_FIELD_UID = 'ff71b19f-bdc5-4ced-9814-abea9597ee0e';
export const APP_ISSUE_MERCHANTS_FIELD_UID = '2948910b-62eb-4745-88ca-61165219c6d7';
export const ISSUE_MERCHANT_APP_SCOPE_PREDICATE_UID =
  '8a21df95-d0d0-4093-be34-b714bcfee7b3';
export const ISSUE_HISTORY_APP_FIELD_UID = 'aace7eab-2509-43a6-ab71-5ed02bbc65b6';
export const APP_ISSUE_HISTORIES_FIELD_UID =
  '510f038a-dc6c-4081-a969-1c97b4094325';
export const ISSUE_HISTORY_APP_SCOPE_PREDICATE_UID =
  '36c27bbc-64fc-4e5c-948c-67fcb6c239ee';
// `merchant` is an app-scope root like `project`, and the only one that had no
// predicate: routes refused a merchant outside the caller's apps, but the
// record table, the pickers and any raw query handed over every merchant in
// the workspace. The field it reads lives in customer-support.
export const MERCHANT_APP_SCOPE_PREDICATE_UID =
  '038f0290-fce9-45eb-bef0-389235c2b40c';
export const ON_ISSUE_UPDATED_LOGIC_FUNCTION_UID =
  'dfec41c8-df75-45fb-ab2c-f73cd71c5f75';

// Page layouts and front components.
// The issue detail page is a RECORD_PAGE. The field panel the fork hand-rolled
// is what the host's FIELDS widget already is, so that one stays host-rendered.
// Description is not: the host's FIELD_RICH_TEXT card resolves no field from
// its configuration and reads a field literally named `bodyV2`, which no
// task-manager object has.
export const ISSUE_RECORD_PAGE_LAYOUT_UID =
  'cef71956-64b4-41a1-9771-84b0aa0d474b';
export const ISSUE_RECORD_PAGE_FIELDS_TAB_UID =
  'e80796d1-e0a1-4f1a-aa89-6f257efa1556';
// The FIELDS widget needs a view of its own, or Twenty's show/hide/reorder
// editor has nothing to write to — see src/views/issue-record-page-fields.view.ts.
export const ISSUE_RECORD_PAGE_DESCRIPTION_WIDGET_UID =
  '21f425f4-489a-4920-a42a-64085f6fafb5';
  '21f425f4-489a-4920-a42a-64085f6fafb5';
export const ISSUE_DESCRIPTION_FRONT_COMPONENT_UID =
  '2a707f35-232e-431c-9468-58913cbbcf67';
// Comments and worklogs are a front component, not a RECORD_TABLE widget: a
// host widget reads and writes with the VIEWER's token, so it goes blank the
// moment the Member role loses direct access to these objects — which is
// exactly the step that makes app-scope real (DEPLOY.md 4.1). Writing through
// the app's routes is also what keeps the worklog time-tracking recomputation
// and the comment author rule applied.
export const ISSUE_ACTIVITY_WIDGET_UID =
  'afee41f0-1817-4d9f-8e2d-3a5e735190df';
export const ISSUE_ACTIVITY_FRONT_COMPONENT_UID =
  'd2889eec-e50b-4a8d-8d60-32cd43980a07';
// No Files or Timeline widget identifiers: both widgets resolve through morph
// branches the cutover deleted (attachment.targetIssueId,
// timelineActivity.targetIssueId), so declaring them renders an invalid-filter
// error. See DEPLOY.md 5.13.

// Subtasks and attachments are app-drawn lists for the same reason comments
// and worklogs are: a host widget reads with the viewer's own token, so it
// goes blank once the Member role loses direct access to these objects.
export const ISSUE_SUBTASKS_FRONT_COMPONENT_UID =
  '2cc11a3b-8db9-4d44-9e7d-27b1d9503028';
export const ISSUE_RECORD_PAGE_SUBTASKS_WIDGET_UID =
  'f313cec7-4761-4900-9e12-e6ba95c20490';
export const ISSUE_ATTACHMENTS_FRONT_COMPONENT_UID =
  '2314a9e1-b681-4675-9da5-65f4dbc529c4';
export const ISSUE_RECORD_PAGE_ATTACHMENTS_WIDGET_UID =
  'bad7290f-5886-45cd-92d7-c1eba03fca22';
// The record page's left column as one panel, the way the board modal draws
// it: description, subtasks and activity stacked with one shared scroll,
// instead of three widget cards each scrolling on its own. The Details column
// stays separate widgets on purpose — its relation pickers are the ones the
// app-access filter narrows per member.
export const ISSUE_RECORD_MAIN_FRONT_COMPONENT_UID =
  '2b7a464d-a0c0-42d5-8531-9e52cbd0000d';
export const ISSUE_RECORD_PAGE_MAIN_WIDGET_UID =
  '809f8c48-7930-4953-8ac2-dbad6d842685';

// Logic functions.
export const ISSUE_DETAIL_LOGIC_FUNCTION_UID =
  '5a41d77d-9e42-4c1a-90a8-ae13d8cf8830';
export const APPEND_ISSUE_ATTACHMENT_LOGIC_FUNCTION_UID =
  'be5c54c6-00f0-4ddc-a93b-abde2fdf28bb';
export const ATTACHMENT_FIELD_LOGIC_FUNCTION_UID =
  'd5919fad-33cb-48fb-a020-1598a212988b';
export const CREATE_ISSUE_LOGIC_FUNCTION_UID =
  '4732fbf1-c5f2-4cff-ac8b-9f17801fcf41';
export const UPDATE_ISSUE_LOGIC_FUNCTION_UID =
  '6fda3246-d62e-4cb0-a6b0-bc484ba02082';
export const DELETE_ISSUE_LOGIC_FUNCTION_UID =
  '67e3e78f-c925-49a5-b85d-806332d2b373';
export const CREATE_PROJECT_LOGIC_FUNCTION_UID =
  '5dd6f1d7-ddb4-4c8b-b8bd-9a849c09966d';
export const UPDATE_PROJECT_LOGIC_FUNCTION_UID =
  '68689876-50ea-464b-9d38-f90884b50aa0';
export const CREATE_SPRINT_LOGIC_FUNCTION_UID =
  'f844da97-5f1c-4ffc-8db3-1b45b61af8c4';
export const UPDATE_SPRINT_LOGIC_FUNCTION_UID =
  '70c6ab34-1476-4cd7-ac1b-7720d28a628f';
export const COMPLETE_SPRINT_LOGIC_FUNCTION_UID =
  '1baa7c0c-0614-4033-a6a8-d8e4d5e7d7a2';
export const CREATE_EPIC_LOGIC_FUNCTION_UID =
  '17efb7ee-b250-4c2f-8665-21984c38d3b6';
export const UPDATE_EPIC_LOGIC_FUNCTION_UID =
  '32bb8219-d551-476d-83cd-6509872cfff1';
export const CREATE_ISSUE_STATUS_LOGIC_FUNCTION_UID =
  '52a3850a-6d71-4a66-b3d1-7bbb5e248a42';
export const DELETE_ISSUE_STATUS_LOGIC_FUNCTION_UID =
  '70e8da72-4f63-4e38-a51f-2292383e8d73';
export const UPDATE_ISSUE_VIEW_SETTINGS_LOGIC_FUNCTION_UID =
  '6e2e268e-39bf-4fb8-9417-cfc037f7d27d';
export const REORDER_ISSUE_STATUSES_LOGIC_FUNCTION_UID =
  'bdfb541d-3e36-415a-bce8-f06c07db230b';
export const CREATE_ISSUE_COMMENT_LOGIC_FUNCTION_UID =
  'bbe4374b-f5ce-47e1-bc33-c7eccc10200c';
export const UPDATE_ISSUE_COMMENT_LOGIC_FUNCTION_UID =
  '033a9682-c313-45e8-8236-57d93eea72e2';
export const DELETE_ISSUE_COMMENT_LOGIC_FUNCTION_UID =
  '2cb264d7-c895-4abe-b975-cfb65bea4f82';
export const CREATE_WORKLOG_LOGIC_FUNCTION_UID =
  'f5bcccb3-23a7-4a08-9e8f-71a6b3e463b8';
export const UPDATE_WORKLOG_LOGIC_FUNCTION_UID =
  'e5072512-7202-463f-b16b-f5e097c373ee';
export const DELETE_WORKLOG_LOGIC_FUNCTION_UID =
  'b6410b5a-ad84-43ea-ad66-1fb862bf0621';
export const SEARCH_MERCHANTS_LOGIC_FUNCTION_UID =
  '3001695f-14b7-44b1-8d2e-fdd524c6559a';
export const SEARCH_ISSUES_LOGIC_FUNCTION_UID =
  '0f28bbef-763b-4346-b03c-932eb03f0836';

// Record pages for the four objects the engine never gave one. They were
// still standard objects of the fork when the backfill upgrade command ran,
// and its standard branch only creates a page for objects upstream's own
// definitions know about — so they fell through the gap and clicking a row
// opened nothing. Declared here instead, the same shape as the issue page.
export const APP_RECORD_PAGE_LAYOUT_UID =
  '76a60b8a-2d9c-40a1-9f8e-915eafabdb4e';
export const APP_RECORD_PAGE_TAB_UID =
  '924bd58b-3298-442d-ac69-7a228918e30b';
export const APP_RECORD_PAGE_FIELDS_WIDGET_UID =
  'df4f0afb-1278-459b-b05b-350836a3abb3';
export const APP_RECORD_PAGE_FIELDS_VIEW_UID =
  '7e49b537-52a3-4340-823c-26b109875fec';
export const APP_ACCESS_RECORD_PAGE_LAYOUT_UID =
  '86bf5684-b44c-4267-a87c-2c875eb36688';
export const APP_ACCESS_RECORD_PAGE_TAB_UID =
  '6ffb0cde-727c-4985-8495-7fd2b5c6963a';
export const APP_ACCESS_RECORD_PAGE_FIELDS_WIDGET_UID =
  'b0265f30-93e6-43cb-acd1-c8bb5b009d6e';
export const APP_ACCESS_RECORD_PAGE_FIELDS_VIEW_UID =
  '8f786fd1-49d2-4355-a7f4-880728549cbb';
export const ISSUE_STATUS_RECORD_PAGE_LAYOUT_UID =
  '61b18029-aa52-4438-9a97-21aa5596d799';
export const ISSUE_STATUS_RECORD_PAGE_TAB_UID =
  '29bc1cc5-32ef-4e82-8561-dbbecb303975';
export const ISSUE_STATUS_RECORD_PAGE_FIELDS_WIDGET_UID =
  '6584bf3c-6217-4472-ad39-91c7ede9e904';
export const ISSUE_STATUS_RECORD_PAGE_FIELDS_VIEW_UID =
  'efe5d53b-57c8-41c6-99f7-7e175a541cb8';
export const ISSUE_MERCHANT_RECORD_PAGE_LAYOUT_UID =
  '055a35ca-bd30-4b89-a4f4-44f4aff58c84';
export const ISSUE_MERCHANT_RECORD_PAGE_TAB_UID =
  '8c07e9e2-6abf-4dba-8214-2513f8074c90';
export const ISSUE_MERCHANT_RECORD_PAGE_FIELDS_WIDGET_UID =
  '608f2383-7c31-4cad-820a-c80cc9e3d7a3';
export const ISSUE_MERCHANT_RECORD_PAGE_FIELDS_VIEW_UID =
  'c2aed8a7-ea09-4a9b-8143-97406607237a';

// The front end's own origin. A front component runs in a sandboxed worker
// with an opaque origin, so there is no `location` to read it from and no host
// call that returns it: a copy-link button can only build an absolute URL from
// a value somebody configured.
export const RECORD_PAGE_BASE_URL_VARIABLE_UID =
  'e41137ec-0dac-46c1-8a7e-5cf1c53a0def';

// The copy-link button the host draws in the Description widget's own header,
// beside its title. A FRONT_COMPONENT widget reaches that row only through
// headerCommandMenuItemUniversalIdentifiers, and a command menu item can only
// point at a front component — so the button is a headless one that copies and
// unmounts itself.
export const COPY_ISSUE_LINK_FRONT_COMPONENT_UID =
  'b7c9248d-ef47-4e5b-b10f-da436cf9ab47';
export const COPY_ISSUE_LINK_COMMAND_MENU_ITEM_UID =
  'a3db5784-4007-403e-9d54-f10960048452';

// The relation fields the app draws itself rather than leaving to the host's
// FIELDS widget. That widget resolves a picker by querying the target object
// with the viewer's token, so its options are only ever as narrow as the
// row-level predicates — app-wide, never project-wide — and `workspaceMember`
// carries no predicate at all.
export const ISSUE_FIELDS_FRONT_COMPONENT_UID =
  '62adb113-f3d0-4d0e-967c-712ead3adf62';
export const ISSUE_RECORD_PAGE_RELATIONS_WIDGET_UID =
  '9a38b056-7419-48cb-9b79-77ddb9867fd7';

// Custom Settings on a merchant: the schema comes off the merchant's app
// (app.fieldSchema), the values off merchant.customSettings. The fork drew
// this by patching FieldDisplay to swap the raw JSON cell for a button; an app
// has no such hook, so the button is a widget of its own on the merchant
// record page and the form is a host-rendered overlay hanging off it.
export const MERCHANT_CUSTOM_SETTINGS_FRONT_COMPONENT_UID =
  '957d889b-f186-4fe5-97f2-03e651433a69';
export const MERCHANT_CUSTOM_SETTINGS_WIDGET_UID =
  'e05d2d0e-f086-4915-a9a3-104ee3282ad5';
export const MERCHANT_CUSTOM_SETTINGS_LOGIC_FUNCTION_UID =
  '44f519ba-cf86-48fb-b560-9c092a4b47da';
export const UPDATE_MERCHANT_CUSTOM_SETTINGS_LOGIC_FUNCTION_UID =
  '37c7d2c1-427d-48de-9a4b-ffdf5ec5e7d8';
export const RUN_MERCHANT_CUSTOM_SETTING_TOOL_LOGIC_FUNCTION_UID =
  '6e057a27-eede-47f3-b525-fe735af608e7';

// The Home tab of the merchant record page: `merchant` has no page of its
// own in any manifest, and the engine's backfill gave it "Default Merchant
// Layout" (owned by the Customer Support application, which owns the merchant
// object). The widget above attaches to that tab rather than this app
// redeclaring the whole layout.
//
// A LITERAL on purpose: the backfill derives tab identifiers per workspace,
// so this is the production workspace's value (the dev workspace's was
// f6c4069a-eab1-563e-be30-b415cb42f032) — verified against
// core.pageLayoutTab. Other workspaces get their own value.
export const STANDARD_MERCHANT_RECORD_PAGE_HOME_TAB_UID =
  'c578b3a9-a013-560e-99d8-957d8e338f65';

// Jira-style board: one STANDALONE page rendering every status of the selected
// project as a column, with the issue detail as a drawer inside the same front
// component. Brand new identifiers — nothing to re-parent from the fork.
export const TASK_BOARD_PAGE_LAYOUT_UID =
  '72a89b44-988c-4a24-8fe1-fa064f8759df';
export const TASK_BOARD_PAGE_LAYOUT_TAB_UID =
  '1cf0cdee-a83e-4464-98c4-f9b7c317ea9b';
export const TASK_BOARD_PAGE_LAYOUT_WIDGET_UID =
  'aefec7ef-ac21-43c1-a428-0406572a0f65';
export const TASK_BOARD_FRONT_COMPONENT_UID =
  '215ad369-c35b-4d52-aa81-e5eddd68dd57';
export const TASK_BOARD_NAV_ITEM_UID = '8bf079a3-6d31-49d5-8e27-6880ecda4fae';
export const TASK_BOARD_LOGIC_FUNCTION_UID =
  '8ea7f77e-e6cd-4580-8bdc-8ac58ffc9e56';
export const BOARD_COLUMN_ISSUES_LOGIC_FUNCTION_UID =
  '2b1dd369-1c28-4fa3-b78a-6ecd2418fd5d';

// Sprint and epic planning on the board: the backlog, the sprint lifecycle and
// the epic panel.
export const START_SPRINT_LOGIC_FUNCTION_UID =
  'db7970fd-2f5f-4282-9e1b-cba3281e2e1c';
export const DELETE_SPRINT_LOGIC_FUNCTION_UID =
  'f49a5452-0d3d-435b-8a60-a2015aed2242';
export const RANK_ISSUE_LOGIC_FUNCTION_UID =
  '021094a7-225d-4da9-84aa-93c2aba46345';
export const DELETE_EPIC_LOGIC_FUNCTION_UID =
  '6bd7839e-cce7-4336-b85a-a0acb014a0ba';
export const EPIC_SUMMARIES_LOGIC_FUNCTION_UID =
  '6a626fc2-1958-44cf-8653-420078051f1d';
export const BACKLOG_LOGIC_FUNCTION_UID =
  '799e79fd-4153-45e6-87ec-8cbf5db68a07';
export const BACKLOG_SECTION_ISSUES_LOGIC_FUNCTION_UID =
  '32f31c95-37f5-4324-9996-e16c5e2b3ec2';
