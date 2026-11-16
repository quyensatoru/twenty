import {
  defineView,
  getFieldUniversalIdentifier,
  ViewType,
} from 'twenty-sdk/define';

import {
  ALL_BC_TASKS_VIEW_UID,
  APPLICATION_UID,
  BC_TASK_CATEGORY_FIELD_UID,
  BC_TASK_OBJECT_UID,
  BC_TASK_OWNER_FIELD_UID,
  BC_TASK_PRIORITY_FIELD_UID,
  BC_TASK_STATUS_FIELD_UID,
  BC_TASK_TITLE_FIELD_UID,
  BC_TASK_VIP_CLIENT_FIELD_UID,
} from '../constants/universal-identifiers';

// createdAt is an engine field; its identifier is derived the way the engine
// derives it, from the application, the object and the field name.
const CREATED_AT_FIELD_UID = getFieldUniversalIdentifier({
  applicationUniversalIdentifier: APPLICATION_UID,
  objectUniversalIdentifier: BC_TASK_OBJECT_UID,
  name: 'createdAt',
});

export default defineView({
  universalIdentifier: ALL_BC_TASKS_VIEW_UID,
  name: 'All BC tasks',
  objectUniversalIdentifier: BC_TASK_OBJECT_UID,
  type: ViewType.TABLE,
  icon: 'IconCheckbox',
  position: 0,
  fields: [
    {
      universalIdentifier: '9ac4d5e3-272b-4fc4-9b63-43f7c15cd01f',
      fieldMetadataUniversalIdentifier: BC_TASK_TITLE_FIELD_UID,
      position: 0,
      isVisible: true,
      size: 280,
    },
    {
      universalIdentifier: '5c074821-d5ee-4638-be91-c35f309740dd',
      fieldMetadataUniversalIdentifier: BC_TASK_VIP_CLIENT_FIELD_UID,
      position: 1,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: '9964ce35-8516-46d6-88e6-ca43adb966fb',
      fieldMetadataUniversalIdentifier: BC_TASK_STATUS_FIELD_UID,
      position: 2,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: 'ee5db4ec-d4b6-4d92-baae-1e4dece92a2b',
      fieldMetadataUniversalIdentifier: BC_TASK_PRIORITY_FIELD_UID,
      position: 3,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier: 'd91ac382-7917-4aaa-8e47-a9f0f89740a1',
      fieldMetadataUniversalIdentifier: BC_TASK_CATEGORY_FIELD_UID,
      position: 4,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: '710e30f3-27c7-4f61-8572-ca3d7ab10b61',
      fieldMetadataUniversalIdentifier: BC_TASK_OWNER_FIELD_UID,
      position: 5,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '1313ee4c-314c-49d8-970c-2db938c3d3c2',
      fieldMetadataUniversalIdentifier: CREATED_AT_FIELD_UID,
      position: 6,
      isVisible: true,
      size: 150,
    },
  ],
});
