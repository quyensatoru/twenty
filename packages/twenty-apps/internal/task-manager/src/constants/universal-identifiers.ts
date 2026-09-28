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
export const APP_MERCHANTS_FIELD_UID = '47a89700-ba35-4c37-84da-afca9f43bd8c';

export const APP_ACCESS_OBJECT_UID = '467cc684-c385-4536-bd9a-dfdf80c2d60f';
export const APP_ACCESS_MEMBER_FIELD_UID =
  'b8791f54-d5c3-4ea8-b050-5807a1867403';
export const APP_ACCESS_APP_FIELD_UID = '5acf2ea8-1d2d-4c54-a9ec-9109563e0d37';
export const APP_ACCESS_PERMISSIONS_FIELD_UID =
  'fd277f1c-807f-4845-a895-e5f1d45d2036';

export const MERCHANT_OBJECT_UID = '5d9a58bd-983c-4ca4-9f0a-b53cdec4cfca';
export const MERCHANT_NAME_FIELD_UID = 'a9bc9790-aece-4df3-b22a-6bdf26f079a1';
export const MERCHANT_APP_FIELD_UID = '050c5e37-f2b2-452f-84f3-6d9396ccfbe4';
export const MERCHANT_CUSTOM_SETTINGS_FIELD_UID =
  '0ff00e57-a471-4cb7-baa5-f9f7b4a49418';
export const MERCHANT_ISSUES_FIELD_UID =
  'bbdb64fd-f399-45b0-bf07-8c913e52ed73';

export const PROJECT_OBJECT_UID = 'bf773e17-d100-40b8-9e8d-ef476c1d2fb8';
export const PROJECT_NAME_FIELD_UID = '955f07c4-9e4a-44ba-9c31-3d5ac2d21070';
export const PROJECT_KEY_FIELD_UID = 'ae48add5-4d3a-4308-b158-8e63ad68700a';
export const PROJECT_NEXT_ISSUE_NUMBER_FIELD_UID =
  'cf46bf2b-8c71-4925-9533-9abc7d2e57cb';
export const PROJECT_DESCRIPTION_FIELD_UID =
  '21a68c5d-8d68-46e2-a53a-943a8d135795';
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
export const ISSUE_PROJECT_FIELD_UID = '3c15d323-c131-4e6f-ad8c-86515f55420e';
export const ISSUE_SPRINT_FIELD_UID = 'fc7e57b3-900e-423d-beda-0ab1edcd1248';
export const ISSUE_EPIC_FIELD_UID = 'de86605c-2590-4f74-b30e-631dba1aa097';
export const ISSUE_PARENT_FIELD_UID = '96ebe5cd-d301-4ab0-b8c8-8f4ca022f2fe';
export const ISSUE_CHILDREN_FIELD_UID = '42e7d2a1-6fae-4108-b18b-55b1a67734c6';
export const ISSUE_ISSUE_COMMENTS_FIELD_UID =
  'ded94e18-47ed-4805-afeb-dadb6cce328a';
export const ISSUE_WORKLOGS_FIELD_UID = '2e5f8197-da23-4336-84d7-495101b0ceba';

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
export const WORKSPACE_MEMBER_APP_ACCESSES_FIELD_UID =
  '288d8f20-66ea-40e6-afc8-f2c73aa18d99';

// Indexes. The per-object identifiers are the fork's; the index-FIELD
// identifiers never existed there (the engine derived them), so they are new.
export const APP_ACCESS_MEMBER_ID_INDEX_UID =
  '781c730c-4540-41ec-8dd9-74dae7520dce';
export const APP_ACCESS_APP_ID_INDEX_UID =
  '561123c4-af46-4ecb-ab4e-8889c7236b2b';
export const MERCHANT_APP_ID_INDEX_UID =
  'dfae531a-75a7-4810-babc-b75d3f6c6b4f';
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

// Index fields (new: derived by the engine in the fork, declared here).
export const APP_ACCESS_MEMBER_ID_INDEX_FIELD_UID =
  '3b6d5cb1-5b2f-4ad7-9d7b-6b6c8ef4b6b1';
export const APP_ACCESS_APP_ID_INDEX_FIELD_UID =
  '5e1c96da-1f58-4d29-a63a-5c85b8a1aa2f';
export const MERCHANT_APP_ID_INDEX_FIELD_UID =
  '2a9b93d7-9a27-4be9-bb6c-0f1d7de7c92e';
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

// Views.
export const ALL_PROJECTS_VIEW_UID = '3eec03a9-65c4-4307-8358-8050056d7446';
export const ALL_ISSUES_VIEW_UID = '2b14a34e-2550-4599-82d6-8a380001877d';
export const ALL_SPRINTS_VIEW_UID = '9c85c09d-bccc-425d-a9fe-2038b77e04dd';
export const ALL_EPICS_VIEW_UID = '8df38d57-39ef-417c-b8f4-9eef2bb62596';
export const ALL_ISSUE_STATUSES_VIEW_UID =
  '0ecaaf80-4bd9-4fb8-808b-0cd26aa55c7e';
export const ALL_ISSUE_COMMENTS_VIEW_UID =
  '97333006-46a5-4628-b3cb-d08acf7a3953';
export const ALL_WORKLOGS_VIEW_UID = '0470a4ad-84a1-4825-a8b6-872bd32bb71f';
export const ALL_MERCHANTS_VIEW_UID = '7e113b9b-b798-4f1a-99d5-926869ae1e28';
export const ALL_APPS_VIEW_UID = '0d449895-a053-49ff-926a-1c0450543e09';
export const ALL_APP_ACCESSES_VIEW_UID =
  'a25e1d47-7b3d-4ae1-afe3-48c6326a25b0';

