import { defineView, ViewType } from 'twenty-sdk/define';

import {
  ISSUE_ASSIGNEE_FIELD_UID,
  ISSUE_OBJECT_UID,
  ISSUE_PRIORITY_FIELD_UID,
  ISSUE_STATUS_FIELD_UID,
  ISSUE_TITLE_FIELD_UID,
  ISSUES_BY_STATUS_VIEW_UID,
} from '../constants/universal-identifiers';

// No static view groups: `status` is a relation to per-project issueStatus
// records, so a group's fieldValue would have to be a record id that cannot
// exist before the first project is created. The fork registered the same
// ungrouped Kanban and seeded columns per project at runtime.
export default defineView({
  universalIdentifier: ISSUES_BY_STATUS_VIEW_UID,
  name: 'By Status',
  objectUniversalIdentifier: ISSUE_OBJECT_UID,
  type: ViewType.KANBAN,
  icon: 'IconLayoutKanban',
  position: 1,
  mainGroupByFieldMetadataUniversalIdentifier: ISSUE_STATUS_FIELD_UID,
  fields: [
    {
      universalIdentifier: '7e5fa55b-6c6c-461a-9aea-436b61e096b8',
      fieldMetadataUniversalIdentifier: ISSUE_TITLE_FIELD_UID,
      position: 0,
      isVisible: true,
      size: 280,
    },
    {
      universalIdentifier: '596ec971-2835-4b33-b4e0-ddcb0c288159',
      fieldMetadataUniversalIdentifier: ISSUE_PRIORITY_FIELD_UID,
      position: 1,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier: '2cb28927-ecf9-4666-af2b-00be4cc03a76',
      fieldMetadataUniversalIdentifier: ISSUE_ASSIGNEE_FIELD_UID,
      position: 2,
      isVisible: true,
      size: 180,
    },
  ],
});
