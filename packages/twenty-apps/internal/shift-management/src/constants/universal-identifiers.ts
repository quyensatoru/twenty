// Every universalIdentifier this app owns, in one place: a duplicate or a typo
// silently creates a second entity on install instead of updating the existing
// one. Never change a value after the first sync.
//
// The object, field, index, view and view-field identifiers below are NOT new.
// They are the exact values the fork shipped while `shift`, `shiftTemplate` and
// `specialDay` were standard objects (twenty-shared standard-object.constant.ts
// and standard-object-fields.constant.ts on `task-manager-sae-backup`). Metadata
// identity is `(workspaceId, universalIdentifier)` and `applicationId` is not
// part of that key, so reusing them turns the production cutover into a
// re-parenting UPDATE instead of a rebuild. See MIGRATION.md.

// --- Standard objects this app attaches to (published by twenty-sdk, repeated
// here so every identifier the app references reads from one file).
export const WORKSPACE_MEMBER_OBJECT_UID =
  '20202020-3319-4234-a34c-82d5c0e881a6';
// The inverse side of shift.member. The fork declared it on workspaceMember
// with this hardcoded identifier (standard-object.constant.ts), so the app
// keeps it: the existing fieldMetadata row is re-parented, not recreated.
export const SHIFTS_ON_WORKSPACE_MEMBER_FIELD_UID =
  '217853a5-299d-4b07-8b6b-cf1e8c3bc14b';

// --- Application, role.
export const APPLICATION_UID = 'f933e505-1fbd-425d-8906-5a9d2e3c73a8';
export const APP_RUNTIME_ROLE_UID = 'a652174c-491f-4c1a-bf32-f11932c47051';

// --- shiftTemplate
export const SHIFT_TEMPLATE_OBJECT_UID =
  '930c8d12-0e7e-427c-87ec-5b155483b5d4';
export const SHIFT_TEMPLATE_NAME_FIELD_UID =
  'bc1b50d2-ae16-4ced-87c6-d44dfef94169';
export const SHIFT_TEMPLATE_CODE_FIELD_UID =
  'e319e588-72a9-4f03-8108-5d9b193a5f43';
export const SHIFT_TEMPLATE_START_TIME_FIELD_UID =
  '334b4d7f-40de-4e83-8956-bacbe58d8b97';
export const SHIFT_TEMPLATE_END_TIME_FIELD_UID =
  '5d8ca64b-86b9-409e-99eb-e3fe699ab04b';
export const SHIFT_TEMPLATE_DAY_KIND_FIELD_UID =
  '52eb03f5-4625-462c-8061-b3bad4a45aff';
export const SHIFT_TEMPLATE_EARLY_CHECK_IN_MINUTES_FIELD_UID =
  '2c919b8d-cc32-4659-9d25-ebe6b7d95d19';
export const SHIFT_TEMPLATE_LATE_CHECK_OUT_MINUTES_FIELD_UID =
  'ffda6656-01db-4cc4-8b4e-b86e69d4d2db';
export const SHIFT_TEMPLATE_SALARY_PER_HOUR_FIELD_UID =
  '1f0f2b17-e648-4180-badc-46e84fc63970';
export const SHIFT_TEMPLATE_COLOR_FIELD_UID =
  'aa68129e-6a00-44b0-95e4-e0e0b98a526b';
export const SHIFT_TEMPLATE_IS_ACTIVE_FIELD_UID =
  '5e0bd44d-c764-4792-af75-ef9137dd16a1';
export const SHIFT_TEMPLATE_DESCRIPTION_FIELD_UID =
  '55e9e449-2e1c-44b3-bef7-4dbcb7b44a5e';
export const SHIFTS_ON_SHIFT_TEMPLATE_FIELD_UID =
  '4f3f4ab2-20e9-404c-a319-ce3a3a3a2d2c';
export const SHIFT_TEMPLATE_IS_ACTIVE_INDEX_UID =
  '440cb5ec-fabb-4575-93ef-6ded444db247';
export const SHIFT_TEMPLATE_CODE_INDEX_UID =
  '2933e33d-0cbb-48d7-a912-00ee7a38ca0e';

// --- specialDay
export const SPECIAL_DAY_OBJECT_UID = '25080a86-ab21-450f-b33b-b8be58f36a59';
export const SPECIAL_DAY_NAME_FIELD_UID =
  '60f82307-46d5-4501-8863-4a39c80cc5bb';