// Navigation.
export const TASK_MANAGER_FOLDER_NAV_ITEM_UID =
  '203067fc-6551-45bd-b3f3-9fd4dabe5b09';
export const BOARD_NAV_ITEM_UID = '01e75528-be2e-4f06-9e8d-07eaac653cde';
export const BACKLOG_NAV_ITEM_UID = 'bd8c2fa9-79c3-4639-84cc-7db41ad988de';
export const ROADMAP_NAV_ITEM_UID = '9ca57e58-e4c7-4334-8ae1-0a0c86faff84';
export const ISSUE_DETAIL_NAV_ITEM_UID =
  '75ccbce9-b1c3-4e1f-8300-be86089841dc';
export const PROJECTS_NAV_ITEM_UID = 'df0304b5-36e3-4f7d-b787-9a5b54a44951';
export const ISSUES_NAV_ITEM_UID = '37e62b52-051f-4457-b77b-a40e0af06f5a';
export const SPRINTS_NAV_ITEM_UID = '28187522-2df6-4a0e-a856-7828dd81f3e2';
export const EPICS_NAV_ITEM_UID = '2a45a8ee-1719-4e70-bb84-6eadba4ffe07';
export const MERCHANTS_NAV_ITEM_UID = '7f0e425f-99ba-4782-ac92-23252d22cfdd';
export const APPS_NAV_ITEM_UID = 'c8ff4ad2-edc4-4d62-ada9-561dcbbb36f9';
export const APP_ACCESSES_NAV_ITEM_UID =
  '7ec0097c-c929-441a-9ede-0a428281c1c0';
export const WORKLOGS_NAV_ITEM_UID = 'aae26a5a-b81e-4b4d-998f-549e814c2aaf';
export const ISSUE_COMMENTS_NAV_ITEM_UID =
  'a6eb5c8a-cb6a-471e-9fbf-ebbcd46e2ad7';
export const ISSUE_STATUSES_NAV_ITEM_UID =
  'd74bb2b8-0cac-47c5-91de-49b9e397b1f6';

// Page layouts and front components.
export const BOARD_PAGE_LAYOUT_UID = 'b4bb97cf-878a-49d3-8cf9-aeada250a70a';
export const BOARD_PAGE_LAYOUT_TAB_UID =
  '2f90d963-e071-4466-94b8-d32db0ac1942';
export const BOARD_PAGE_LAYOUT_WIDGET_UID =
  'c3c2a3b9-b4a2-43c5-af95-1c45bea5cb09';
export const BOARD_FRONT_COMPONENT_UID =
  '0f50e0a2-b710-495d-870a-39229f633372';
export const BACKLOG_PAGE_LAYOUT_UID = 'ec0d6c17-4561-403e-95f5-acb9e401dc59';
export const BACKLOG_PAGE_LAYOUT_TAB_UID =
  '17811c87-2b2f-4b57-9f6c-ac4fea8dd7f6';
export const BACKLOG_PAGE_LAYOUT_WIDGET_UID =
  '79a1ca0d-2ef8-4d2d-9be8-1f32656d5419';
export const BACKLOG_FRONT_COMPONENT_UID =
  'bf36dbb6-a41e-423a-9597-abede0f21b89';
export const ROADMAP_PAGE_LAYOUT_UID = 'd445d7f7-d34f-4470-a3e4-e71313377357';
export const ROADMAP_PAGE_LAYOUT_TAB_UID =
  '3544df40-78d6-4f6a-aa42-c8eb403e572e';
export const ROADMAP_PAGE_LAYOUT_WIDGET_UID =
  'c80fdc39-7693-4e02-b2e6-192ff9c26317';
export const ROADMAP_FRONT_COMPONENT_UID =
  '5e73f09a-6847-4582-97e0-bbc247d6fafe';
export const ISSUE_DETAIL_PAGE_LAYOUT_UID =
  'cef71956-64b4-41a1-9771-84b0aa0d474b';
export const ISSUE_DETAIL_PAGE_LAYOUT_TAB_UID =
  'e80796d1-e0a1-4f1a-aa89-6f257efa1556';
export const ISSUE_DETAIL_PAGE_LAYOUT_WIDGET_UID =
  '116c8bd6-51bb-4153-ab56-86aedb836282';
export const ISSUE_DETAIL_FRONT_COMPONENT_UID =
  'd2889eec-e50b-4a8d-8d60-32cd43980a07';

// Logic functions.
export const BOARD_DATA_LOGIC_FUNCTION_UID =
  'cc4e5e2c-c3b6-4cc5-a52f-c71d32cabcf7';
export const BACKLOG_DATA_LOGIC_FUNCTION_UID =
  '9db3532c-80c0-45da-a4fd-0d970a22fc19';
export const ROADMAP_DATA_LOGIC_FUNCTION_UID =
  'd895c4b7-2567-4aae-8c5f-6c2e49af2795';
export const ISSUE_DETAIL_LOGIC_FUNCTION_UID =
  '5a41d77d-9e42-4c1a-90a8-ae13d8cf8830';
export const CREATE_ISSUE_LOGIC_FUNCTION_UID =
  '4732fbf1-c5f2-4cff-ac8b-9f17801fcf41';
export const UPDATE_ISSUE_LOGIC_FUNCTION_UID =
  '6fda3246-d62e-4cb0-a6b0-bc484ba02082';
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
export const LIST_MEMBERS_LOGIC_FUNCTION_UID =
  'bb90db83-1e15-4c4b-ac0e-ecbc5ec39477';
export const SEARCH_MERCHANTS_LOGIC_FUNCTION_UID =
  '3001695f-14b7-44b1-8d2e-fdd524c6559a';
