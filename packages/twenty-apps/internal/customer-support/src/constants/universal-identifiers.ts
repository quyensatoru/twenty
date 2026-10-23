// `merchant` already exists in every workspace this app will be installed
// into: it was a standard object of the fork, then task-manager's, and this
// app takes ownership of it. Its identity is `(workspaceId,
// universalIdentifier)`, so the value below MUST stay the one already in
// core.objectMetadata — a new value would make `apply` create a second, empty
// merchant table and leave the populated one orphaned.
export const MERCHANT_OBJECT_UID = '5d9a58bd-983c-4ca4-9f0a-b53cdec4cfca';
export const MERCHANT_NAME_FIELD_UID = 'a9bc9790-aece-4df3-b22a-6bdf26f079a1';
export const MERCHANT_CUSTOM_SETTINGS_FIELD_UID =
  '0ff00e57-a471-4cb7-baa5-f9f7b4a49418';

// `app` stays with task-manager. merchant.appId points at it across the
// application boundary, which the manifest allows: a migration's `from` set is
// filtered to the owning application, so an object another app owns is never
// in this app's diff, while validation runs over the whole workspace graph so
// the foreign key still resolves.
export const APP_OBJECT_UID = '4d71d304-ea37-457c-9422-48812659d75e';

// Everything this app owns, in one place: a duplicate or a typo silently
// creates a second entity on install instead of updating the existing one.
// Never change a value after the first sync.
export const APPLICATION_UID = '37713d9d-6058-4b15-bac2-6a8f2f234e5a';
export const APP_RUNTIME_ROLE_UID = 'b363f07a-23ff-48d0-8f54-a2909e6172be';

// Existing entities that move here with the object. Their values are the ones
// already in the workspace, so the sync updates them in place instead of
// creating duplicates alongside the originals.
export const ALL_MERCHANTS_VIEW_UID = '7e113b9b-b798-4f1a-99d5-926869ae1e28';
export const MERCHANTS_NAV_ITEM_UID = '7f0e425f-99ba-4782-ac92-23252d22cfdd';

// New: the Merchants entry used to sit in the Task Manager folder, which that
// app owns and which is the wrong place for it now.
export const CUSTOMER_SUPPORT_FOLDER_NAV_ITEM_UID =
  '8b813dd2-9ef7-48b6-86c0-14501e6bc6e8';

// The merchant <-> app relation and the index over its join column. Both move
// with the object: a manifest that declares an index must also declare the
// object it is on — `twenty plan` refuses with "Index ... references unknown
// object" otherwise. Fields carry no such rule, which is why task-manager can
// keep owning `issues` on this object.
export const MERCHANT_APP_FIELD_UID = '050c5e37-f2b2-452f-84f3-6d9396ccfbe4';
export const APP_MERCHANTS_FIELD_UID = '47a89700-ba35-4c37-84da-afca9f43bd8c';
export const MERCHANT_APP_ID_INDEX_UID =
  'dfae531a-75a7-4810-babc-b75d3f6c6b4f';
export const MERCHANT_APP_ID_INDEX_FIELD_UID =
  '2a9b93d7-9a27-4be9-bb6c-0f1d7de7c92e';

// Crisp chat sync. Same rule as above: never change a value after the first
// sync.
export const CRISP_CONVERSATION_OBJECT_UID =
  '2a82f2e4-67c2-4b1d-85a6-3bcf9fd87673';
export const CRISP_CONVERSATION_VISITOR_NAME_FIELD_UID =
  'bd6b420c-9961-4980-939a-9980bb422cf0';
export const CRISP_CONVERSATION_VISITOR_EMAIL_FIELD_UID =
  'e708125c-2780-487c-a189-e5461582358c';
export const CRISP_CONVERSATION_SESSION_ID_FIELD_UID =
  '8e840d04-fba9-4f9e-908c-c21367a11713';
export const CRISP_CONVERSATION_WEBSITE_ID_FIELD_UID =
  '594978c4-8b58-41e2-8892-9e1b7de64951';
