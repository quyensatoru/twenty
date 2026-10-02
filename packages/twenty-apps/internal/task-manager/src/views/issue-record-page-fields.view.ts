import { defineView, ViewType } from 'twenty-sdk/define';

import { getSystemFieldUniversalIdentifier } from '../constants/derived-system-field-identifiers';
import {
  ISSUE_ASSIGNEE_FIELD_UID,
  ISSUE_ATTACHMENTS_FIELD_UID,
  ISSUE_CHILDREN_FIELD_UID,
  ISSUE_DESCRIPTION_FIELD_UID,
  ISSUE_DUE_DATE_FIELD_UID,
  ISSUE_EPIC_FIELD_UID,
  ISSUE_ISSUE_COMMENTS_FIELD_UID,
  ISSUE_KEY_FIELD_UID,
  ISSUE_LABELS_FIELD_UID,
  ISSUE_MERCHANTS_FIELD_UID,
  ISSUE_OBJECT_UID,
  ISSUE_ORIGINAL_ESTIMATE_MINUTES_FIELD_UID,
  ISSUE_PARENT_FIELD_UID,
  ISSUE_PRIORITY_FIELD_UID,
  ISSUE_PROJECT_FIELD_UID,
  ISSUE_RECORD_PAGE_FIELDS_VIEW_UID,
  ISSUE_REMAINING_ESTIMATE_MINUTES_FIELD_UID,
  ISSUE_REPORTER_FIELD_UID,
  ISSUE_RESOLUTION_FIELD_UID,
  ISSUE_SPRINT_FIELD_UID,
  ISSUE_STATUS_FIELD_UID,
  ISSUE_STORY_POINTS_FIELD_UID,
  ISSUE_TIME_SPENT_MINUTES_FIELD_UID,
  ISSUE_TYPE_FIELD_UID,
  ISSUE_WORKLOGS_FIELD_UID,
} from '../constants/universal-identifiers';

