// `merchant` is a standard object of this fork, not of upstream Twenty, so the
// published twenty-sdk constants do not carry it. The value comes from
// core.objectMetadata in the workspace and must not be regenerated.
export const MERCHANT_OBJECT_UID = '5d9a58bd-983c-4ca4-9f0a-b53cdec4cfca';
export const APP_OBJECT_UID = '4d71d304-ea37-457c-9422-48812659d75e';

// Every universalIdentifier the app owns, in one place: a duplicate or a typo
// here silently creates a second entity on install instead of updating the
// existing one, so they are never inlined at the definition site.

export const PROSPECT_OBJECT_UID = '27e6b144-d8cc-4888-a404-83ee1b13c315';
export const UPSELL_DEAL_OBJECT_UID = 'b5675faa-44ec-4be9-b84d-da289df52547';

export const PROSPECT_DOMAIN_FIELD_UID = '9ca60f80-6a7f-4589-92a9-ff99f04e4d66';
export const PROSPECT_SHOP_NAME_FIELD_UID =
  '11610a8b-51df-4e42-9757-2fdf5ba345fb';
export const PROSPECT_SHOPIFY_PLAN_FIELD_UID =
  '412ee573-162e-41f8-9d7b-74ef03c862f1';
// A field's `type` is not a compared property of the manifest sync
// (all-entity-properties-configuration-by-metadata-name.constant.ts), so
// changing ARRAY to MULTI_SELECT in place is silently ignored — only the new
// universalIdentifier below forces the field to be recreated with the new type.
// The ARRAY-era identifier was 'cc410859-20df-4066-a78e-914aba64c466'.
export const PROSPECT_OTHER_APPS_FIELD_UID =
  '6e8eaa85-7121-4c3b-a0a7-69a1cb6bfd31';
export const PROSPECT_OUR_APPS_FIELD_UID =
  '6365236b-7eed-4e5e-a9cb-2df00dffffab';
export const PROSPECT_INDUSTRY_FIELD_UID =
  '2b1895d8-6360-4548-bba5-d713e65efda1';
export const PROSPECT_LAST_SYNCED_AT_FIELD_UID =
  '649a054b-be2f-4ac9-8c42-3361d659a5b1';
export const PROSPECT_EMAIL_FIELD_UID = 'c623cb1f-5288-4fd1-8ba4-68c11378849b';
export const PROSPECT_IMPORTED_AT_FIELD_UID =
  '7196cc24-03e9-4127-aa63-2c2bc27c5621';

export const UPSELL_DEAL_NAME_FIELD_UID =
  'e75871fb-83ab-4d0e-ad99-ede911e8adec';
export const TARGET_APP_ON_UPSELL_DEAL_FIELD_UID =
  'c94ff79e-3eee-4dd9-aab5-824e6b9b9ff1';
export const UPSELL_DEALS_ON_APP_FIELD_UID =
  '7f4d7980-c6ef-4f50-9334-e90d12b2c6d2';
export const UPSELL_DEAL_STAGE_FIELD_UID =
  '6b4cc3d1-0e96-40b6-8fa2-a025788442db';
export const UPSELL_DEAL_NEXT_FOLLOW_UP_AT_FIELD_UID =
  '63737f77-7593-48c7-b4c1-5009c7739ea9';
export const UPSELL_DEAL_SUGGESTED_CLOSE_FIELD_UID =
  'fc260b84-9b60-47ad-913c-ae2cc7953172';
export const UPSELL_DEAL_SUGGESTED_CLOSE_AT_FIELD_UID =
  'fc88c837-f778-46cd-9c6f-1bf6b70d1b88';

export const OWNER_ON_PROSPECT_FIELD_UID =
  '3445f8dc-4f6a-464e-ac96-3897ce0a04e9';
export const OWNED_PROSPECTS_ON_MEMBER_FIELD_UID =
  '00058b14-202f-4453-817c-20d2825e0cc0';
export const OWNER_ON_UPSELL_DEAL_FIELD_UID =
  'c0f8b799-9e9d-4259-bc8d-ce132cbfc2cc';
export const OWNED_UPSELL_DEALS_ON_MEMBER_FIELD_UID =
  'dfc7718b-0a24-42dd-8170-4710288257e7';
export const PROSPECT_ON_UPSELL_DEAL_FIELD_UID =
  '8e8cee04-b0a4-4f09-b934-c590155626a3';
export const UPSELL_DEALS_ON_PROSPECT_FIELD_UID =
  'd51cd773-b779-44a2-b02d-999db00b55da';
export const PROSPECT_ON_MERCHANT_FIELD_UID =
  'b94b6134-f66b-4843-9146-c2f91f0ba890';
export const MERCHANTS_ON_PROSPECT_FIELD_UID =
  '4ceaa0d9-2b89-4285-b27d-d39ec4d8ca31';

export const ALL_PROSPECTS_VIEW_UID = '5902df2b-d4b9-417c-ab79-b1f9ecd603f2';
export const PROSPECTS_WITHOUT_DEAL_VIEW_UID =
  '32f05fb9-3f31-4823-829c-53e225f1ddc7';
export const DEALS_PIPELINE_VIEW_UID = 'e92b3158-d563-4654-a24b-8e64a93140ac';
export const DEALS_FOLLOW_UP_VIEW_UID = 'f8db4ff6-dbce-4ff5-bb3f-7b4ee0dc0602';