export const CRISP_CONVERSATION_APP_NAME_FIELD_UID =
  '15129ae8-1e7a-4451-a231-7531cf1449ca';
export const CRISP_CONVERSATION_STATUS_FIELD_UID =
  '76f1af92-077b-43a4-b25b-f70f037ddce8';
export const CRISP_CONVERSATION_LAST_MESSAGE_AT_FIELD_UID =
  '88eaf062-28ad-46d4-a36d-79694b7c8300';
export const CRISP_CONVERSATION_LAST_MESSAGE_EXCERPT_FIELD_UID =
  '0b83c8ad-06e8-40b3-bbc0-49dfbd1ca5a3';
export const CRISP_CONVERSATION_LAST_MESSAGE_FROM_FIELD_UID =
  '02debaf0-556c-476e-9221-dbe32326c9ac';
export const CRISP_CONVERSATION_LAST_MESSAGE_FINGERPRINT_FIELD_UID =
  '4f09ba6a-afb9-4692-be67-12d112f45e5d';
export const CRISP_CONVERSATION_WAITING_SINCE_FIELD_UID =
  '2c4e95ec-1f8e-4e5b-8d5e-80bd803d0d82';
export const CRISP_CONVERSATION_STARTED_AT_FIELD_UID =
  '47794c7d-2379-4cda-bfee-e050ca020fa5';
export const CRISP_CONVERSATION_MESSAGE_COUNT_FIELD_UID =
  '6f8a4a6c-160a-47eb-b4c0-a47cba2fc59d';
export const CRISP_CONVERSATION_SEGMENTS_FIELD_UID =
  '5d1d7987-701d-4086-b2e2-966e3cc600a5';
export const CRISP_CONVERSATION_COUNTRY_FIELD_UID =
  'e2d9f59c-9112-49ba-9505-69e30168124d';
export const CRISP_CONVERSATION_SHOP_DOMAIN_FIELD_UID =
  '54b4b8c6-79eb-4c86-b86c-dfc9d421759d';
export const CRISP_CONVERSATION_OPERATOR_NAME_FIELD_UID =
  'f558b0a9-9f25-4d3b-80fb-1c1e73b09aea';
export const CRISP_CONVERSATION_SESSION_DATA_FIELD_UID =
  '48883ec9-18f6-4445-8fa5-ea613994a2d4';
export const CRISP_CONVERSATION_MERCHANT_FIELD_UID =
  'bc5e9a76-fb8a-4fff-9abe-69f6b2299b57';
export const CRISP_CONVERSATION_MESSAGES_FIELD_UID =
  '256c52a5-112d-42ff-b936-23ecbff53958';
export const MERCHANT_CRISP_CONVERSATIONS_FIELD_UID =
  'd328cbbe-2b44-4ecf-942d-c71448801833';

export const CRISP_MESSAGE_OBJECT_UID = 'e5b28966-2a8f-4d41-8dcd-b36fb6ad3cd7';
export const CRISP_MESSAGE_TEXT_FIELD_UID =
  '62a9265f-6306-45c3-af99-69837a782daf';
export const CRISP_MESSAGE_FINGERPRINT_FIELD_UID =
  '5b2ba62c-c333-447d-98a3-54fa3d94138e';
export const CRISP_MESSAGE_SENDER_FIELD_UID =
  'aa8d6809-e03e-489c-8114-14471be3ee78';
export const CRISP_MESSAGE_SENDER_NAME_FIELD_UID =
  '683873c0-c0b4-4287-995b-69798dcec910';
export const CRISP_MESSAGE_MESSAGE_TYPE_FIELD_UID =
  'a42f9ff2-a8b5-4c69-a93a-b6b17f18ec13';
export const CRISP_MESSAGE_CONTENT_FIELD_UID =
  '494d9c15-8567-47b3-8896-ea4d55a3f041';
export const CRISP_MESSAGE_SENT_AT_FIELD_UID =
  '39077b25-8833-4292-8425-790c3df5180a';