export const SPECIAL_DAY_KIND_FIELD_UID =
  'df691f7e-be49-44ab-bdb0-d4df9442cbc5';
export const SPECIAL_DAY_MONTH_FIELD_UID =
  '4098c4ab-289f-45e7-849d-3ed3fc6dab84';
export const SPECIAL_DAY_DAY_FIELD_UID =
  '5c993363-1b42-4e9f-aa60-84abd0b5c9ff';
export const SPECIAL_DAY_DATE_FIELD_UID =
  '2a191783-37ca-47f0-9b5e-26112ffcacdb';
export const SPECIAL_DAY_MULTIPLIER_FIELD_UID =
  '96d98940-5d22-4360-a0b6-bb388db87db4';
export const SPECIAL_DAY_IS_ACTIVE_FIELD_UID =
  'e67d14f8-052a-443a-a84e-e98331e9d934';
export const SPECIAL_DAY_KIND_IS_ACTIVE_INDEX_UID =
  'a8ea95df-ce34-4cbb-ad33-081c7c071f89';

// --- shift
export const SHIFT_OBJECT_UID = '476bd249-6ab7-472f-82e0-3e538b41722d';
export const SHIFT_NAME_FIELD_UID = '7e227adc-8839-4d2f-bc46-24a42dfb2344';
export const SHIFT_DATE_FIELD_UID = 'd92362a6-d964-47aa-870d-f6da65cb82c1';
export const SHIFT_STATUS_FIELD_UID = 'd7e818e9-23f4-4a29-b944-bcb163904a54';
export const SHIFT_TEMPLATE_CODE_SNAPSHOT_FIELD_UID =
  'da7101a4-f577-4a78-8b5e-f60f475fb33d';
export const SHIFT_TEMPLATE_NAME_SNAPSHOT_FIELD_UID =
  '5c390af4-3b80-4382-87a8-222c6a4afa9b';
export const SHIFT_START_TIME_FIELD_UID =
  '56415541-132d-4c1b-b423-69336e4ba4d7';
export const SHIFT_END_TIME_FIELD_UID = 'f0825520-2a8a-4a01-8d18-ded678b29acd';
export const SHIFT_CHECK_IN_AT_FIELD_UID =
  '635861fd-b5f0-41bb-80c2-572f2c7e051c';
export const SHIFT_CHECK_OUT_AT_FIELD_UID =
  '3e32da4b-30b2-4f65-b8a3-c560cc14e60d';
export const SHIFT_CHECK_IN_LATE_MINUTES_FIELD_UID =
  '3d35e034-133b-445b-be6a-282e8ff20932';
export const SHIFT_WORKING_MINUTES_FIELD_UID =
  'b1ea0630-bda2-476e-8fed-36c8a33bcfa5';
export const SHIFT_RATE_MULTIPLIER_FIELD_UID =
  '557fa620-fc9b-4943-b36f-136ac4b720cc';
export const SHIFT_HANDOVER_NOTE_FIELD_UID =
  '0ba4615b-38b9-42bb-b7a5-1824365b6171';
export const SHIFT_CANCEL_REASON_FIELD_UID =
  '6aa64169-1077-4d28-8895-3ee09f6ba465';
export const SHIFT_CANCEL_CATEGORY_FIELD_UID =
  'cc835c72-d3a7-425a-a8eb-85397df22acb';
export const SHIFT_CANCELLED_AT_FIELD_UID =
  'c7c76b49-b913-481a-bb9e-4581aadada9b';
export const MEMBER_ON_SHIFT_FIELD_UID =
  '7f58f5d8-a0f4-4096-8256-4ceb56071305';
export const SHIFT_TEMPLATE_ON_SHIFT_FIELD_UID =
  '4ce93038-7f41-4269-a6a5-ab953d91ec49';
export const SHIFT_MEMBER_ID_INDEX_UID =
  '5af540b9-a3e6-47be-bd1d-5905ea0d5ad8';
export const SHIFT_TEMPLATE_ID_INDEX_UID =
  '6ab554f5-3cc2-428e-8230-cff5ff493675';
export const SHIFT_DATE_INDEX_UID = '53a29b1a-5acc-4712-ae5e-912083e543dd';

