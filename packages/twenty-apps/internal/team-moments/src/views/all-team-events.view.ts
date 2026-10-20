import { defineView, ViewType } from 'twenty-sdk/define';

import {
  ALL_TEAM_EVENTS_VIEW_DATE_FIELD_UID,
  ALL_TEAM_EVENTS_VIEW_IS_YEARLY_FIELD_UID,
  ALL_TEAM_EVENTS_VIEW_KIND_FIELD_UID,
  ALL_TEAM_EVENTS_VIEW_LOCATION_FIELD_UID,
  ALL_TEAM_EVENTS_VIEW_NAME_FIELD_UID,
  ALL_TEAM_EVENTS_VIEW_UID,
  TEAM_EVENT_DATE_FIELD_UID,
  TEAM_EVENT_IS_YEARLY_FIELD_UID,
  TEAM_EVENT_KIND_FIELD_UID,
  TEAM_EVENT_LOCATION_FIELD_UID,
  TEAM_EVENT_NAME_FIELD_UID,
  TEAM_EVENT_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineView({
  universalIdentifier: ALL_TEAM_EVENTS_VIEW_UID,
  name: 'All Team Events',
  objectUniversalIdentifier: TEAM_EVENT_OBJECT_UID,
  type: ViewType.TABLE,
  icon: 'IconConfetti',
  position: 0,
  fields: [
    {
      universalIdentifier: ALL_TEAM_EVENTS_VIEW_NAME_FIELD_UID,
      fieldMetadataUniversalIdentifier: TEAM_EVENT_NAME_FIELD_UID,
      position: 0,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: ALL_TEAM_EVENTS_VIEW_KIND_FIELD_UID,
      fieldMetadataUniversalIdentifier: TEAM_EVENT_KIND_FIELD_UID,
      position: 1,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: ALL_TEAM_EVENTS_VIEW_DATE_FIELD_UID,
      fieldMetadataUniversalIdentifier: TEAM_EVENT_DATE_FIELD_UID,
      position: 2,
      isVisible: true,
      size: 130,
    },
    {
      universalIdentifier: ALL_TEAM_EVENTS_VIEW_IS_YEARLY_FIELD_UID,
      fieldMetadataUniversalIdentifier: TEAM_EVENT_IS_YEARLY_FIELD_UID,
      position: 3,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier: ALL_TEAM_EVENTS_VIEW_LOCATION_FIELD_UID,
      fieldMetadataUniversalIdentifier: TEAM_EVENT_LOCATION_FIELD_UID,
      position: 4,
      isVisible: true,
      size: 180,
    },
  ],
});