export const CRISP_MESSAGE_CONVERSATION_FIELD_UID =
  '520c019d-eba2-4a7e-8f1a-66d0cef230f5';

export const CRISP_CONVERSATION_LAST_MESSAGE_AT_INDEX_UID =
  '23b0d5b1-f811-44cb-9b72-2cce2b825bba';
export const CRISP_CONVERSATION_LAST_MESSAGE_AT_INDEX_FIELD_UID =
  '9dc29388-d1fe-4d7c-a503-edefb411c035';
export const CRISP_MESSAGE_SENT_AT_INDEX_UID =
  '163e5ff1-a1a9-414a-939e-27e60e538182';
export const CRISP_MESSAGE_SENT_AT_INDEX_CONVERSATION_FIELD_UID =
  '7bc310ab-ce14-4c91-a040-45fd96501e79';
export const CRISP_MESSAGE_SENT_AT_INDEX_SENT_AT_FIELD_UID =
  '89d2bc08-7359-4526-8bdb-ab3f0f5f1786';

export const ALL_CRISP_CONVERSATIONS_VIEW_UID =
  '6c0988aa-f7bc-45d7-8083-44837bdc5523';

export const SUPPORT_INBOX_NAV_ITEM_UID = '077d090b-97cf-4286-9fbf-cbaa6d9f5030';
export const SUPPORT_INBOX_PAGE_LAYOUT_UID =
  'b996993c-8898-41b1-adaf-927c6e470f5a';
export const SUPPORT_INBOX_PAGE_LAYOUT_TAB_UID =
  '5f606edd-365e-4556-b3d9-55df5fa4ab05';
export const SUPPORT_INBOX_PAGE_LAYOUT_WIDGET_UID =
  '4393fa75-a46c-4f00-8925-a02208931a6d';
export const SUPPORT_INBOX_FRONT_COMPONENT_UID =
  '279ebe09-93b0-4861-9ae8-62560986a726';

export const CRISP_WEBHOOK_RESOLVER_LOGIC_FUNCTION_UID =
  '2a4040ec-1f6c-406d-b53c-a819bb8c8faa';
export const CRISP_WEBHOOK_EVENT_LOGIC_FUNCTION_UID =
  'c48cdc46-a002-4518-b1df-e4793ca802b7';
export const CRISP_SYNC_LOGIC_FUNCTION_UID =
  '86cfa5a4-ee14-4e58-a45c-4684c4433747';
export const CRISP_SYNC_CRON_LOGIC_FUNCTION_UID =
  'fe9a50c7-e7f8-4712-bae9-49806d3471e0';
export const SUPPORT_INBOX_CONVERSATIONS_LOGIC_FUNCTION_UID =
  'f5e31fe6-cf99-44ef-a809-32c0da9f11f3';
export const SUPPORT_INBOX_MESSAGES_LOGIC_FUNCTION_UID =
  '007fa21b-477d-4702-9304-b982ebbf7397';
export const SUPPORT_INBOX_SYNC_LOGIC_FUNCTION_UID =
  '977355a8-1b66-497c-9843-b47ccd662976';

export const CRISP_PLUGIN_IDENTIFIER_VARIABLE_UID =
  '27c30f12-1ccc-443a-8f48-d7e85c1b1a1c';
export const CRISP_PLUGIN_KEY_VARIABLE_UID =
  '19c28d08-6651-4a82-b04c-b4976d7c6601';
export const CRISP_WEBHOOK_SECRET_VARIABLE_UID =
  '9a8b16f9-c373-454e-bb28-c30e2f78128a';
export const CRISP_WEBSITE_ID_MIDA_VARIABLE_UID =
  '76288959-61c3-414c-8b87-41ddfc95367d';
export const CRISP_WEBSITE_ID_BLOY_VARIABLE_UID =
  '7fc86d99-dcc7-48a0-8531-67b3805d1b03';
