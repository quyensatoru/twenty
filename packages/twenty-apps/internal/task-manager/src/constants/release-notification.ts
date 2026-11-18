export const RELEASE_NOTIFICATIONS_ROUTE_PATH =
  '/task-manager/release-notifications';
export const SAVE_RELEASE_NOTIFICATION_ROUTE_PATH =
  '/task-manager/save-release-notification';
export const DELETE_RELEASE_NOTIFICATION_ROUTE_PATH =
  '/task-manager/delete-release-notification';

export const RELEASE_NOTIFICATION_OBJECT_UID =
  'cb5f2eed-733b-424e-9ca0-1e724116478f';
export const RELEASE_NOTIFICATION_TITLE_FIELD_UID =
  'a0001f2f-ce85-49fe-957a-5cb4cd31cb1a';
export const RELEASE_NOTIFICATION_CONTENT_FIELD_UID =
  '89fffa20-7bf0-4641-a0c6-19cb65361f95';
export const RELEASE_NOTIFICATION_CATEGORY_FIELD_UID =
  'dcccfab7-3c84-403f-8e89-357bda1d4cb6';
export const RELEASE_NOTIFICATION_RELEASE_DATE_FIELD_UID =
  'cae5dfa2-3627-497a-b828-bf8f639c9b0f';
export const RELEASE_NOTIFICATION_LINK_DOC_FIELD_UID =
  '67316e7d-f06d-46a0-b6e8-2958ce0b29ab';
export const RELEASE_NOTIFICATION_VERSION_FIELD_UID =
  'd8364520-b80e-4f5f-8c76-59d26524792f';
export const RELEASE_NOTIFICATION_STATUS_FIELD_UID =
  '33befca6-3fc3-4006-acb0-3b5a486d4e2d';
export const RELEASE_NOTIFICATION_PUBLISHED_AT_FIELD_UID =
  '25b24408-233d-4d86-8887-6fc24df19f3f';
export const RELEASE_NOTIFICATION_APP_FIELD_UID =
  'd4acbbe5-4ff8-44b6-8ec0-1445136271c0';
export const APP_RELEASE_NOTIFICATIONS_FIELD_UID =
  '8021e29d-df5e-466b-9d39-9ceffde43227';
export const RELEASE_NOTIFICATION_APP_SCOPE_PREDICATE_UID =
  '4f7cf047-e96a-45a9-89b5-fcc5ae2b759b';
export const RELEASE_NOTIFICATION_APP_ID_INDEX_UID =
  'b43e3c8e-3ec8-47c0-8516-b746272c4fb9';
export const RELEASE_NOTIFICATION_APP_ID_INDEX_FIELD_UID =
  '026ddee2-8017-4a5b-9144-d6eac008b895';

export const RELEASE_NOTIFICATIONS_LOGIC_FUNCTION_UID =
  '989623da-c947-4711-810f-6af6e7e055ba';
export const SAVE_RELEASE_NOTIFICATION_LOGIC_FUNCTION_UID =
  '5d0423e5-8ac3-46a0-b149-35e14a4d97af';
export const DELETE_RELEASE_NOTIFICATION_LOGIC_FUNCTION_UID =
  'bc80d3c5-fd7c-43f7-ad44-48ea3b60c1b1';

export const RELEASE_NOTIFICATIONS_FRONT_COMPONENT_UID =
  'd6d2583e-3f5c-4e7f-ba5b-cecf1a01c9d4';
export const RELEASE_NOTIFICATIONS_PAGE_LAYOUT_UID =
  '789318b1-67bb-4a50-91d6-a7ec26fe6336';
export const RELEASE_NOTIFICATIONS_PAGE_LAYOUT_TAB_UID =
  '917caaa7-ce7e-4d07-89e3-940165f5f975';
export const RELEASE_NOTIFICATIONS_PAGE_LAYOUT_WIDGET_UID =
  '3ba05623-bf28-4aca-8b37-29af1a8f16d0';

export const ALL_RELEASE_NOTIFICATIONS_VIEW_UID =
  '9c6648c2-cc8a-412f-ab7a-bd98363f8c7d';

export const RELEASE_NOTIFICATION_CATEGORY_OPTIONS = [
  {
    id: 'c43d3880-a4d2-4f8b-8eb1-eb1b2b97e96a',
    value: 'NEW',
    label: 'New',
    color: 'green',
    position: 0,
  },
  {
    id: 'bc95b95c-9d08-4697-8e60-1bd41c1d9236',
    value: 'IMPROVEMENT',
    label: 'Improvement',
    color: 'blue',
    position: 1,
  },
  {
    id: '112c7d3d-a052-4259-bb22-fcdfe1bbcea6',
    value: 'FIX',
    label: 'Fix',
    color: 'orange',
    position: 2,
  },
] as const;

export const RELEASE_NOTIFICATION_STATUS_OPTIONS = [
  {
    id: '74205441-f822-488c-b54a-28f8d6ba4d96',
    value: 'DRAFT',
    label: 'Draft',
    color: 'gray',
    position: 0,
  },
  {
    id: '616eefdc-e2c8-43d5-ac53-e81ef85e4c1a',
    value: 'PUBLISHED',
    label: 'Published',
    color: 'green',
    position: 1,
  },
] as const;

export type ReleaseNotificationCategory =
  (typeof RELEASE_NOTIFICATION_CATEGORY_OPTIONS)[number]['value'];
export type ReleaseNotificationStatus =
  (typeof RELEASE_NOTIFICATION_STATUS_OPTIONS)[number]['value'];

export const RELEASE_NOTIFICATION_SELECTION = {
  id: true,
  title: true,
  content: { markdown: true },
  category: true,
  releaseDate: true,
  linkDoc: { primaryLinkUrl: true, primaryLinkLabel: true },
  version: true,
  status: true,
  publishedAt: true,
  appId: true,
  createdAt: true,
  updatedAt: true,
} as const;
