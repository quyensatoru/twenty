import { TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER } from '@/application/constants/TwentyStandardApplicationUniversalIdentifier';
import { getSystemRelationFieldUniversalIdentifier } from '@/application/deterministic-identifier/get-system-relation-field-universal-identifier.util';
import { STANDARD_OBJECT_FIELDS } from '@/metadata/constants/standard-object-fields.constant';
import { STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS } from '@/metadata/constants/standard-object-universal-identifiers.constant';
import { buildMinimalStandardObjectSystemFields } from '@/metadata/utils/internal/build-minimal-standard-object-system-fields.util';
import { buildStandardObjectSystemFields } from '@/metadata/utils/internal/build-standard-object-system-fields.util';
import { buildStandardObjectIndexView } from '@/metadata/utils/internal/build-standard-object-index-view.util';
import { buildStandardObjectRecordPageFieldsView } from '@/metadata/utils/internal/build-standard-object-record-page-fields-view.util';

// Important notice:
// - Never ever mutate an existing universal identifier
// - Deleting an existing universal identifier should be very rare
// - System field universal identifiers (id, createdAt, updatedAt,
//   deletedAt, createdBy, updatedBy, position, searchVector) are
//   deterministically derived from the standard application universal
//   identifier, the object universal identifier and the field name.
//   The name field is a default field, not a system field, and keeps its
//   hardcoded universal identifier.
// - Field universal identifiers live in STANDARD_OBJECT_FIELDS (see
//   standard-object-fields.constant.ts), so both an object's `fields` and its
//   INDEX view can read the same values. Custom relation fields that
//   STANDARD_OBJECT_FIELDS doesn't know about (task-manager objects linking
//   back into upstream-native objects) are spread on top here instead.
// - INDEX view universal identifiers (the "All {objectLabelPlural}" table view
//   keyed on ViewKey.INDEX) and their view-field universal identifiers are
//   deterministically derived by buildStandardObjectIndexView
//   (getSystemViewUniversalIdentifier for the view,
//   getSystemViewFieldUniversalIdentifier for each view field).
// - FIELDS_WIDGET record-page view universal identifiers (keyed on
//   SYSTEM_VIEW_KEYS.FIELDS_WIDGET), their view fields and their view field groups are
//   deterministically derived by buildStandardObjectRecordPageFieldsView; the group
//   names passed there MUST match the ones the server standard view-field-group
//   builders assign.
export const STANDARD_OBJECTS = {
  attachment: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.attachment,
    fields: {
      ...STANDARD_OBJECT_FIELDS.attachment,
      targetIssue: {
        universalIdentifier: getSystemRelationFieldUniversalIdentifier({
          applicationUniversalIdentifier:
            TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
          objectUniversalIdentifier:
            STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.attachment,
          relationTargetObjectUniversalIdentifier:
            STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.issue,
        }),
      },
      targetIssueComment: {
        universalIdentifier: getSystemRelationFieldUniversalIdentifier({
          applicationUniversalIdentifier:
            TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
          objectUniversalIdentifier:
            STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.attachment,
          relationTargetObjectUniversalIdentifier:
            STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.issueComment,
        }),
      },
      targetProject: {
        universalIdentifier: getSystemRelationFieldUniversalIdentifier({
          applicationUniversalIdentifier:
            TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
          objectUniversalIdentifier:
            STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.attachment,
          relationTargetObjectUniversalIdentifier:
            STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.project,
        }),
      },
      targetMerchant: {
        universalIdentifier: getSystemRelationFieldUniversalIdentifier({
          applicationUniversalIdentifier:
            TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
          objectUniversalIdentifier:
            STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.attachment,
          relationTargetObjectUniversalIdentifier:
            STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.merchant,
        }),
      },
    },
    morphIds: {
      targetMorphId: { morphId: '20202020-f634-435d-ab8d-e1168b375c69' },
    },
    indexes: {
      taskIdIndex: {
        universalIdentifier: 'b8d4f9a3-0c25-4e7b-9f6a-2d3e4c5b6f70',
      },
      issueIdIndex: {
        universalIdentifier: '6f1a2b3c-4d5e-4f60-8a1b-2c3d4e5f6071',
      },
      issueCommentIdIndex: {
        universalIdentifier: '453efd66-de44-4449-8b08-35a4b05fe66e',
      },
      projectIdIndex: {
        universalIdentifier: 'b541c98b-9924-48db-9274-b1953dc6fdd5',
      },
      noteIdIndex: {
        universalIdentifier: '9d31ea73-13b6-4e06-84ee-c66c72bf7787',
      },
      personIdIndex: {
        universalIdentifier: '55637a5a-1edc-4351-8d76-d40020bf8944',
      },
      companyIdIndex: {
        universalIdentifier: '4137ba06-184d-438f-b484-080f02a97659',
      },
      opportunityIdIndex: {
        universalIdentifier: '8cc162d1-c127-4981-878d-f78622f8f12d',
      },
      dashboardIdIndex: {
        universalIdentifier: 'c10eba2d-ff1a-4eab-9285-50481c12a003',
      },
      workflowIdIndex: {
        universalIdentifier: 'fadeab4b-79ee-4173-af79-72c51fbad888',
      },
    },
    views: {
      allAttachments: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.attachment,
        fields: STANDARD_OBJECT_FIELDS.attachment,
        viewFieldNames: [
          'name',
          'file',
          'createdBy',
          'createdAt',
          'targetPerson',
          'targetCompany',
          'targetOpportunity',
          'targetTask',
          'targetNote',
          'targetDashboard',
          'targetWorkflow',
        ],
      }),
    },
  },
  blocklist: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.blocklist,
    fields: STANDARD_OBJECT_FIELDS.blocklist,
    indexes: {
      workspaceMemberIdIndex: {
        universalIdentifier: '4daf320e-74d0-4f24-a45a-af3a09d741cb',
      },
    },
    views: {
      allBlocklists: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.blocklist,
        fields: STANDARD_OBJECT_FIELDS.blocklist,
        viewFieldNames: ['handle', 'workspaceMember', 'createdAt'],
      }),
      blocklistRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.blocklist,
        fields: STANDARD_OBJECT_FIELDS.blocklist,
        viewFieldNames: ['workspaceMember', 'createdAt', 'createdBy'],
        viewFieldGroupNames: {
          general: 'General',
          system: 'System',
        },
      }),
    },
  },
  calendarChannelEventAssociation: {
    universalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.calendarChannelEventAssociation,
    fields: STANDARD_OBJECT_FIELDS.calendarChannelEventAssociation,
    indexes: {
      calendarChannelIdIndex: {
        universalIdentifier: 'ff6b86c1-3112-4dfa-b734-c4789111a716',
      },
      calendarEventIdIndex: {
        universalIdentifier: '47a3c8d2-9f14-4b6e-8c5d-1a2b3f4e5c69',
      },
    },
    views: {
      allCalendarChannelEventAssociations: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.calendarChannelEventAssociation,
        fields: STANDARD_OBJECT_FIELDS.calendarChannelEventAssociation,
        viewFieldNames: [
          'calendarChannelId',
          'calendarEvent',
          'eventExternalId',
          'createdAt',
        ],
      }),
      calendarChannelEventAssociationRecordPageFields:
        buildStandardObjectRecordPageFieldsView({
          objectUniversalIdentifier:
            STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.calendarChannelEventAssociation,
          fields: STANDARD_OBJECT_FIELDS.calendarChannelEventAssociation,
          viewFieldNames: [
            'calendarChannelId',
            'calendarEvent',
            'eventExternalId',
            'createdAt',
            'createdBy',
          ],
          viewFieldGroupNames: {
            general: 'General',
            system: 'System',
          },
        }),
    },
  },
  calendarEventParticipant: {
    universalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.calendarEventParticipant,
    fields: STANDARD_OBJECT_FIELDS.calendarEventParticipant,
    indexes: {
      calendarEventIdIndex: {
        universalIdentifier: 'c458ad97-8b95-43de-9003-88eb68576049',
      },
      personIdIndex: {
        universalIdentifier: '30e9b75a-881f-4a85-aaf1-f2d2464be1cf',
      },
      workspaceMemberIdIndex: {
        universalIdentifier: '898aa202-428f-4a7a-a3b3-8f0a17a6658e',
      },
    },
    views: {
      allCalendarEventParticipants: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.calendarEventParticipant,
        fields: STANDARD_OBJECT_FIELDS.calendarEventParticipant,
        viewFieldNames: [
          'calendarEvent',
          'handle',
          'displayName',
          'isOrganizer',
          'responseStatus',
          'person',
          'workspaceMember',
          'createdAt',
        ],
      }),
      calendarEventParticipantRecordPageFields:
        buildStandardObjectRecordPageFieldsView({
          objectUniversalIdentifier:
            STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.calendarEventParticipant,
          fields: STANDARD_OBJECT_FIELDS.calendarEventParticipant,
          viewFieldNames: [
            'calendarEvent',
            'handle',
            'displayName',
            'isOrganizer',
            'responseStatus',
            'person',
            'workspaceMember',
            'createdAt',
            'createdBy',
          ],
          viewFieldGroupNames: {
            general: 'General',
            system: 'System',
          },
        }),
    },
  },
  calendarEvent: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.calendarEvent,
    fields: STANDARD_OBJECT_FIELDS.calendarEvent,
    indexes: {},
    views: {
      allCalendarEvents: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.calendarEvent,
        fields: STANDARD_OBJECT_FIELDS.calendarEvent,
        viewFieldNames: [
          'title',
          'startsAt',
          'endsAt',
          'isFullDay',
          'location',
          'conferenceLink',
          'isCanceled',
          'createdAt',
        ],
      }),
      calendarEventRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.calendarEvent,
        fields: STANDARD_OBJECT_FIELDS.calendarEvent,
        viewFieldNames: [
          'title',
          'startsAt',
          'endsAt',
          'isFullDay',
          'isCanceled',
          'conferenceLink',
          'location',
          'description',
          'calendarEventTargets',
          'externalCreatedAt',
          'externalUpdatedAt',
          'iCalUid',
          'conferenceSolution',
        ],
        viewFieldGroupNames: {
          general: 'General',
          system: 'System',
        },
      }),
    },
  },
  calendarEventTarget: {
    universalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.calendarEventTarget,
    fields: STANDARD_OBJECT_FIELDS.calendarEventTarget,
    morphIds: {
      targetMorphId: { morphId: '676e9f68-7b5c-41e6-b46d-2fb9527b7051' },
    },
    indexes: {
      calendarEventIdIndex: {
        universalIdentifier: 'ce1c180c-0236-4673-ad1d-359dddf59f93',
      },
      personIdIndex: {
        universalIdentifier: 'f151bc84-ba45-40cb-b064-02ef359ac17b',
      },
      companyIdIndex: {
        universalIdentifier: '30413277-505d-4f08-be38-a56257460f9f',
      },
      opportunityIdIndex: {
        universalIdentifier: '7920092d-281f-473a-8ea4-53c209b36a37',
      },
      calendarEventPersonUniqueIndex: {
        universalIdentifier: '15b9e394-d451-4186-aaf0-612f6be1ea91',
      },
      calendarEventCompanyUniqueIndex: {
        universalIdentifier: '3fa22398-6e7d-47a5-95eb-4971f9d62135',
      },
      calendarEventOpportunityUniqueIndex: {
        universalIdentifier: 'c8183b17-5dfe-4e02-8d9d-aef8e54ef07d',
      },
    },
    views: {},
  },
  callRecording: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.callRecording,
    fields: STANDARD_OBJECT_FIELDS.callRecording,
    indexes: {
      calendarEventIdIndex: {
        universalIdentifier: '8be3cc47-9352-4a1b-ad19-bb186bc0865d',
      },
    },
    views: {
      allCallRecordings: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.callRecording,
        fields: STANDARD_OBJECT_FIELDS.callRecording,
        viewFieldNames: [
          'status',
          'recordingRequestStatus',
          'title',
          'startedAt',
        ],
      }),
      callRecordingRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.callRecording,
        fields: STANDARD_OBJECT_FIELDS.callRecording,
        viewFieldNames: [
          'title',
          'status',
          'recordingRequestStatus',
          'startedAt',
          'endedAt',
          'video',
          'audio',
          'transcript',
          'summary',
        ],
        viewFieldGroupNames: {
          general: 'General',
        },
      }),
    },
  },
  company: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company,
    fields: STANDARD_OBJECT_FIELDS.company,
    indexes: {
      accountOwnerIdIndex: {
        universalIdentifier: 'ec2ebfc9-0c9b-4597-a87d-aa295e2d8bfe',
      },
      domainNameUniqueIndex: {
        universalIdentifier: 'dd300c61-f422-467a-91f4-de4f83c4175b',
      },
      searchVectorGinIndex: {
        universalIdentifier: 'c3eb62df-2cc1-4cc3-b7aa-e96a4d65c633',
      },
    },
    views: {
      allCompanies: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company,
        fields: STANDARD_OBJECT_FIELDS.company,
        viewFieldNames: [
          'name',
          'domainName',
          'createdBy',
          'accountOwner',
          'createdAt',
          'linkedinLink',
          'address',
        ],
      }),
      companyRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company,
        fields: STANDARD_OBJECT_FIELDS.company,
        viewFieldNames: [
          'domainName',
          'accountOwner',
          'annualRevenue',
          'linkedinLink',
          'address',
          'createdAt',
          'createdBy',
          'updatedAt',
          'updatedBy',
          'people',
          'taskTargets',
          'noteTargets',
          'opportunities',
          'attachments',
          'timelineActivities',
        ],
        viewFieldGroupNames: {
          general: 'General',
          business: 'Business',
          contact: 'Contact',
          system: 'System',
        },
      }),
    },
  },
  dashboard: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.dashboard,
    fields: STANDARD_OBJECT_FIELDS.dashboard,
    indexes: {
      searchVectorGinIndex: {
        universalIdentifier: 'e69f71aa-de0f-4b70-845f-7a8369c47928',
      },
    },
    views: {
      allDashboards: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.dashboard,
        fields: STANDARD_OBJECT_FIELDS.dashboard,
        viewFieldNames: ['title', 'createdBy', 'createdAt', 'updatedAt'],
      }),
    },
  },
  messageCampaign: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageCampaign,
    fields: STANDARD_OBJECT_FIELDS.messageCampaign,
    indexes: {
      unsubscribeTopicIdIndex: {
        universalIdentifier: 'efe8c20e-d12b-4475-969e-e86e0bbfe444',
      },
      listIdIndex: {
        universalIdentifier: '17bffd6a-714a-458d-a547-f9e2183d9520',
      },
      searchVectorGinIndex: {
        universalIdentifier: '975823ad-9b97-4f39-b2c7-fbd7d77f4bd1',
      },
    },
    views: {
      allMessageCampaigns: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageCampaign,
        fields: STANDARD_OBJECT_FIELDS.messageCampaign,
        viewFieldNames: [
          'name',
          'subject',
          'status',
          'list',
          'fromAddress',
          'scheduledAt',
          'sentAt',
          'sentCount',
          'deliveredCount',
          'failedCount',
          'skippedCount',
          'bouncedCount',
          'complainedCount',
          'recipients',
          'createdAt',
        ],
      }),
      messageCampaignRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageCampaign,
        fields: STANDARD_OBJECT_FIELDS.messageCampaign,
        viewFieldNames: [
          'status',
          'scheduledAt',
          'sentAt',
          'sentCount',
          'deliveredCount',
          'failedCount',
          'skippedCount',
          'bouncedCount',
          'complainedCount',
        ],
        viewFieldGroupNames: {
          stats: 'Stats',
        },
      }),
    },
  },
  messageList: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageList,
    fields: STANDARD_OBJECT_FIELDS.messageList,
    indexes: {
      searchVectorGinIndex: {
        universalIdentifier: '8e205171-ed74-4620-b7d2-674aab85033a',
      },
    },
    views: {
      allMessageLists: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageList,
        fields: STANDARD_OBJECT_FIELDS.messageList,
        viewFieldNames: [
          'name',
          'description',
          'members',
          'campaigns',
          'createdAt',
        ],
      }),
    },
  },
  messageListMember: {
    universalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageListMember,
    fields: STANDARD_OBJECT_FIELDS.messageListMember,
    indexes: {
      listIdIndex: {
        universalIdentifier: '61188470-6dcb-4b2a-b1a9-baeb688bccae',
      },
      personListUniqueIndex: {
        universalIdentifier: 'e5497dc2-1d72-418c-a389-a0645ca0195a',
      },
    },
    views: {
      allMessageListMembers: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageListMember,
        fields: STANDARD_OBJECT_FIELDS.messageListMember,
        viewFieldNames: ['id', 'person', 'list', 'createdAt'],
      }),
    },
  },
  messageChannelMessageAssociation: {
    universalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageChannelMessageAssociation,
    fields: STANDARD_OBJECT_FIELDS.messageChannelMessageAssociation,
    indexes: {
      messageChannelIdIndex: {
        universalIdentifier: '9894f9a3-0225-4e7b-9f6a-23d4e2576784',
      },
      messageIdIndex: {
        universalIdentifier: '9bb24d40-60dd-4beb-8c64-a74e8c67f9ee',
      },
      messageChannelIdMessageIdUniqueIndex: {
        universalIdentifier: '1b86ece8-7ce3-4df3-8771-fd4b5d45b2f2',
      },
    },
    views: {
      allMessageChannelMessageAssociations: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageChannelMessageAssociation,
        fields: STANDARD_OBJECT_FIELDS.messageChannelMessageAssociation,
        viewFieldNames: [
          'messageChannelId',
          'message',
          'messageExternalId',
          'direction',
          'createdAt',
        ],
      }),
      messageChannelMessageAssociationRecordPageFields:
        buildStandardObjectRecordPageFieldsView({
          objectUniversalIdentifier:
            STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageChannelMessageAssociation,
          fields: STANDARD_OBJECT_FIELDS.messageChannelMessageAssociation,
          viewFieldNames: [
            'messageChannelId',
            'message',
            'messageExternalId',
            'direction',
            'createdAt',
            'createdBy',
          ],
          viewFieldGroupNames: {
            general: 'General',
            system: 'System',
          },
        }),
    },
  },
  messageChannelMessageAssociationMessageFolder: {
    universalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageChannelMessageAssociationMessageFolder,
    fields:
      STANDARD_OBJECT_FIELDS.messageChannelMessageAssociationMessageFolder,
    indexes: {
      messageChannelMessageAssociationIdIndex: {
        universalIdentifier: '8e6038aa-1f79-4a84-87b5-f33caa172e98',
      },
      messageFolderIdIndex: {
        universalIdentifier: '905299c3-ca81-435d-901c-f68b87562516',
      },
      messageChannelMessageAssociationIdMessageFolderIdUniqueIndex: {
        universalIdentifier: 'a3de1788-5dff-4849-ac5a-0dabe5fab216',
      },
    },
    views: {
      allMessageChannelMessageAssociationMessageFolders:
        buildStandardObjectIndexView({
          objectUniversalIdentifier:
            STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageChannelMessageAssociationMessageFolder,
          fields:
            STANDARD_OBJECT_FIELDS.messageChannelMessageAssociationMessageFolder,
          viewFieldNames: [
            'messageChannelMessageAssociation',
            'messageFolderId',
            'createdAt',
          ],
        }),
      messageChannelMessageAssociationMessageFolderRecordPageFields:
        buildStandardObjectRecordPageFieldsView({
          objectUniversalIdentifier:
            STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageChannelMessageAssociationMessageFolder,
          fields:
            STANDARD_OBJECT_FIELDS.messageChannelMessageAssociationMessageFolder,
          viewFieldNames: [
            'messageChannelMessageAssociation',
            'messageFolderId',
            'createdAt',
            'createdBy',
          ],
          viewFieldGroupNames: {
            general: 'General',
            system: 'System',
          },
        }),
    },
  },
  messageParticipant: {
    universalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageParticipant,
    fields: STANDARD_OBJECT_FIELDS.messageParticipant,
    indexes: {
      messageIdIndex: {
        universalIdentifier: 'ab0863ba-f95e-493c-b86c-56e1bc7e5bc2',
      },
      personIdIndex: {
        universalIdentifier: 'df805c2e-3bfe-4d51-8309-75e5eb4052fe',
      },
      workspaceMemberIdIndex: {
        universalIdentifier: 'ce1e3a9e-afe9-439d-abb7-6cc98a6fa405',
      },
      messageCampaignIdIndex: {
        universalIdentifier: 'e9bcdd77-cc8b-4532-833c-124dfdc8e5ff',
      },
    },
    views: {
      allMessageParticipants: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageParticipant,
        fields: STANDARD_OBJECT_FIELDS.messageParticipant,
        viewFieldNames: [
          'message',
          'role',
          'handle',
          'displayName',
          'person',
          'workspaceMember',
          'createdAt',
        ],
      }),
      messageParticipantRecordPageFields:
        buildStandardObjectRecordPageFieldsView({
          objectUniversalIdentifier:
            STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageParticipant,
          fields: STANDARD_OBJECT_FIELDS.messageParticipant,
          viewFieldNames: [
            'message',
            'role',
            'displayName',
            'person',
            'workspaceMember',
            'createdAt',
            'createdBy',
          ],
          viewFieldGroupNames: {
            general: 'General',
            system: 'System',
          },
        }),
    },
  },
  messageThread: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageThread,
    fields: STANDARD_OBJECT_FIELDS.messageThread,
    indexes: {},
    views: {
      allMessageThreads: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageThread,
        fields: STANDARD_OBJECT_FIELDS.messageThread,
        viewFieldNames: ['subject', 'messages', 'updatedAt', 'createdAt'],
      }),
    },
  },
  messageThreadTarget: {
    universalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageThreadTarget,
    fields: STANDARD_OBJECT_FIELDS.messageThreadTarget,
    morphIds: {
      targetMorphId: { morphId: 'e85e853d-c26e-41b3-bec0-7afc4bdbc2f7' },
    },
    indexes: {
      messageThreadIdIndex: {
        universalIdentifier: '222fdd8b-0863-4f2a-816a-29745537b6b6',
      },
      personIdIndex: {
        universalIdentifier: '280ee419-ac3c-4599-bd62-3e5cb268342c',
      },
      companyIdIndex: {
        universalIdentifier: 'b98005e4-3811-41b6-82d0-3ccd27757eba',
      },
      opportunityIdIndex: {
        universalIdentifier: '7679ee05-cf6c-40a7-9ee6-c3e8053caca5',
      },
      messageThreadPersonUniqueIndex: {
        universalIdentifier: '087f97cb-8c3c-4ea1-9556-933acde6c83b',
      },
      messageThreadCompanyUniqueIndex: {
        universalIdentifier: '30d4f1af-8b6f-4685-802f-8a7cf29f318b',
      },
      messageThreadOpportunityUniqueIndex: {
        universalIdentifier: '1dc0e37e-afb1-4e90-90b4-052374126a6a',
      },
    },
    views: {},
  },
  message: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.message,
    fields: STANDARD_OBJECT_FIELDS.message,
    indexes: {
      messageThreadIdIndex: {
        universalIdentifier: '7a05b45e-7aa6-4a7e-9bbc-299cbed53c96',
      },
      messageCampaignIdIndex: {
        universalIdentifier: '79e777ca-7008-46c5-b3a6-3108b7c7dfb6',
      },
      headerMessageIdIndex: {
        universalIdentifier: '0904b3e4-6052-4a8d-bf41-f12a27c7e34a',
      },
    },
    views: {
      allMessages: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.message,
        fields: STANDARD_OBJECT_FIELDS.message,
        viewFieldNames: [
          'subject',
          'messageThread',
          'messageParticipants',
          'receivedAt',
          'headerMessageId',
          'text',
          'createdAt',
        ],
      }),
      messageRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.message,
        fields: STANDARD_OBJECT_FIELDS.message,
        viewFieldNames: [
          'messageThread',
          'messageParticipants',
          'receivedAt',
          'text',
          'headerMessageId',
          'createdAt',
          'createdBy',
        ],
        viewFieldGroupNames: {
          general: 'General',
          system: 'System',
        },
      }),
    },
  },
  note: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.note,
    fields: STANDARD_OBJECT_FIELDS.note,
    indexes: {
      searchVectorGinIndex: {
        universalIdentifier: '8183c8d2-9114-4b6e-8c5d-12a3b14a5a13',
      },
    },
    views: {
      allNotes: buildStandardObjectIndexView({
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.note,
        fields: STANDARD_OBJECT_FIELDS.note,
        viewFieldNames: [
          'title',
          'noteTargets',
          'bodyV2',
          'createdBy',
          'createdAt',
        ],
      }),
      noteRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.note,
        fields: STANDARD_OBJECT_FIELDS.note,
        viewFieldNames: ['noteTargets', 'attachments', 'timelineActivities'],
        viewFieldGroupNames: {
          general: 'General',
        },
      }),
    },
  },
  noteTarget: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.noteTarget,
    fields: {
      ...STANDARD_OBJECT_FIELDS.noteTarget,
      targetMerchant: {
        universalIdentifier: getSystemRelationFieldUniversalIdentifier({
          applicationUniversalIdentifier:
            TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
          objectUniversalIdentifier:
            STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.noteTarget,
          relationTargetObjectUniversalIdentifier:
            STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.merchant,
        }),
      },
    },
    morphIds: {
      targetMorphId: { morphId: '20202020-f635-435d-ab8d-e1168b375c70' },
    },
    indexes: {
      noteIdIndex: {
        universalIdentifier: '9294d9e3-0225-4c7f-9d6e-23b4c25b6b24',
      },
      personIdIndex: {
        universalIdentifier: '7c069dc0-e83b-4cd5-aaa2-cac7f3e00d80',
      },
      companyIdIndex: {
        universalIdentifier: '2d83909a-a383-4e82-b00a-8b7739f3f906',
      },
      opportunityIdIndex: {
        universalIdentifier: '0d1a59b4-cc87-4b7d-804a-656e8504f371',
      },
      notePersonUniqueIndex: {
        universalIdentifier: '29be76d1-ff4f-4f0f-b05c-f679a234e90a',
      },
      noteCompanyUniqueIndex: {
        universalIdentifier: 'e3b92659-04cf-4496-8fd4-4f32c747c26a',
      },
      noteOpportunityUniqueIndex: {
        universalIdentifier: '58002741-8aa7-4812-b7af-f4cf98dd2433',
      },
    },
    views: {
      allNoteTargets: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.noteTarget,
        fields: STANDARD_OBJECT_FIELDS.noteTarget,
        viewFieldNames: [
          'id',
          'note',
          'targetPerson',
          'targetCompany',
          'targetOpportunity',
        ],
      }),
    },
  },
  opportunity: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity,
    fields: STANDARD_OBJECT_FIELDS.opportunity,
    indexes: {
      pointOfContactIdIndex: {
        universalIdentifier: 'b8c2a673-a981-4357-a43d-313a358e4daa',
      },
      companyIdIndex: {
        universalIdentifier: 'e161072d-37b1-477a-b944-ef0d65289574',
      },
      stageIndex: {
        universalIdentifier: 'ae60d580-b562-44f2-a24d-7b8040063f83',
      },
      searchVectorGinIndex: {
        universalIdentifier: 'f53fdd28-a26b-47ba-81b5-6813ad622720',
      },
    },
    views: {
      allOpportunities: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity,
        fields: STANDARD_OBJECT_FIELDS.opportunity,
        viewFieldNames: [
          'name',
          'amount',
          'createdBy',
          'closeDate',
          'company',
          'pointOfContact',
        ],
      }),
      byStage: {
        universalIdentifier: '20202020-a004-4a04-8a04-0aa0b1ca1ba0',
        viewFields: {
          name: {
            universalIdentifier: '20202020-af04-4a04-8a04-0aa0b2ca2baf',
          },
          amount: {
            universalIdentifier: '20202020-af04-4a04-8a04-0aa0b2ca2bb0',
          },
          createdBy: {
            universalIdentifier: '20202020-af04-4a04-8a04-0aa0b2ca2bb1',
          },
          closeDate: {
            universalIdentifier: '20202020-af04-4a04-8a04-0aa0b2ca2bb2',
          },
          company: {
            universalIdentifier: '20202020-af04-4a04-8a04-0aa0b2ca2bb3',
          },
          pointOfContact: {
            universalIdentifier: '20202020-af04-4a04-8a04-0aa0b2ca2bb4',
          },
        },
        viewGroups: {
          new: {
            universalIdentifier: '20202020-af14-4a04-8a04-0aa0b2ca2bf1',
          },
          screening: {
            universalIdentifier: '20202020-af14-4a04-8a04-0aa0b2ca2bf2',
          },
          meeting: {
            universalIdentifier: '20202020-af14-4a04-8a04-0aa0b2ca2bf3',
          },
          proposal: {
            universalIdentifier: '20202020-af14-4a04-8a04-0aa0b2ca2bf4',
          },
          customer: {
            universalIdentifier: '20202020-af14-4a04-8a04-0aa0b2ca2bf5',
          },
        },
      },
      opportunityRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity,
        fields: STANDARD_OBJECT_FIELDS.opportunity,
        viewFieldNames: [
          'amount',
          'closeDate',
          'stage',
          'company',
          'pointOfContact',
          'owner',
          'createdAt',
          'createdBy',
          'updatedAt',
          'updatedBy',
          'taskTargets',
          'noteTargets',
          'attachments',
          'timelineActivities',
        ],
        viewFieldGroupNames: {
          deal: 'Deal',
          relations: 'Relations',
          system: 'System',
        },
      }),
    },
  },
  person: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person,
    fields: STANDARD_OBJECT_FIELDS.person,
    indexes: {
      companyIdIndex: {
        universalIdentifier: '8a265a5c-d3ae-47dc-bdf9-b42cfa2ba639',
      },
      emailsUniqueIndex: {
        universalIdentifier: '8183a8b2-9114-4f6c-8a5b-12e3f14e5e13',
      },
      searchVectorGinIndex: {
        universalIdentifier: '9294b9c3-0225-4a7d-9b6c-23f4a25f6f24',
      },
    },
    views: {
      allPeople: buildStandardObjectIndexView({
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person,
        fields: STANDARD_OBJECT_FIELDS.person,
        viewFieldNames: [
          'name',
          'emails',
          'createdBy',
          'company',
          'phones',
          'createdAt',
          'jobTitle',
          'linkedinLink',
        ],
      }),
      personRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person,
        fields: STANDARD_OBJECT_FIELDS.person,
        viewFieldNames: [
          'emails',
          'phones',
          'company',
          'jobTitle',
          'linkedinLink',
          'avatarUrl',
          'createdAt',
          'createdBy',
          'updatedAt',
          'updatedBy',
          'avatarFile',
          'pointOfContactForOpportunities',
          'taskTargets',
          'noteTargets',
          'attachments',
          'messageParticipants',
          'calendarEventParticipants',
          'timelineActivities',
        ],
        viewFieldGroupNames: {
          general: 'General',
          work: 'Work',
          social: 'Social',
          system: 'System',
        },
      }),
      messageListRecordPageMembers: {
        universalIdentifier: 'bef79e8e-9ef3-4458-81ed-78a299e2566f',
        viewFields: {
          name: {
            universalIdentifier: 'a4f0d7b4-3956-44a6-8bb2-df45a699609b',
          },
          emails: {
            universalIdentifier: '180e9cbb-34c2-4e27-8648-2915be88a50e',
          },
          company: {
            universalIdentifier: '3db54119-df4d-449b-91c9-22fca1e5d599',
          },
        },
        viewFilters: {
          listMembershipsListIsCurrentRecord: {
            universalIdentifier: '256dceea-a9b5-42b7-8461-a6ce62e7fa6c',
          },
        },
      },
    },
  },
  app: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.app,
    fields: STANDARD_OBJECT_FIELDS.app,
    indexes: {
      searchVectorGinIndex: {
        universalIdentifier: '006c95df-555a-464f-b0f7-22ec7e1f9bad',
      },
    },
    views: {
      allApps: buildStandardObjectIndexView({
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.app,
        fields: STANDARD_OBJECT_FIELDS.app,
        viewFieldNames: ['name', 'createdAt'],
      }),
      appRecordPageFields: {
        universalIdentifier: '50d4ca86-d236-4d67-9ecf-0093a6050037',
        viewFields: {},
      },
    },
  },
  appAccess: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.appAccess,
    fields: STANDARD_OBJECT_FIELDS.appAccess,
    indexes: {
      memberIdIndex: {
        universalIdentifier: '781c730c-4540-41ec-8dd9-74dae7520dce',
      },
      appIdIndex: {
        universalIdentifier: '561123c4-af46-4ecb-ab4e-8889c7236b2b',
      },
      searchVectorGinIndex: {
        universalIdentifier: 'aa1c3d96-e96b-4ae3-ab16-a0815753df0d',
      },
    },
    views: {
      allAppAccesses: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.appAccess,
        fields: STANDARD_OBJECT_FIELDS.appAccess,
        viewFieldNames: ['id', 'member', 'app', 'permissions'],
      }),
    },
  },
  project: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.project,
    fields: STANDARD_OBJECT_FIELDS.project,
    indexes: {
      leadIdIndex: {
        universalIdentifier: 'c57bc5a8-1475-418e-ad82-2641bfc6f6a7',
      },
      appIdIndex: {
        universalIdentifier: '4ddfeef7-afb4-4d24-b2a5-d7a44da5a37b',
      },
    },
    views: {
      allProjects: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.project,
        fields: STANDARD_OBJECT_FIELDS.project,
        viewFieldNames: ['name', 'key', 'category', 'lead', 'createdAt'],
      }),
      projectRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.project,
        fields: STANDARD_OBJECT_FIELDS.project,
        viewFieldNames: [],
        viewFieldGroupNames: {},
      }),
    },
  },
  merchant: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.merchant,
    fields: STANDARD_OBJECT_FIELDS.merchant,
    indexes: {
      appIdIndex: {
        universalIdentifier: 'dfae531a-75a7-4810-babc-b75d3f6c6b4f',
      },
    },
    views: {
      allMerchants: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.merchant,
        fields: STANDARD_OBJECT_FIELDS.merchant,
        viewFieldNames: ['name', 'createdAt'],
      }),
      merchantRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.merchant,
        fields: STANDARD_OBJECT_FIELDS.merchant,
        viewFieldNames: [],
        viewFieldGroupNames: {},
      }),
    },
  },
  sprint: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.sprint,
    fields: STANDARD_OBJECT_FIELDS.sprint,
    indexes: {
      ownerIdIndex: {
        universalIdentifier: '18fd19f9-03d1-44de-830a-31b60bc0f16a',
      },
      projectIdIndex: {
        universalIdentifier: 'f56963a7-0c8a-440e-8087-d4995473a62c',
      },
    },
    views: {
      allSprints: buildStandardObjectIndexView({
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.sprint,
        fields: STANDARD_OBJECT_FIELDS.sprint,
        viewFieldNames: ['name', 'state', 'project', 'startDate', 'createdAt'],
      }),
      sprintRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.sprint,
        fields: STANDARD_OBJECT_FIELDS.sprint,
        viewFieldNames: [],
        viewFieldGroupNames: {},
      }),
    },
  },
  epic: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.epic,
    fields: STANDARD_OBJECT_FIELDS.epic,
    indexes: {
      assigneeIdIndex: {
        universalIdentifier: '2bb103c0-fc1a-45e9-924e-7ebc072f897a',
      },
      projectIdIndex: {
        universalIdentifier: '6191217a-a13b-4a4f-9e54-45c7343f1e65',
      },
    },
    views: {
      allEpics: buildStandardObjectIndexView({
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.epic,
        fields: STANDARD_OBJECT_FIELDS.epic,
        viewFieldNames: ['name', 'project', 'createdAt'],
      }),
      epicRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.epic,
        fields: STANDARD_OBJECT_FIELDS.epic,
        viewFieldNames: [],
        viewFieldGroupNames: {},
      }),
    },
  },
  issueStatus: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.issueStatus,
    fields: STANDARD_OBJECT_FIELDS.issueStatus,
    indexes: {
      projectIdIndex: {
        universalIdentifier: '194eb3e9-808d-4d7b-a5e7-506378d0fdf0',
      },
    },
    views: {
      allIssueStatuses: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.issueStatus,
        fields: STANDARD_OBJECT_FIELDS.issueStatus,
        viewFieldNames: ['name', 'project', 'createdAt'],
      }),
      issueStatusRecordPageFields: {
        universalIdentifier: 'ef6c5f68-28f3-4dc3-8149-a18338e82bbe',
        viewFields: {},
      },
    },
  },
  issue: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.issue,
    fields: STANDARD_OBJECT_FIELDS.issue,
    indexes: {
      assigneeIdIndex: {
        universalIdentifier: 'e99fc4ed-39d5-4864-a5f7-6c7122649eae',
      },
      reporterIdIndex: {
        universalIdentifier: 'db480adb-fdcd-4792-a658-4dd9391bc683',
      },
      projectIdIndex: {
        universalIdentifier: '8a2c3728-f10a-4f47-8d72-9a373044f8b7',
      },
      sprintIdIndex: {
        universalIdentifier: '7e8773bb-0a48-4562-8fde-dff731d6db71',
      },
      epicIdIndex: {
        universalIdentifier: 'aa9f5d42-57e4-4088-bc58-85152a313318',
      },
      parentIdIndex: {
        universalIdentifier: '0f908335-064f-43c1-951d-eef07bac75a0',
      },
      searchVectorGinIndex: {
        universalIdentifier: 'f543d87c-eb35-4d4a-9f1b-ddc07e0c6b74',
      },
    },
    views: {
      allIssues: buildStandardObjectIndexView({
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.issue,
        fields: STANDARD_OBJECT_FIELDS.issue,
        viewFieldNames: [
          'issueKey',
          'title',
          'status',
          'priority',
          'assignee',
          'dueDate',
          'epic',
          'createdAt',
        ],
      }),
      byStatus: {
        universalIdentifier: '29063dae-1487-4cfc-89d2-438980dfc340',
        viewFields: {
          title: {
            universalIdentifier: '7e5fa55b-6c6c-461a-9aea-436b61e096b8',
          },
          priority: {
            universalIdentifier: '596ec971-2835-4b33-b4e0-ddcb0c288159',
          },
          assignee: {
            universalIdentifier: '2cb28927-ecf9-4666-af2b-00be4cc03a76',
          },
        },
        viewGroups: {
          backlog: {
            universalIdentifier: 'b2022e83-5b29-45b8-a5ed-a41ee1530c3e',
          },
          todo: {
            universalIdentifier: 'f7a0b4e7-4894-4a00-bb58-4de76fabc81e',
          },
          inProgress: {
            universalIdentifier: 'b30dba34-1b2c-4aa7-9869-eb180660a2f3',
          },
          inReview: {
            universalIdentifier: '6d0ce965-eec6-4a6a-82c8-54e828549c45',
          },
          done: {
            universalIdentifier: '1414f011-7ac8-4bb4-bfef-3587170709f8',
          },
        },
      },
      issueRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.issue,
        fields: STANDARD_OBJECT_FIELDS.issue,
        viewFieldNames: [],
        viewFieldGroupNames: {},
      }),
    },
  },
  // Junction object backing the Issue<->Merchant many-to-many. Hidden
  // (isSystem) — never browsed directly, only surfaced via Issue.merchants /
  // Merchant.issues relation pickers.
  issueMerchant: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.issueMerchant,
    fields: STANDARD_OBJECT_FIELDS.issueMerchant,
    indexes: {
      issueIdIndex: {
        universalIdentifier: 'c02503bc-259a-4118-9e3d-4fc9747b154b',
      },
      merchantIssueUniqueIndex: {
        universalIdentifier: '0a544ae5-b2d6-442f-826b-66e21f1648d7',
      },
    },
  },
  issueComment: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.issueComment,
    fields: STANDARD_OBJECT_FIELDS.issueComment,
    indexes: {
      issueIdIndex: {
        universalIdentifier: 'b925954e-c188-4f94-8ae6-6077595aa9ee',
      },
      authorIdIndex: {
        universalIdentifier: 'b807834c-9291-4c6d-a221-5097a8015e4b',
      },
      parentCommentIdIndex: {
        universalIdentifier: '6a9645b0-f8c7-41fc-9375-80c660aa31ed',
      },
    },
    views: {
      allIssueComments: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.issueComment,
        fields: STANDARD_OBJECT_FIELDS.issueComment,
        viewFieldNames: ['bodyV2', 'issue', 'author', 'createdAt'],
      }),
      issueCommentRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.issueComment,
        fields: STANDARD_OBJECT_FIELDS.issueComment,
        viewFieldNames: [],
        viewFieldGroupNames: {},
      }),
    },
  },
  worklog: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.worklog,
    fields: STANDARD_OBJECT_FIELDS.worklog,
    indexes: {
      issueIdIndex: {
        universalIdentifier: '40ec70bd-7fc8-40fa-9c9b-d3221b0ca083',
      },
      memberIdIndex: {
        universalIdentifier: '5a2cfc6c-52a1-4a90-8f12-72c516f5e293',
      },
    },
    views: {
      allWorklogs: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.worklog,
        fields: STANDARD_OBJECT_FIELDS.worklog,
        viewFieldNames: [
          'description',
          'timeSpentMinutes',
          'startedAt',
          'issue',
          'createdAt',
        ],
      }),
      worklogRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.worklog,
        fields: STANDARD_OBJECT_FIELDS.worklog,
        viewFieldNames: [],
        viewFieldGroupNames: {},
      }),
    },
  },
  shiftTemplate: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.shiftTemplate,
    fields: STANDARD_OBJECT_FIELDS.shiftTemplate,
    indexes: {
      isActiveIndex: {
        universalIdentifier: '440cb5ec-fabb-4575-93ef-6ded444db247',
      },
      codeIndex: {
        universalIdentifier: '2933e33d-0cbb-48d7-a912-00ee7a38ca0e',
      },
    },
    views: {
      allShiftTemplates: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.shiftTemplate,
        fields: STANDARD_OBJECT_FIELDS.shiftTemplate,
        viewFieldNames: [
          'name',
          'code',
          'startTime',
          'endTime',
          'dayKind',
          'isActive',
        ],
      }),
      shiftTemplateRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.shiftTemplate,
        fields: STANDARD_OBJECT_FIELDS.shiftTemplate,
        viewFieldNames: [],
        viewFieldGroupNames: {},
      }),
    },
  },
  specialDay: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.specialDay,
    fields: STANDARD_OBJECT_FIELDS.specialDay,
    indexes: {
      kindIsActiveIndex: {
        universalIdentifier: 'a8ea95df-ce34-4cbb-ad33-081c7c071f89',
      },
    },
    views: {
      allSpecialDays: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.specialDay,
        fields: STANDARD_OBJECT_FIELDS.specialDay,
        viewFieldNames: [
          'name',
          'kind',
          'month',
          'day',
          'date',
          'multiplier',
          'isActive',
        ],
      }),
      specialDayRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.specialDay,
        fields: STANDARD_OBJECT_FIELDS.specialDay,
        viewFieldNames: [],
        viewFieldGroupNames: {},
      }),
    },
  },
  shift: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.shift,
    fields: STANDARD_OBJECT_FIELDS.shift,
    indexes: {
      memberIdIndex: {
        universalIdentifier: '5af540b9-a3e6-47be-bd1d-5905ea0d5ad8',
      },
      shiftTemplateIdIndex: {
        universalIdentifier: '6ab554f5-3cc2-428e-8230-cff5ff493675',
      },
      dateIndex: {
        universalIdentifier: '53a29b1a-5acc-4712-ae5e-912083e543dd',
      },
    },
    views: {
      allShifts: buildStandardObjectIndexView({
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.shift,
        fields: STANDARD_OBJECT_FIELDS.shift,
        viewFieldNames: [
          'name',
          'date',
          'status',
          'member',
          'templateCode',
          'checkInAt',
          'checkOutAt',
          'checkInLateMinutes',
          'workingMinutes',
        ],
      }),
      shiftRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.shift,
        fields: STANDARD_OBJECT_FIELDS.shift,
        viewFieldNames: [],
        viewFieldGroupNames: {},
      }),
    },
  },
  recordShare: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.recordShare,
    fields: STANDARD_OBJECT_FIELDS.recordShare,
    indexes: {
      recordPrincipalCauseSourceUniqueIndex: {
        universalIdentifier: '4580f104-47a7-4110-87a8-26cb6f63ce7b',
      },
      principalIdIndex: {
        universalIdentifier: '66fbc3d2-6126-4e29-a306-dbe9995bf062',
      },
      sourceIdIndex: {
        universalIdentifier: '21b84593-c647-40ce-bdf4-a8b4ac658f57',
      },
    },
    views: {},
  },
  task: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task,
    fields: STANDARD_OBJECT_FIELDS.task,
    indexes: {
      assigneeIdIndex: {
        universalIdentifier: 'f48fa3b1-0cec-44da-a9e5-f8a5e766637e',
      },
      searchVectorGinIndex: {
        universalIdentifier: 'a86b32b3-01d3-4302-a152-8b7f247db7b4',
      },
    },
    views: {
      allTasks: buildStandardObjectIndexView({
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task,
        fields: STANDARD_OBJECT_FIELDS.task,
        viewFieldNames: [
          'title',
          'status',
          'taskTargets',
          'createdBy',
          'dueAt',
          'assignee',
          'bodyV2',
          'createdAt',
        ],
      }),
      assignedToMe: {
        universalIdentifier: '20202020-a007-4a07-8a07-ba5ca551aaed',
        viewFields: {
          title: {
            universalIdentifier: '20202020-af07-4a07-8a07-ba5ca551aaed',
          },
          taskTargets: {
            universalIdentifier: '20202020-af07-4a07-8a07-ba5ca551aaee',
          },
          createdBy: {
            universalIdentifier: '20202020-af07-4a07-8a07-ba5ca551aaef',
          },
          dueAt: {
            universalIdentifier: '20202020-af07-4a07-8a07-ba5ca551aaf0',
          },
          assignee: {
            universalIdentifier: '20202020-af07-4a07-8a07-ba5ca551aaf1',
          },
          bodyV2: {
            universalIdentifier: '20202020-af07-4a07-8a07-ba5ca551aaf2',
          },
          createdAt: {
            universalIdentifier: '20202020-af07-4a07-8a07-ba5ca551aaf3',
          },
        },
        viewFilters: {
          assigneeIsMe: {
            universalIdentifier: '20202020-af17-4a07-8a07-ba5ca551abf1',
          },
        },
        viewGroups: {
          todo: {
            universalIdentifier: '20202020-af17-4a07-8a07-ba5ca551abf2',
          },
          inProgress: {
            universalIdentifier: '20202020-af17-4a07-8a07-ba5ca551abf3',
          },
          done: {
            universalIdentifier: '20202020-af17-4a07-8a07-ba5ca551abf4',
          },
          empty: {
            universalIdentifier: '20202020-af17-4a07-8a07-ba5ca551abf5',
          },
        },
      },
      byStatus: {
        universalIdentifier: '20202020-a008-4a08-8a08-ba5cba51aba5',
        viewFields: {
          title: {
            universalIdentifier: '20202020-af08-4a08-8a08-ba5cba5babf0',
          },
          status: {
            universalIdentifier: '20202020-af08-4a08-8a08-ba5cba5babf1',
          },
          dueAt: {
            universalIdentifier: '20202020-af08-4a08-8a08-ba5cba5babf2',
          },
          assignee: {
            universalIdentifier: '20202020-af08-4a08-8a08-ba5cba5babf3',
          },
          createdAt: {
            universalIdentifier: '20202020-af08-4a08-8a08-ba5cba5babf4',
          },
        },
        viewGroups: {
          todo: {
            universalIdentifier: '20202020-af18-4a08-8a08-ba5cba5bbf01',
          },
          inProgress: {
            universalIdentifier: '20202020-af18-4a08-8a08-ba5cba5bbf02',
          },
          done: {
            universalIdentifier: '20202020-af18-4a08-8a08-ba5cba5bbf03',
          },
        },
      },
      taskRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task,
        fields: STANDARD_OBJECT_FIELDS.task,
        viewFieldNames: [
          'dueAt',
          'status',
          'assignee',
          'taskTargets',
          'attachments',
          'timelineActivities',
        ],
        viewFieldGroupNames: {
          general: 'General',
        },
      }),
    },
  },
  taskTarget: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.taskTarget,
    fields: {
      ...STANDARD_OBJECT_FIELDS.taskTarget,
      targetMerchant: {
        universalIdentifier: getSystemRelationFieldUniversalIdentifier({
          applicationUniversalIdentifier:
            TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
          objectUniversalIdentifier:
            STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.taskTarget,
          relationTargetObjectUniversalIdentifier:
            STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.merchant,
        }),
      },
    },
    morphIds: {
      targetMorphId: { morphId: '20202020-f636-435d-ab8d-e1168b375c71' },
    },
    indexes: {
      taskIdIndex: {
        universalIdentifier: 'c882f7a4-b025-4d32-aa26-5ef2595bdbf9',
      },
      personIdIndex: {
        universalIdentifier: 'b7d305d1-6fae-4ed6-9bdc-354fe9032c0e',
      },
      companyIdIndex: {
        universalIdentifier: 'c0af54c7-751b-4bb2-b102-677cc4e47402',
      },
      opportunityIdIndex: {
        universalIdentifier: '6942e0ba-90f6-4c33-bf40-7f00b1ec35ab',
      },
      taskPersonUniqueIndex: {
        universalIdentifier: '4adf4d5a-ad69-4c5c-bc62-2807816b3aa8',
      },
      taskCompanyUniqueIndex: {
        universalIdentifier: '637dce5e-f609-49f4-89e3-c0ef9e330d3a',
      },
      taskOpportunityUniqueIndex: {
        universalIdentifier: 'eb5422ff-7a41-48d2-a2df-3de1cbf7bced',
      },
    },
    views: {
      allTaskTargets: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.taskTarget,
        fields: STANDARD_OBJECT_FIELDS.taskTarget,
        viewFieldNames: [
          'id',
          'task',
          'targetPerson',
          'targetCompany',
          'targetOpportunity',
        ],
      }),
    },
  },
  timelineActivity: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity,
    fields: {
      ...STANDARD_OBJECT_FIELDS.timelineActivity,
      targetIssue: {
        universalIdentifier: getSystemRelationFieldUniversalIdentifier({
          applicationUniversalIdentifier:
            TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
          objectUniversalIdentifier:
            STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity,
          relationTargetObjectUniversalIdentifier:
            STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.issue,
        }),
      },
      targetEpic: {
        universalIdentifier: getSystemRelationFieldUniversalIdentifier({
          applicationUniversalIdentifier:
            TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
          objectUniversalIdentifier:
            STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity,
          relationTargetObjectUniversalIdentifier:
            STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.epic,
        }),
      },
      targetMerchant: {
        universalIdentifier: getSystemRelationFieldUniversalIdentifier({
          applicationUniversalIdentifier:
            TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
          objectUniversalIdentifier:
            STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity,
          relationTargetObjectUniversalIdentifier:
            STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.merchant,
        }),
      },
    },
    morphIds: {
      targetMorphId: { morphId: '20202020-9a2b-4c3d-a4e5-f6a7b8c9d0e1' },
    },
    indexes: {
      workspaceMemberIdIndex: {
        universalIdentifier: '5e0b2391-85ca-4a66-aef4-52d74245bec2',
      },
      personIdIndex: {
        universalIdentifier: '3e89a914-7bec-47bd-9cf9-743c6b83d001',
      },
      companyIdIndex: {
        universalIdentifier: '8183e8f2-9114-4d6a-8e5f-12c3d14c5c13',
      },
      opportunityIdIndex: {
        universalIdentifier: '9294f9a3-0225-4e7b-9f6a-23d4e25d6d24',
      },
      noteIdIndex: {
        universalIdentifier: '995db1d8-0d3e-40f7-b0eb-5e6897bc9966',
      },
      taskIdIndex: {
        universalIdentifier: '609cf622-86ef-48d1-812b-e1cab610a46c',
      },
      workflowIdIndex: {
        universalIdentifier: 'd6059ec2-92b0-4cfc-9fd8-78050f03108f',
      },
      workflowVersionIdIndex: {
        universalIdentifier: 'd94329b3-5dc8-4141-ae28-31afe28f7135',
      },
      workflowRunIdIndex: {
        universalIdentifier: '1a2bd046-7c23-4e0a-9f8a-c3ca3a16d3b9',
      },
      dashboardIdIndex: {
        universalIdentifier: 'e8821da9-728d-470a-bf5b-5a981fff7880',
      },
      messageListIdIndex: {
        universalIdentifier: 'a251f71a-c698-4526-8817-0e7c803c158e',
      },
      messageCampaignIdIndex: {
        universalIdentifier: 'e808e721-91cc-4b9b-b24b-806d64b4d5e2',
      },
    },
    views: {
      allTimelineActivities: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity,
        fields: STANDARD_OBJECT_FIELDS.timelineActivity,
        viewFieldNames: [
          'linkedRecordCachedName',
          'happensAt',
          'workspaceMember',
          'targetPerson',
          'targetCompany',
          'targetOpportunity',
          'targetTask',
          'targetNote',
          'targetWorkflow',
          'targetWorkflowVersion',
          'targetWorkflowRun',
          'targetDashboard',
        ],
      }),
    },
  },
  workflow: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflow,
    fields: STANDARD_OBJECT_FIELDS.workflow,
    indexes: {
      searchVectorGinIndex: {
        universalIdentifier: 'c7e64c55-eb0c-4b93-b076-5cfcf2e2e042',
      },
    },
    views: {
      allWorkflows: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflow,
        fields: STANDARD_OBJECT_FIELDS.workflow,
        viewFieldNames: [
          'name',
          'statuses',
          'updatedAt',
          'createdBy',
          'versions',
          'runs',
        ],
      }),
    },
  },
  workflowAutomatedTrigger: {
    universalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflowAutomatedTrigger,
    fields: STANDARD_OBJECT_FIELDS.workflowAutomatedTrigger,
    indexes: {
      workflowIdIndex: {
        universalIdentifier: '7331ff89-a3f9-4ac0-9fa9-0de5663ae7b2',
      },
    },
    views: {
      allWorkflowAutomatedTriggers: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflowAutomatedTrigger,
        fields: STANDARD_OBJECT_FIELDS.workflowAutomatedTrigger,
        viewFieldNames: ['type', 'workflow', 'createdAt'],
      }),
      workflowAutomatedTriggerRecordPageFields:
        buildStandardObjectRecordPageFieldsView({
          objectUniversalIdentifier:
            STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflowAutomatedTrigger,
          fields: STANDARD_OBJECT_FIELDS.workflowAutomatedTrigger,
          viewFieldNames: ['type', 'workflow', 'createdAt', 'createdBy'],
          viewFieldGroupNames: {
            general: 'General',
            system: 'System',
          },
        }),
    },
  },
  workflowRun: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflowRun,
    fields: STANDARD_OBJECT_FIELDS.workflowRun,
    indexes: {
      workflowVersionIdIndex: {
        universalIdentifier: '8183c8d2-9114-4b6e-8c5d-12a3b14a5a14',
      },
      workflowIdIndex: {
        universalIdentifier: '9294d9e3-0225-4c7f-9d6e-23b4c25b6b25',
      },
      searchVectorGinIndex: {
        universalIdentifier: 'e0ac5ad2-d0c8-4f72-b710-8e53b9dc18d9',
      },
    },
    views: {
      allWorkflowRuns: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflowRun,
        fields: STANDARD_OBJECT_FIELDS.workflowRun,
        viewFieldNames: ['name', 'workflow', 'status'],
      }),
      workflowRunRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflowRun,
        fields: STANDARD_OBJECT_FIELDS.workflowRun,
        viewFieldNames: [
          'status',
          'workflow',
          'workflowVersion',
          'startedAt',
          'endedAt',
          'createdAt',
          'createdBy',
          'enqueuedAt',
          'state',
          'updatedAt',
          'updatedBy',
          'timelineActivities',
        ],
        viewFieldGroupNames: {
          general: 'General',
          system: 'System',
        },
      }),
    },
  },
  workflowVersion: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflowVersion,
    fields: STANDARD_OBJECT_FIELDS.workflowVersion,
    indexes: {
      workflowIdIndex: {
        universalIdentifier: '8138c3b3-0b14-4ee1-be0e-debdde6b3219',
      },
      searchVectorGinIndex: {
        universalIdentifier: '6f3a65eb-2aee-4108-b8a0-c62da419d1dc',
      },
    },
    views: {
      allWorkflowVersions: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflowVersion,
        fields: STANDARD_OBJECT_FIELDS.workflowVersion,
        viewFieldNames: ['name', 'workflow', 'status', 'updatedAt', 'runs'],
      }),
      workflowVersionRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflowVersion,
        fields: STANDARD_OBJECT_FIELDS.workflowVersion,
        viewFieldNames: [
          'status',
          'workflow',
          'trigger',
          'createdAt',
          'steps',
          'createdBy',
          'updatedAt',
          'updatedBy',
          'runs',
          'timelineActivities',
        ],
        viewFieldGroupNames: {
          general: 'General',
          system: 'System',
        },
      }),
    },
  },
  workspaceMember: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember,
    fields: {
      ...STANDARD_OBJECT_FIELDS.workspaceMember,
      ledProjects: {
        universalIdentifier: '7fc50f3f-4899-47ea-b2a7-16be876df920',
      },
      assignedIssues: {
        universalIdentifier: '927b149b-b4f0-4805-b867-42609cd029c6',
      },
      reportedIssues: {
        universalIdentifier: '664aacfe-c0e0-49b1-8f1f-f8cfab07cf2f',
      },
      assignedEpics: {
        universalIdentifier: 'a5f85db6-3ecb-47bd-8dd3-854a3fdb0160',
      },
      ownedSprints: {
        universalIdentifier: 'efcc2e97-f62b-4994-8c14-84053fd0d67c',
      },
      issueComments: {
        universalIdentifier: 'da781bbf-a15e-4948-9712-3dcc14ab5545',
      },
      worklogs: {
        universalIdentifier: 'c0bf79c9-1bbd-438a-b4de-3a0a7960e212',
      },
      shifts: {
        universalIdentifier: '217853a5-299d-4b07-8b6b-cf1e8c3bc14b',
      },
      appAccesses: {
        universalIdentifier: '288d8f20-66ea-40e6-afc8-f2c73aa18d99',
      },
    },
    indexes: {
      userEmailUniqueIndex: {
        universalIdentifier: '76da5f27-523c-44b6-ad06-12954f6b949f',
      },
      searchVectorGinIndex: {
        universalIdentifier: '8678dde9-a804-4a9e-80e3-9af35e471ec5',
      },
    },
    views: {
      allWorkspaceMembers: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember,
        fields: STANDARD_OBJECT_FIELDS.workspaceMember,
        viewFieldNames: [
          'name',
          'createdAt',
          'ownedOpportunities',
          'assignedTasks',
        ],
      }),
    },
  },
  agentChatThread: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.agentChatThread,
    fields: STANDARD_OBJECT_FIELDS.agentChatThread,
    indexes: {
      ownerIndex: {
        universalIdentifier: 'c97a4c97-266b-490a-a4d6-76274f5de429',
      },
    },
  },
  agentTurn: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.agentTurn,
    fields: STANDARD_OBJECT_FIELDS.agentTurn,
    indexes: {
      agentIndex: {
        universalIdentifier: '606e8ba3-f322-426b-bef8-2208f67a541a',
      },
      threadIndex: {
        universalIdentifier: '7d351559-4546-4307-ba28-de9fc4c40ef4',
      },
    },
  },
  agentMessage: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.agentMessage,
    fields: STANDARD_OBJECT_FIELDS.agentMessage,
    indexes: {
      agentIndex: {
        universalIdentifier: '465b20e1-d4cd-4d80-a85b-78bd1f0e70ad',
      },
      threadIndex: {
        universalIdentifier: '2054f1a5-554f-42ac-a41a-b8ccd6ba72ec',
      },
      turnIndex: {
        universalIdentifier: 'dc46f804-a55f-4283-884e-9cb938741da3',
      },
      hiddenKickoffIndex: {
        universalIdentifier: '1d423c31-007a-4fcd-8514-dcb1f7a8fa78',
      },
    },
  },
  agentMessagePart: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.agentMessagePart,
    fields: STANDARD_OBJECT_FIELDS.agentMessagePart,
    indexes: {
      messageOrderIndex: {
        universalIdentifier: 'f5a08f6f-cf91-4996-9c21-2af64a17ca83',
      },
    },
  },
  agentTurnEvaluation: {
    universalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.agentTurnEvaluation,
    fields: STANDARD_OBJECT_FIELDS.agentTurnEvaluation,
    indexes: {
      turnIndex: {
        universalIdentifier: 'f85d8283-84ae-4343-8328-8c4e21c5b984',
      },
    },
  },
} as const satisfies Record<
  string,
  {
    universalIdentifier: string;
    morphIds?: Record<string, { morphId: string }>;
    fields: Record<string, { universalIdentifier: string }>;
    indexes: Record<string, { universalIdentifier: string }>;
    views?: Record<
      string,
      {
        universalIdentifier: string;
        viewFields: Record<string, { universalIdentifier: string }>;
        viewFieldGroups?: Record<string, { universalIdentifier: string }>;
        viewFilters?: Record<string, { universalIdentifier: string }>;
        viewGroups?: Record<string, { universalIdentifier: string }>;
      }
    >;
  }
>;