export const CRISP_WEBSITE_ID_FRAUD_VARIABLE_UID =
  '4ec21435-2acc-4b39-94f4-873f672b7a86';
export const CRISP_WEBSITE_ID_EU_VARIABLE_UID =
  'd2d986bd-5f38-49d7-854c-d6a3d90e1bd3';
export const CRISP_SYNC_ENABLED_VARIABLE_UID =
  '2bc65f28-df74-42c0-9fe9-13072d52e718';

// Owned by task-manager, like APP_OBJECT_UID above: the chat <-> issue junction
// points into it across the application boundary.
export const ISSUE_OBJECT_UID = 'e14a5928-2bbe-4e20-b766-ea8975ee819f';
export const ISSUE_STATUS_OBJECT_UID = '3439277b-2995-4a5c-b497-1b75396533a4';
// Also task-manager's: the merchants an issue concerns. A chat reaches an
// issue through its merchant.
export const ISSUE_MERCHANT_OBJECT_UID = 'a469cd28-a0f7-4132-8f5d-d89fa044f516';

export const CRISP_CONVERSATION_ISSUE_OBJECT_UID =
  'a9be6520-e16d-4e3d-a769-4f0f7bd41767';
export const CRISP_CONVERSATION_ISSUE_CONVERSATION_FIELD_UID =
  '5c6e3507-4a8f-4a1b-bab2-2583c9debfde';
export const CRISP_CONVERSATION_ISSUE_ISSUE_FIELD_UID =
  'c9644956-3a15-41c5-ace6-1467d4033c45';
export const CRISP_CONVERSATION_ISSUES_FIELD_UID =
  '8f293a46-7c1c-46f8-aa9e-90e32c993aad';
export const ISSUE_CRISP_CONVERSATIONS_FIELD_UID =
  '2a5756bd-9ef6-4403-8c08-0bea99b33c17';
export const CRISP_CONVERSATION_ISSUE_UNIQUE_INDEX_UID =
  '7a028a59-632c-47c7-ac98-6c3fb6f2e013';
export const CRISP_CONVERSATION_ISSUE_UNIQUE_INDEX_CONVERSATION_FIELD_UID =
  '1c5147c7-4a47-4d2a-8d91-314cd19a6771';
export const CRISP_CONVERSATION_ISSUE_UNIQUE_INDEX_ISSUE_FIELD_UID =
  '7ec62a4e-7e29-4ca4-b253-5f48f8984311';

export const CRISP_CONVERSATION_RECORD_PAGE_LAYOUT_UID =
  'f519bbe5-5c1b-49cf-9519-6e5172777ea2';
export const CRISP_CONVERSATION_RECORD_PAGE_TAB_UID =
  'd082ba9a-0061-4835-a01f-c2b1c588733e';
export const CRISP_CONVERSATION_RECORD_PAGE_WIDGET_UID =
  '300773e9-ee54-41d3-b9bf-e738869bb29e';
export const CRISP_CONVERSATION_RECORD_FRONT_COMPONENT_UID =
  'a78ac399-39ac-4a0e-b443-4c174c72bcea';

export const SUPPORT_INBOX_LINK_ISSUE_LOGIC_FUNCTION_UID =
  'b283608a-5e3b-4436-ab63-e63fef5f865a';
export const SUPPORT_INBOX_SEARCH_ISSUES_LOGIC_FUNCTION_UID =
  'ae7c7ca6-a31c-43a5-a013-59e5b11194be';
export const ISSUE_CRISP_CONVERSATIONS_LOGIC_FUNCTION_UID =
  'f1e5c50c-fd9f-4c42-88ee-8b6efdc45e07';
export const MERCHANT_CRISP_CONVERSATIONS_LOGIC_FUNCTION_UID =
  'e5c59deb-280d-4d9b-9ef7-8a17a41e2a45';
export const LINK_CONVERSATIONS_ON_MERCHANT_CREATED_LOGIC_FUNCTION_UID =
  'eb5eef4a-1c12-4d6a-8ad6-bf58cfab03f3';