// What the FIELDS widget on the issue record page shows, and in which order.
//
// It exists mainly so that the widget HAS a view: without
// `viewUniversalIdentifier` the host falls back to
// `buildDefaultFieldsWidgetGroups`, which orders fields by whatever order
// metadata happens to return them in, hides every RELATION field with no way
// to reach it, and — worse — makes the host's own field editor unsaveable
// (`fields-widget-upsert.service.ts` throws `Fields widget has no associated
// view`). Bound to a view, Twenty's own editor works, reached exactly as it is
// on a native object's record page: command menu → Edit Layout → click the
// widget → Layout, then drag to reorder, the eye to show or hide, Add a Group
// to section the list. It needs the LAYOUTS permission flag, so only admins
// see Edit Layout, and it writes workspace-wide rather than per user.
//
// The host persists an edit as an override owned by the workspace-custom
// application rather than by rewriting the rows below, so `twenty apply`
// leaves a customization alone and the widget's own Reset to default removes
// it. That save also materialises every remaining eligible field — createdBy,
// name, the timestamps — as hidden view fields, which is why the "More" count
// grows the first time somebody edits.
//
// Order follows the design's Details panel: status first, then the two
// people, priority, where the issue belongs, merchants, due date. The rest
// sits in the widget's collapsed "More" section rather than being
// unreachable — a panel of nineteen rows is a wall nobody reads, and the
// fields that matter to a particular team are one click away in "More" or one
// drag away in the widget's own Layout editor.
//
// Creation date is an engine field, never declared in `issue.fields`, so its
// identifier is recomputed with the same helper the engine derives it with.
//
// Status, priority and type are NOT in "More": the design puts status and
// priority in the panel itself. (The record page's top bar stays the host's —
// RecordShowPageHeader and PageCardHeader take no widget, chip or action from
// a manifest.)
//
// Not grouped. `ViewManifest.fieldGroups` would let this file declare the
// sections the widget's "Add a Group" control creates, but the host only
// renders group chrome once there are two or more groups, and the reference
// panel is one flat list.
export default defineView({
  universalIdentifier: ISSUE_RECORD_PAGE_FIELDS_VIEW_UID,
  name: 'Issue Record Page Fields',
  objectUniversalIdentifier: ISSUE_OBJECT_UID,
  type: ViewType.FIELDS_WIDGET,
  fields: [
    {
      universalIdentifier: '863a7c69-4ebf-41b2-90bb-16b15e1b90a9',
      fieldMetadataUniversalIdentifier: ISSUE_REPORTER_FIELD_UID,
      position: 2,
      isVisible: false,
    },
    {
      universalIdentifier: '30553ed3-68e0-40a2-bbb9-60d1a0209464',
      fieldMetadataUniversalIdentifier: ISSUE_ASSIGNEE_FIELD_UID,
      position: 1,
      isVisible: false,
    },
    {
      universalIdentifier: '56ea4bd9-568a-4589-b4ab-895a61f17ced',
      fieldMetadataUniversalIdentifier: ISSUE_DUE_DATE_FIELD_UID,
      position: 6,
      isVisible: true,
    },
    {
      universalIdentifier: 'e4a2080a-6d30-4bc4-994e-469402d7befc',
      fieldMetadataUniversalIdentifier: getSystemFieldUniversalIdentifier({
        objectUniversalIdentifier: ISSUE_OBJECT_UID,
        name: 'createdAt',
      }),
      position: 7,
      isVisible: false,
    },
    {
      universalIdentifier: 'fc0d715b-d5f0-4e78-ad50-72ee6c9a2d63',
      fieldMetadataUniversalIdentifier: ISSUE_PROJECT_FIELD_UID,
      position: 4,
      isVisible: true,
    },
    {
      universalIdentifier: '7bf917c0-0313-43f0-8978-bed4b29c3f67',
      fieldMetadataUniversalIdentifier: ISSUE_MERCHANTS_FIELD_UID,
      position: 5,
      isVisible: false,
    },
    {
      universalIdentifier: '68e9d035-96d7-4078-b74c-8eadc8d68d78',
      fieldMetadataUniversalIdentifier: ISSUE_STATUS_FIELD_UID,
      position: 0,
      isVisible: false,
    },
    {
      universalIdentifier: '1354d3a0-27c1-45d7-b987-2e507cf6b4e6',
      fieldMetadataUniversalIdentifier: ISSUE_PRIORITY_FIELD_UID,
      position: 3,
      isVisible: true,
    },
    {
      universalIdentifier: 'a5a06508-0f5d-414d-8360-b904903af7d4',
      fieldMetadataUniversalIdentifier: ISSUE_TYPE_FIELD_UID,
      position: 8,
      isVisible: true,
    },
    {
      universalIdentifier: '19981d02-7189-4d6a-aa09-3e909f6757ef',
      fieldMetadataUniversalIdentifier: ISSUE_KEY_FIELD_UID,
      // Last of the visible block (0-6 above), and visible at all because the
      // description panel no longer carries the code: the record title bar is
      // the host's, and the widget header beside it renders command menu items
      // icon-only, so Details is the one place left that can show `TM-1`.
      position: 7,
      isVisible: true,
    },
    {
      universalIdentifier: 'afd02d31-d138-4eb0-8de9-0c30408a8866',
      fieldMetadataUniversalIdentifier: ISSUE_SPRINT_FIELD_UID,
      position: 10,
      isVisible: false,
    },
    {
      universalIdentifier: 'ac868564-1427-42b0-a9db-e49944b8afc6',
      fieldMetadataUniversalIdentifier: ISSUE_EPIC_FIELD_UID,
      position: 11,
      isVisible: false,
    },
    {
      universalIdentifier: '9dad57da-6509-4ca5-a5a2-2b123e2edbf0',
      fieldMetadataUniversalIdentifier: ISSUE_STORY_POINTS_FIELD_UID,
      position: 12,
      isVisible: true,
    },
    {
      universalIdentifier: '09f22acd-7348-4fe0-91d5-ca091b06d49f',
      fieldMetadataUniversalIdentifier: ISSUE_LABELS_FIELD_UID,
      position: 13,
      isVisible: true,
    },
    {
      universalIdentifier: 'ddcc1309-f650-4887-8a01-256b5ace4ebc',
      fieldMetadataUniversalIdentifier:
        ISSUE_ORIGINAL_ESTIMATE_MINUTES_FIELD_UID,
      position: 14,
      isVisible: false,
    },
    {
      universalIdentifier: '96081c34-8286-466b-bfe7-1eafc12e61a6',
      fieldMetadataUniversalIdentifier:
        ISSUE_REMAINING_ESTIMATE_MINUTES_FIELD_UID,
      position: 15,
      isVisible: false,
    },
    {
      universalIdentifier: 'a6f0df5a-1fbd-4262-a0f2-d57c38559326',
      fieldMetadataUniversalIdentifier: ISSUE_TIME_SPENT_MINUTES_FIELD_UID,
      position: 16,
      isVisible: true,
    },
    {
      universalIdentifier: '9841298e-bb09-4079-99c3-4dbe94f91867',
      fieldMetadataUniversalIdentifier: ISSUE_ATTACHMENTS_FIELD_UID,
      position: 17,
      isVisible: false,
    },
    {
      universalIdentifier: 'ffdb6999-af53-4e64-8e17-57162c3e089e',
      fieldMetadataUniversalIdentifier: ISSUE_RESOLUTION_FIELD_UID,
      position: 18,
      isVisible: true,
    },
    {
      universalIdentifier: '2e56e1e4-e08a-493e-9dc0-4b88fc463d40',
      fieldMetadataUniversalIdentifier: ISSUE_PARENT_FIELD_UID,
      position: 19,
      isVisible: false,
    },
    {
      universalIdentifier: '2bc71440-146d-4dd7-988e-a03716bf9ef4',
      fieldMetadataUniversalIdentifier: ISSUE_CHILDREN_FIELD_UID,
      position: 20,
      isVisible: false,
    },
    {
      universalIdentifier: '46fab54a-0031-4bdd-bfad-33e25d6c328b',
      fieldMetadataUniversalIdentifier: ISSUE_DESCRIPTION_FIELD_UID,
      position: 21,
      isVisible: false,
    },
    {
      universalIdentifier: 'e68f9b9b-438d-4404-ac86-3d16fa62adc5',
      fieldMetadataUniversalIdentifier: ISSUE_ISSUE_COMMENTS_FIELD_UID,
      position: 22,
      isVisible: false,
    },
    {
      universalIdentifier: '8f0a62cf-5b17-4c4a-b2f2-4b3f0bd1f6ad',
      fieldMetadataUniversalIdentifier: ISSUE_WORKLOGS_FIELD_UID,
      position: 23,
      isVisible: false,
    },
  ],
});