// --- Select option identifiers, kept from the fork so existing rows keep
// resolving to the same option when the objects change owner.
export const SHIFT_STATUS_UPCOMING_OPTION_UID =
  '65e7d5a4-e166-4007-993a-bd7e6ac05311';
export const SHIFT_STATUS_IN_PROGRESS_OPTION_UID =
  '295ce6de-129e-4605-a968-b8c9ca3d92d8';
export const SHIFT_STATUS_COMPLETED_OPTION_UID =
  'f19012d6-1415-416a-8f45-0bd4a683805b';
export const SHIFT_STATUS_CANCELLED_OPTION_UID =
  '3be5f0d4-8f1d-46c4-aace-c8baf21b35b6';
export const SHIFT_CANCEL_CATEGORY_SICK_OPTION_UID =
  '2352ce25-a81e-4051-8bc2-fe1588d11a32';
export const SHIFT_CANCEL_CATEGORY_PERSONAL_OPTION_UID =
  '09c2ad28-f433-4c47-b413-319e6d392b11';
export const SHIFT_CANCEL_CATEGORY_SWAP_OPTION_UID =
  'd863d3c8-2517-4434-9713-128f43ab3962';
export const SHIFT_CANCEL_CATEGORY_OTHER_OPTION_UID =
  '22eedc06-36b3-4edd-b06d-ce88f0eb8374';
export const SHIFT_TEMPLATE_DAY_KIND_WEEKDAY_OPTION_UID =
  '5e320c80-9917-4dff-ba32-8afc35ff0f69';
export const SHIFT_TEMPLATE_DAY_KIND_WEEKEND_OPTION_UID =
  'f825a6a2-ff18-420e-9854-9594b06bd922';
export const SHIFT_TEMPLATE_DAY_KIND_HOLIDAY_OT_OPTION_UID =
  '6258f155-5694-4ba4-8506-0c8cc9d1ff3c';
export const SPECIAL_DAY_KIND_YEARLY_OPTION_UID =
  'b0412a97-12b0-4338-8f94-57bada9a7906';
export const SPECIAL_DAY_KIND_SPECIFIC_OPTION_UID =
  'd8a66473-170d-4ce2-a7ae-d65db3a1dba4';

// --- INDEX views and their view fields. Computed from the fork's deterministic
// scheme (getSystemViewUniversalIdentifier / getSystemViewFieldUniversalIdentifier
// seeded with the Twenty standard application identifier) and frozen here, so
// the re-parented `view` / `viewField` rows match what this app declares and
// `twenty apply` updates them instead of dropping and recreating them.
export const ALL_SHIFTS_VIEW_UID = '386f818f-67cd-56de-8f38-6091543cce6e';
export const ALL_SHIFTS_VIEW_NAME_FIELD_UID =
  '26ef831a-d85a-59c0-a359-8070297dba5e';
export const ALL_SHIFTS_VIEW_DATE_FIELD_UID =
  '6df25f3c-6d14-5d35-a0a9-ddb607a58d19';
export const ALL_SHIFTS_VIEW_STATUS_FIELD_UID =
  '1eab051f-b2c9-5649-a3fb-1d506129c3f7';
export const ALL_SHIFTS_VIEW_MEMBER_FIELD_UID =
  '2314c478-1dd0-558c-bd48-40f13f2288bd';
export const ALL_SHIFTS_VIEW_TEMPLATE_CODE_FIELD_UID =
  '50af0315-39af-5891-8d7d-cab696671cc7';
export const ALL_SHIFTS_VIEW_CHECK_IN_AT_FIELD_UID =
  '9e0808c1-a7f5-5e5d-a29e-8bde9e375113';
export const ALL_SHIFTS_VIEW_CHECK_OUT_AT_FIELD_UID =
  '55d5c08c-2c5e-5f32-bb0d-f7e3a84b1f99';
export const ALL_SHIFTS_VIEW_CHECK_IN_LATE_MINUTES_FIELD_UID =
  'bd2b2868-5a2b-5fd5-9c2c-8014757e8c25';
export const ALL_SHIFTS_VIEW_WORKING_MINUTES_FIELD_UID =
  'd2207658-a92c-52d7-91d7-2e336b45b10c';

export const ALL_SHIFT_TEMPLATES_VIEW_UID =
  '0aa187f4-860e-5fad-b0ef-90d4d3572f50';
export const ALL_SHIFT_TEMPLATES_VIEW_NAME_FIELD_UID =
  'd97798cf-2ada-5d00-9429-9c60918c156c';