export const RELINK_CRISP_CONVERSATION_MERCHANTS_LOGIC_FUNCTION_UID =
  'c2dc12c0-8fe5-4437-b6a2-738602c917b4';
export const MOVE_CONVERSATION_ISSUE_LINKS_TO_MERCHANTS_LOGIC_FUNCTION_UID =
  'c657e63c-d4f0-4419-a8ce-ed0817fb00b0';

export const CRISP_CONVERSATION_AI_SUMMARY_FIELD_UID =
  'cf6c7014-0b56-4246-8535-149028f8156e';
export const CRISP_CONVERSATION_AI_PROBLEM_FIELD_UID =
  'bbec9e99-b2cd-4669-8c3e-ac87398f874d';
export const CRISP_CONVERSATION_AI_NEXT_STEP_FIELD_UID =
  '1ee6da38-3214-45fb-b0bc-86b362c459b7';
export const CRISP_CONVERSATION_AI_SUMMARY_AT_FIELD_UID =
  'fba6ba6d-25a5-4ef4-8875-e29b350f7d33';
export const CRISP_CONVERSATION_AI_SUMMARY_MESSAGE_COUNT_FIELD_UID =
  'c538331a-14c0-44c0-bcb5-a176cc8a8074';
export const SUPPORT_INBOX_SUMMARIZE_LOGIC_FUNCTION_UID =
  'a51d78f2-b950-47a6-ac5f-fbf622eea61f';

export const MERCHANT_PLAN_STARTED_AT_FIELD_UID =
  'd4af8d07-9115-43aa-8761-e145052d60f8';
export const SYNC_SESSION_PLAN_DATA_LOGIC_FUNCTION_UID =
  '60b76204-a14a-4873-a2f3-522b1ef652cd';
export const CRISP_PLAN_DATA_CRON_LOGIC_FUNCTION_UID =
  'b186f542-cf62-4fb8-8ed1-9afd5c7076b1';
export const START_PLAN_ON_MERCHANT_CREATED_LOGIC_FUNCTION_UID =
  '3d92ae91-7f38-4a3c-af10-5a34f1df726d';
export const START_PLAN_ON_MERCHANT_UPDATED_LOGIC_FUNCTION_UID =
  'afbdc413-dba7-497a-b92b-220e106a0f5c';
export const CRISP_PLAN_DATA_SWEEP_LOGIC_FUNCTION_UID =
  '3bb729e3-056e-4128-b4b5-81d1b787cbf0';
export const CRISP_PLAN_DATA_DAILY_BUDGET_VARIABLE_UID =
  '593ba277-cf06-42b3-b55a-9c3e25c6c4a5';
export const CRISP_PLAN_DATA_ENABLED_VARIABLE_UID =
  'd6deb7ea-08f5-422f-a798-9238e6a34860';
export const SYNC_MERCHANT_PLAN_DATA_LOGIC_FUNCTION_UID =
  'bff18f34-8476-40c5-afd8-aff1b8050127';

// `discount` was a custom object made in the UI of each workspace, and this app
// takes ownership of it like it did `merchant` (see MIGRATION.md). The object
// and its hand-made fields keep the values already in core.fieldMetadata.
export const DISCOUNT_OBJECT_UID = '5c6ede8f-c6e5-41d2-a9f2-75b8f0f14c9e';
export const DISCOUNT_CODE_FIELD_UID = '6a1e0107-aeed-4e8b-9bac-4f5b707d906e';
export const DISCOUNT_TYPE_FIELD_UID = '52b1fe8b-d343-441d-9fc3-afead6363241';
export const DISCOUNT_VALUE_FIELD_UID = '7f19add4-bc58-4f59-93de-9c528493d751';
export const DISCOUNT_START_DATE_FIELD_UID =
  '7ecb0a13-2c0e-43e7-8337-28c3ae0f8a0f';
export const DISCOUNT_END_DATE_FIELD_UID =
  '142f2210-48e3-4c3e-8d26-559db26b9c86';