export const BD_FOLDER_NAV_ITEM_UID = '2dfddda5-e1cd-4143-b78c-bbe576074730';
export const ALL_PROSPECTS_NAV_ITEM_UID =
  '08cbc2fe-6ffb-4b6a-8b88-7bb6a0fe9589';
export const DEALS_PIPELINE_NAV_ITEM_UID =
  'b505e209-51e0-4743-8774-083efcacd034';
export const IMPORT_PAGE_NAV_ITEM_UID = '16262323-3ed3-46d2-8bda-b1e905b61ca7';

// `BD` and `BD Manager` used to be declared here. They were handed over to the
// workspace so the team can edit their actions in Settings, which a role owned
// by an application forbids (validate-role-belongs-to-caller-application.util).
// The ids stay recorded so nothing else ever claims them.
// export const BD_ROLE_UID = '3f9b3320-f1ab-4961-ba27-637507127eb1';
// export const BD_MANAGER_ROLE_UID = '76fd131a-a3c8-4e93-a752-09c8bd20137a';

export const SYNC_DEAL_STAGES_ON_CREATE_LOGIC_FUNCTION_UID =
  'ef826050-6d73-4c52-841f-14053a589872';
export const SYNC_DEAL_STAGES_LOGIC_FUNCTION_UID =
  '2af5caf2-d16e-4453-8d4f-a2413a598003';
export const SYNC_DEAL_STAGES_ON_DELETE_LOGIC_FUNCTION_UID =
  'b76dfb0d-bd02-4d9b-bd96-ba749e6c156a';
export const MERCHANT_INSTALL_LOGIC_FUNCTION_UID =
  '62d6b690-f8a3-40df-9f92-06a87fac993a';
export const MERCHANT_CHANGED_LOGIC_FUNCTION_UID =
  '6d7e1e59-6e1b-4be6-82d1-bee9e9719cbf';
export const MERCHANT_UNINSTALL_LOGIC_FUNCTION_UID =
  'f20bf0e4-176d-4029-a15a-3e1b9164ef9e';
export const MERCHANT_DESTROYED_LOGIC_FUNCTION_UID =
  '46a1deee-b739-4f74-a562-e8a6c8233844';
export const SYNC_PROSPECTS_LOGIC_FUNCTION_UID =
  'a7cf0bf8-82fc-4edb-8e9c-43f53e8d549e';
export const SUGGEST_CLOSE_LOGIC_FUNCTION_UID =
  '78cf7c31-8d68-4d7a-b45b-417356eebbb4';
export const IMPORT_PROSPECTS_LOGIC_FUNCTION_UID =
  'fc237fea-86c6-4484-8066-79402ea3ff86';

export const PROSPECT_RECORD_PAGE_LAYOUT_UID =
  'd1beefd9-5131-4efa-a34f-6d879fec61c6';
export const PROSPECT_RECORD_PAGE_TABS = {
  home: '97d6904e-a48f-494f-be06-bf6801902aa9',
  notes: '796c3609-4cbd-4382-88b0-0a4c8fe3990c',
  tasks: '6db5f1e6-4b76-4913-998d-c749dc909683',
  timeline: '411accad-1e34-4afd-bb53-96d7d728a512',
  files: '552eebef-2dd4-49fa-ab7d-ac4426b69611',
} as const;
export const PROSPECT_RECORD_PAGE_WIDGETS = {
  fields: 'a54a14ce-d843-4f6a-b4dc-70288e0bdea0',
  homeNotes: 'fad31b8b-dd3d-45b9-937c-26597ce49c86',
  notes: 'bbe43e9d-681d-4794-b578-050b696bff9f',
  tasks: '392cc8c6-fa7e-4d57-add2-e13c0865e618',
  timeline: '8ade1bf3-93d2-47c9-bf4d-438b016283e0',
  files: 'c81296ea-0128-433a-b8c5-ca4b9440c6f3',
} as const;

export const IMPORT_WIZARD_FRONT_COMPONENT_UID =
  'f6425885-b989-4e83-b00a-f629e97a770d';
export const IMPORT_PAGE_LAYOUT_UID = '6eb23455-ea6d-4b0f-b6a0-0ca44d98eb8a';
export const IMPORT_PAGE_LAYOUT_TAB_UID =
  '33bd371d-f1d2-46b1-9904-e251b0f9f800';
export const IMPORT_PAGE_LAYOUT_WIDGET_UID =
  'f813098c-ed1a-462a-8793-82876c2f0c38';

export const UPSELL_DEAL_FIELDS_VIEW_UID =
  'bcb3fd22-fbf5-425c-991c-4f244dcce657';

export const UPSELL_DEAL_RECORD_PAGE_LAYOUT_UID =
  '4fe25e3a-7bee-4f75-a075-352ea072c6eb';

export const UPSELL_DEAL_RECORD_PAGE_TABS = {
  home: 'a67df555-4b05-4f4f-93c3-6e3a076d4501',
  notes: '4a0b1eb4-658e-4d18-a190-f4a247112386',
  timeline: '8bbea59c-b68f-465c-8736-4d87ad709a92',
} as const;

export const UPSELL_DEAL_RECORD_PAGE_WIDGETS = {
  fields: '948ff006-485b-4fb1-b8e9-d33adc817165',
  notes: 'a339ca5c-abcf-45c8-b8ec-d4f22ccf7c7a',
  timeline: '48982735-f31a-474f-945c-9c67c590416f',
} as const;