export const ALL_SHIFT_TEMPLATES_VIEW_CODE_FIELD_UID =
  '2d073673-fca2-5884-9def-a0b7df2dc3cf';
export const ALL_SHIFT_TEMPLATES_VIEW_START_TIME_FIELD_UID =
  '08c242c7-27b7-5479-9a22-229fcd61318e';
export const ALL_SHIFT_TEMPLATES_VIEW_END_TIME_FIELD_UID =
  '3a8cfa8b-277f-5347-af82-3cc76a69998b';
export const ALL_SHIFT_TEMPLATES_VIEW_DAY_KIND_FIELD_UID =
  '64b2be7a-78db-51ac-8433-97e63fc97e61';
export const ALL_SHIFT_TEMPLATES_VIEW_IS_ACTIVE_FIELD_UID =
  'ac1d67a1-8f71-5ed2-b81f-98537fe4c298';

export const ALL_SPECIAL_DAYS_VIEW_UID =
  '9a6e965d-1c5e-5677-9f71-10f4e4f9c7eb';
export const ALL_SPECIAL_DAYS_VIEW_NAME_FIELD_UID =
  'ee2f2dce-b289-5829-b824-a248ce71d7b0';
export const ALL_SPECIAL_DAYS_VIEW_KIND_FIELD_UID =
  'ab9077cb-4771-526c-94c9-f34edea82fb1';
export const ALL_SPECIAL_DAYS_VIEW_MONTH_FIELD_UID =
  '4fd807ac-31ba-5ec8-84b8-7a1af906565e';
export const ALL_SPECIAL_DAYS_VIEW_DAY_FIELD_UID =
  '6078530c-e9ef-53a9-8c59-14cd12cc4600';
export const ALL_SPECIAL_DAYS_VIEW_DATE_FIELD_UID =
  '0f4794d6-37ff-587e-93cd-6fa0df6769a3';
export const ALL_SPECIAL_DAYS_VIEW_MULTIPLIER_FIELD_UID =
  '27a4cdc6-4db4-5d51-b7c8-1d0c9aabf6e0';
export const ALL_SPECIAL_DAYS_VIEW_IS_ACTIVE_FIELD_UID =
  '0c78e2c5-2a3a-55c0-8683-610afe896855';

// --- Everything below did not exist before the app, so these are new.
export const SHIFT_FOLDER_NAV_ITEM_UID =
  '52f55960-1269-4b72-9eac-51d6fbeb869e';
export const MY_WEEK_NAV_ITEM_UID = 'e6e0fe78-69c0-4294-b5b2-879495ba4193';
export const REGISTER_NAV_ITEM_UID = 'c7b88767-ef57-492f-9149-de7486709763';
export const REPORT_NAV_ITEM_UID = '96d9c4d7-7360-4de6-9ffc-c82acc1ef929';
export const ANALYTICS_NAV_ITEM_UID = 'c880c546-4c10-4828-97bb-d2f7c49de134';
export const SHIFT_TEMPLATES_NAV_ITEM_UID =
  'a3739f47-d092-4723-a851-020727b3e0b3';
export const SPECIAL_DAYS_NAV_ITEM_UID =
  'c43350cb-6ebb-492a-85c3-d41bde0ef2a1';
export const SHIFTS_NAV_ITEM_UID = '5baeea2a-c4a3-4517-8381-4adf501047a8';

export const MY_WEEK_PAGE_LAYOUT_UID = '46f49ac2-20c6-4a88-9d73-931a2c208acf';
export const MY_WEEK_PAGE_LAYOUT_TAB_UID =
  '4507c19a-5af9-47fe-bdc2-bdad0bd59f14';
export const MY_WEEK_PAGE_LAYOUT_WIDGET_UID =
  'c51ab4a0-3d5f-4bc4-b6cb-73b11549cc80';
export const MY_WEEK_FRONT_COMPONENT_UID =
  '6316e058-d09d-4b15-840c-ae97a99cf51e';

export const REGISTER_PAGE_LAYOUT_UID = 'c4a46b00-528d-454a-bd81-f05123b7ceca';
export const REGISTER_PAGE_LAYOUT_TAB_UID =
  'e8765a73-1da4-4147-becf-293454d67a8c';
export const REGISTER_PAGE_LAYOUT_WIDGET_UID =
  '8c50449b-5fd0-4410-8c11-05997a9e9738';