export const DISCOUNT_LIMIT_IN_INTERVALS_FIELD_UID =
  '28c25e6e-b844-4173-a7b8-50ed954cee14';
export const DISCOUNT_LIMIT_USAGE_FIELD_UID =
  '40d9439b-6bb6-4f17-b40f-64de3bd801e1';
export const DISCOUNT_STATUS_FIELD_UID = 'c85b46ff-0893-4991-bf08-362c3732f121';
export const DISCOUNT_TIMES_USED_FIELD_UID =
  'd0276228-aaa6-4957-8af1-82d07fd79e87';
export const DISCOUNT_SCOPE_FIELD_UID = 'fea3937b-81e0-4a16-922a-4076db73f8ed';
export const DISCOUNT_REASON_FIELD_UID = '0b58929b-8d64-45b8-ace4-9557aeaca869';
export const DISCOUNT_ASSIGNED_DOMAINS_FIELD_UID =
  '08357435-ecde-4d40-914a-26598679209b';
export const DISCOUNT_APP_FIELD_UID = 'b92afb45-6bdc-4d75-b591-21c74c2fd89f';
export const APP_DISCOUNTS_FIELD_UID = 'e6ae621a-496d-40a2-af3f-82d1cf6467f6';

export const DISCOUNT_MERCHANT_FIELD_UID =
  '2573f2c0-72e9-45b3-9677-ce6f0f549691';
export const MERCHANT_DISCOUNTS_FIELD_UID =
  '84aac1b4-19b0-499a-af92-5016f4ad445d';
export const DISCOUNT_SYNC_STATUS_FIELD_UID =
  'ae9a5c12-bcd2-4f47-bfb4-26445ad58b00';
export const DISCOUNT_SYNC_ERROR_FIELD_UID =
  '967bebac-be90-423d-9b65-80c1a4b2efe5';
export const DISCOUNT_SYNCED_AT_FIELD_UID =
  'b0698d28-65eb-4cc1-b121-9610e1972a5d';
export const DISCOUNT_EXTERNAL_ID_FIELD_UID =
  '9eaaf396-f3b8-43a6-80ca-bc9f553e5f99';
export const DISCOUNT_SYNC_ATTEMPTS_FIELD_UID =
  '23a0deb3-d7ea-4c8e-8b9b-5d1f803241e9';
export const DISCOUNT_NEXT_SYNC_AT_FIELD_UID =
  'a0ffc4a9-4054-4de4-9a7c-91ab5bf5be3f';
export const DISCOUNT_SYNC_LOGS_FIELD_UID =
  '138a1313-f5f7-443c-8c0c-5ed8a2fe6d87';

export const DISCOUNT_SYNC_LOG_OBJECT_UID =
  '6046c8e8-79ae-45f3-93b9-6ee68b592ccf';
export const DISCOUNT_SYNC_LOG_NAME_FIELD_UID =
  '5d4c1160-272b-4e33-982c-e09f98ab1c17';
export const DISCOUNT_SYNC_LOG_DISCOUNT_FIELD_UID =
  'f48292d3-1d57-4fe3-a010-02df9465a232';
export const DISCOUNT_SYNC_LOG_APP_NAME_FIELD_UID =
  'bc0145ae-dbcd-4c8f-a8b0-26469e0cc669';
export const DISCOUNT_SYNC_LOG_ACTION_FIELD_UID =
  '251e7f46-b06e-4ad5-8eb2-acfe03419235';
export const DISCOUNT_SYNC_LOG_RESULT_FIELD_UID =
  'f5224a3b-ff30-4401-ac00-b7fb0192cf25';
export const DISCOUNT_SYNC_LOG_HTTP_STATUS_FIELD_UID =
  '1554c427-8507-4d6b-9a44-b31f5c597d75';
export const DISCOUNT_SYNC_LOG_DURATION_FIELD_UID =
  'fcaa43d5-60f6-4014-b54b-2e86da867355';