export const REGISTER_FRONT_COMPONENT_UID =
  '7162b21d-975a-4778-a313-57a9f51e4e13';

export const REPORT_PAGE_LAYOUT_UID = '261ffa8a-aaa2-4553-ad54-fbd1256ddab3';
export const REPORT_PAGE_LAYOUT_TAB_UID =
  '103114b5-6564-42e4-9f01-4e26350770e3';
export const REPORT_PAGE_LAYOUT_WIDGET_UID =
  '9f2013c5-f332-4b56-8a4a-92e01cc9207a';
export const REPORT_FRONT_COMPONENT_UID =
  '12e8b6ed-fd1b-4be4-8446-2305cf3fb7bb';

export const ANALYTICS_PAGE_LAYOUT_UID =
  '8b74d42c-3aeb-4cb4-8aa2-3b1c1e437aba';
export const ANALYTICS_PAGE_LAYOUT_TAB_UID =
  'e484c3b6-99cd-428f-9687-2b68b672fad6';
export const ANALYTICS_PAGE_LAYOUT_WIDGET_UID =
  '1c32c5f9-7cd8-4443-9fd0-2a441a6924ad';
export const ANALYTICS_FRONT_COMPONENT_UID =
  '0384b38e-05e4-4198-82ff-7fca7e4ef0f6';

export const SHIFT_ROSTER_LOGIC_FUNCTION_UID =
  '916c911e-fc7f-4328-a4e6-c4edd093ff68';
export const SHIFT_HANDOVERS_LOGIC_FUNCTION_UID =
  '476462a0-1fa8-4038-b0a9-90c8f7f4401d';
export const MY_SHIFTS_LOGIC_FUNCTION_UID =
  'fe610073-7f29-47a4-b072-e19a324cfed2';
export const SHIFT_CATALOG_LOGIC_FUNCTION_UID =
  'aebb900d-40b7-44f3-b82a-436e44e1610e';
export const REGISTER_SHIFTS_LOGIC_FUNCTION_UID =
  'aa5cfd36-b6ed-4f37-af67-d640e9f439a0';
export const CHECK_IN_LOGIC_FUNCTION_UID =
  '9a9fa6e7-82ee-4a3c-8a55-689ae4ff8571';
export const CHECK_OUT_LOGIC_FUNCTION_UID =
  'acbdf67a-7222-4955-8dc7-0edc3f9a1b9f';
export const CANCEL_SHIFT_LOGIC_FUNCTION_UID =
  'a70ed444-7972-4808-9f3c-c37fc952d94c';
export const UPDATE_SHIFT_LOGIC_FUNCTION_UID =
  '5ffca9ac-e6a1-4656-aafc-d2437930eee8';
export const SHIFT_MEMBERS_LOGIC_FUNCTION_UID =
  'cf03f108-4ff8-4560-a183-272c31550a2a';

// --- Application variables.
export const SHIFT_LEADER_EMAILS_VARIABLE_UID =
  'e8227482-fa56-460d-b47d-46092de94ad5';

// --- Index field identifiers. `core."indexFieldMetadata"` has neither a
// universalIdentifier nor an applicationId column, so these are SDK-level ids
// only: nothing in the database has to match them and the cutover does not
// re-parent them.
export const SHIFT_DATE_INDEX_FIELD_UID =
  'ddbf0fc3-5784-4eba-8f56-c70f4153fad7';
export const SHIFT_MEMBER_ID_INDEX_FIELD_UID =
  'bfc82868-2126-4393-83c9-c7c98a792f08';
export const SHIFT_TEMPLATE_ID_INDEX_FIELD_UID =
  '374dce72-c988-4128-90a6-b0aa97d1e319';
export const SHIFT_TEMPLATE_CODE_INDEX_FIELD_UID =
  '42d06e6b-6972-46fb-9aeb-965f56e53d43';
export const SHIFT_TEMPLATE_IS_ACTIVE_INDEX_FIELD_UID =
  'e9bc658c-36ac-4a8b-b304-970c4fa9ed34';
export const SPECIAL_DAY_KIND_INDEX_FIELD_UID =
  '8051fb61-6552-4337-9a84-41a157bf0dee';
export const SPECIAL_DAY_IS_ACTIVE_INDEX_FIELD_UID =
  '19627f00-85ac-44ec-887e-4368591c2ded';