export const DISCOUNT_SYNC_LOG_ERRORS_FIELD_UID =
  'cbea2203-41e6-47da-840f-3e364fa7308b';
export const DISCOUNT_SYNC_LOG_REQUEST_FIELD_UID =
  '594bfbc7-e5e3-4d21-80f2-eac59583cd62';
export const DISCOUNT_SYNC_LOG_RESPONSE_FIELD_UID =
  '1ebe05a4-dd1f-4f7f-9708-51ee27998454';
export const DISCOUNT_SYNC_LOG_DELIVERY_ID_FIELD_UID =
  '19ccb5c8-5993-40c2-89e3-b7de58069f62';
export const DISCOUNT_SYNC_LOG_TRIGGERED_BY_FIELD_UID =
  'db46d2a1-68fd-4b5c-a0d0-601a37973a1e';

export const DISCOUNTS_NAV_ITEM_UID = '2658372b-a7b9-432c-a45c-5f908bd0a2f4';
export const DISCOUNTS_PAGE_LAYOUT_UID = '46acc32f-a9a0-4d32-b1b6-0e89e6b5c2d7';
export const DISCOUNTS_PAGE_LAYOUT_TAB_UID =
  '309c65c3-6114-4cdc-95f3-6e605cdf4684';
export const DISCOUNTS_PAGE_LAYOUT_WIDGET_UID =
  '2b3a6a9c-13f3-4e5c-8b83-159fbadc86d6';
export const DISCOUNTS_FRONT_COMPONENT_UID =
  '623f6b3f-73d6-4282-a046-005cecc1dc5a';

export const DISCOUNT_CONSOLE_LIST_LOGIC_FUNCTION_UID =
  '33d19b4a-90d8-45d9-9b1e-74d78d58f678';
export const DISCOUNT_CONSOLE_DETAIL_LOGIC_FUNCTION_UID =
  '83c18db4-094f-4b0a-8561-33631bebcf36';
export const DISCOUNT_CONSOLE_SAVE_LOGIC_FUNCTION_UID =
  '342f78ee-51d3-4512-8a5d-e8625957e995';
export const DISCOUNT_CONSOLE_RESEND_LOGIC_FUNCTION_UID =
  'dd753498-ec84-40c3-b826-f638f728c330';
export const DISCOUNT_CONSOLE_DELETE_LOGIC_FUNCTION_UID =
  'c2583c9a-6c10-4718-bfed-32a038f80fd7';
export const DISCOUNT_CONSOLE_SEARCH_MERCHANTS_LOGIC_FUNCTION_UID =
  '3acd77be-b05d-4a2a-8282-c08d3abdbea0';
export const DISPATCH_DISCOUNT_ON_CREATED_LOGIC_FUNCTION_UID =
  '5cc31640-5848-4f8d-9adf-8c320e88e63d';
export const DISPATCH_DISCOUNT_ON_UPDATED_LOGIC_FUNCTION_UID =
  '30342fa4-ee04-4963-993c-e5150898a4c5';
export const DISPATCH_DISCOUNT_ON_DELETED_LOGIC_FUNCTION_UID =
  '55b445a0-531b-41d2-bd91-e039bf9d5b2d';
export const DISCOUNT_SYNC_RETRY_CRON_LOGIC_FUNCTION_UID =
  '3e18548d-e36d-4ca7-b136-c67c248b42ce';
export const DISCOUNT_SYNC_RESULT_LOGIC_FUNCTION_UID =
  '2892254c-a159-469a-a678-e0b3788c05d3';

export const DISCOUNT_SYNC_ENABLED_VARIABLE_UID =
  '66b1cdc7-9b64-4f5a-a34a-fdeae3e80140';
export const DISCOUNT_CONNECTIONS_LOGIC_FUNCTION_UID =
  'b5dc0bae-fda2-41d4-bb2d-b54066c44d16';
export const DISCOUNT_CONNECTION_SAVE_LOGIC_FUNCTION_UID =
  'b8254e46-5bff-4fde-81f4-255e677b4d48';
