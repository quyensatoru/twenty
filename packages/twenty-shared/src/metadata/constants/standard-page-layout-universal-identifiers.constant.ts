import { STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS } from '@/metadata/constants/standard-object-universal-identifiers.constant';
import { buildStandardObjectRecordPageLayout } from '@/metadata/utils/internal/build-standard-object-record-page-layout.util';

// Never mutate an existing universal identifier
// Deleting an existing universal identifier should be very rare
// Record-page layout universal identifiers are deterministically derived by
// buildStandardObjectRecordPageLayout (layout keyed on the object + the
// name-free RECORD_PAGE discriminator, tabs on their title within the layout,
// widgets on their title within their tab). The titles passed here MUST match
// the ones the server standard page-layout configs assign.

export const STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS = {
  myFirstDashboard: {
    universalIdentifier: '20202020-d001-4d01-8d01-da5ab0a00001',
    tabs: {
      tab1: {
        universalIdentifier: '20202020-d011-4d11-8d11-da5ab0a01001',
        widgets: {
          welcomeRichText: {
            universalIdentifier: '20202020-d111-4d11-8d11-da5ab0a11001',
          },
          dealsByCompany: {
            universalIdentifier: '20202020-d111-4d11-8d11-da5ab0a11002',
          },
          pipelineValueByStage: {
            universalIdentifier: '20202020-d111-4d11-8d11-da5ab0a11003',
          },
          revenueTimeline: {
            universalIdentifier: '20202020-d111-4d11-8d11-da5ab0a11004',
          },
          opportunitiesByOwner: {
            universalIdentifier: '20202020-d111-4d11-8d11-da5ab0a11005',
          },
          stockMarketIframe: {
            universalIdentifier: '20202020-d111-4d11-8d11-da5ab0a11006',
          },
          dealsCreatedThisMonth: {
            universalIdentifier: '20202020-d111-4d11-8d11-da5ab0a11007',
          },
          dealValueCreatedThisMonth: {
            universalIdentifier: '20202020-d111-4d11-8d11-da5ab0a11008',
          },
        },
      },
    },
  },
  companyRecordPage: buildStandardObjectRecordPageLayout({
    objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company,
    tabs: {
      home: {
        title: 'Home',
        widgets: {
          fields: 'Fields',
          people: 'People',
          opportunities: 'Opportunities',
        },
      },
      timeline: {
        title: 'Timeline',
        widgets: {
          timeline: 'Timeline',
        },
      },
      tasks: {
        title: 'Tasks',
        widgets: {
          tasks: 'Tasks',
        },
      },
      notes: {
        title: 'Notes',
        widgets: {
          notes: 'Notes',
        },
      },
      files: {
        title: 'Files',
        widgets: {
          files: 'Files',
        },
      },
      emails: {
        title: 'Emails',
        widgets: {
          emails: 'Emails',
        },
      },
      calendar: {
        title: 'Calendar',
        widgets: {
          calendar: 'Calendar',
        },
      },
    },
  }),
  personRecordPage: buildStandardObjectRecordPageLayout({
    objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person,
    tabs: {
      home: {
        title: 'Home',
        widgets: {
          fields: 'Fields',
          company: 'Company',
          pointOfContactForOpportunities: 'Opportunities',
          listMemberships: 'Lists',
        },
      },
      timeline: {
        title: 'Timeline',
        widgets: {
          timeline: 'Timeline',
        },
      },
      tasks: {
        title: 'Tasks',
        widgets: {
          tasks: 'Tasks',
        },
      },
      notes: {
        title: 'Notes',
        widgets: {
          notes: 'Notes',
        },
      },
      files: {
        title: 'Files',
        widgets: {
          files: 'Files',
        },
      },
      emails: {
        title: 'Emails',
        widgets: {
          emails: 'Emails',
        },
      },
      calendar: {
        title: 'Calendar',
        widgets: {
          calendar: 'Calendar',
        },
      },
    },
  }),
  opportunityRecordPage: buildStandardObjectRecordPageLayout({
    objectUniversalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity,
    tabs: {
      home: {
        title: 'Home',
        widgets: {
          fields: 'Fields',
          pointOfContact: 'Point of Contact',
          company: 'Company',
          owner: 'Owner',
        },
      },
      timeline: {
        title: 'Timeline',
        widgets: {
          timeline: 'Timeline',
        },
      },
      tasks: {
        title: 'Tasks',
        widgets: {
          tasks: 'Tasks',
        },
      },
      notes: {
        title: 'Notes',
        widgets: {
          notes: 'Notes',
        },
      },
      files: {
        title: 'Files',
        widgets: {
          files: 'Files',
        },
      },
      emails: {
        title: 'Emails',
        widgets: {
          emails: 'Emails',
        },
      },
      calendar: {
        title: 'Calendar',
        widgets: {
          calendar: 'Calendar',
        },
      },
    },
  }),
  noteRecordPage: buildStandardObjectRecordPageLayout({
    objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.note,
    tabs: {
      home: {
        title: 'Home',
        widgets: {
          fields: 'Fields',
          noteRichText: 'Note',
        },
      },
      note: {
        title: 'Note',
        widgets: {
          noteRichText: 'Note',
        },
      },
      timeline: {
        title: 'Timeline',
        widgets: {
          timeline: 'Timeline',
        },
      },
      files: {
        title: 'Files',
        widgets: {
          files: 'Files',
        },
      },
    },
  }),
  taskRecordPage: buildStandardObjectRecordPageLayout({
    objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task,
    tabs: {
      home: {
        title: 'Home',
        widgets: {
          fields: 'Fields',
          taskRichText: 'Task',
        },
      },
      note: {
        title: 'Note',
        widgets: {
          taskRichText: 'Task',
        },
      },
      timeline: {
        title: 'Timeline',
        widgets: {
          timeline: 'Timeline',
        },
      },
      files: {
        title: 'Files',
        widgets: {
          files: 'Files',
        },
      },
    },
  }),
  workflowRecordPage: buildStandardObjectRecordPageLayout({
    objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflow,
    tabs: {
      flow: {
        title: 'Flow',
        widgets: {
          workflow: 'Flow',
        },
      },
    },
  }),
  workflowVersionRecordPage: buildStandardObjectRecordPageLayout({
    objectUniversalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflowVersion,
    tabs: {
      home: {
        title: 'Home',
        widgets: {
          fields: 'Fields',
          workflow: 'Workflow',
        },
      },
      flow: {
        title: 'Flow',
        widgets: {
          workflowVersion: 'Flow',
        },
      },
    },
  }),
  workflowRunRecordPage: buildStandardObjectRecordPageLayout({
    objectUniversalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflowRun,
    tabs: {
      home: {
        title: 'Home',
        widgets: {
          fields: 'Fields',
          workflow: 'Workflow',
        },
      },
      flow: {
        title: 'Flow',
        widgets: {
          workflowRun: 'Flow',
        },
      },
    },
  }),
  blocklistRecordPage: buildStandardObjectRecordPageLayout({
    objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.blocklist,
    tabs: {
      home: {
        title: 'Home',
        widgets: {
          fields: 'Fields',
        },
      },
      timeline: {
        title: 'Timeline',
        widgets: {
          timeline: 'Timeline',
        },
      },
    },
  }),
  calendarChannelEventAssociationRecordPage:
    buildStandardObjectRecordPageLayout({
      objectUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.calendarChannelEventAssociation,
      tabs: {
        home: {
          title: 'Home',
          widgets: {
            fields: 'Fields',
          },
        },
        timeline: {
          title: 'Timeline',
          widgets: {
            timeline: 'Timeline',
          },
        },
      },
    }),
  calendarEventRecordPage: buildStandardObjectRecordPageLayout({
    objectUniversalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.calendarEvent,
    tabs: {
      home: {
        title: 'Home',
        widgets: {
          fields: 'Fields',
          participants: 'Participants',
          callRecordings: 'Call Recordings',
        },
      },
      timeline: {
        title: 'Timeline',
        widgets: {
          timeline: 'Timeline',
        },
      },
      summary: {
        title: 'Summary',
        widgets: {
          summary: 'Summary',
        },
      },
      callRecording: {
        title: 'Call Recording',
        widgets: {
          transcript: 'Transcript',
        },
      },
    },
  }),
  calendarEventParticipantRecordPage: buildStandardObjectRecordPageLayout({
    objectUniversalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.calendarEventParticipant,
    tabs: {
      home: {
        title: 'Home',
        widgets: {
          fields: 'Fields',
        },
      },
      timeline: {
        title: 'Timeline',
        widgets: {
          timeline: 'Timeline',
        },
      },
    },
  }),
  callRecordingRecordPage: buildStandardObjectRecordPageLayout({
    objectUniversalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.callRecording,
    tabs: {
      home: {
        title: 'Home',
        widgets: {
          fields: 'Fields',
        },
      },
      timeline: {
        title: 'Timeline',
        widgets: {
          timeline: 'Timeline',
        },
      },
      summary: {
        title: 'Summary',
        widgets: {
          summary: 'Summary',
        },
      },
      callRecording: {
        title: 'Call Recording',
        widgets: {
          transcript: 'Transcript',
        },
      },
    },
  }),
  messageChannelMessageAssociationRecordPage:
    buildStandardObjectRecordPageLayout({
      objectUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageChannelMessageAssociation,
      tabs: {
        home: {
          title: 'Home',
          widgets: {
            fields: 'Fields',
          },
        },
        timeline: {
          title: 'Timeline',
          widgets: {
            timeline: 'Timeline',
          },
        },
      },
    }),
  messageChannelMessageAssociationMessageFolderRecordPage:
    buildStandardObjectRecordPageLayout({
      objectUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageChannelMessageAssociationMessageFolder,
      tabs: {
        home: {
          title: 'Home',
          widgets: {
            fields: 'Fields',
          },
        },
        timeline: {
          title: 'Timeline',
          widgets: {
            timeline: 'Timeline',
          },
        },
      },
    }),
  messageParticipantRecordPage: buildStandardObjectRecordPageLayout({
    objectUniversalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageParticipant,
    tabs: {
      home: {
        title: 'Home',
        widgets: {
          fields: 'Fields',
        },
      },
      timeline: {
        title: 'Timeline',
        widgets: {
          timeline: 'Timeline',
        },
      },
    },
  }),
  workflowAutomatedTriggerRecordPage: buildStandardObjectRecordPageLayout({
    objectUniversalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflowAutomatedTrigger,
    tabs: {
      home: {
        title: 'Home',
        widgets: {
          fields: 'Fields',
        },
      },
      timeline: {
        title: 'Timeline',
        widgets: {
          timeline: 'Timeline',
        },
      },
    },
  }),
  messageRecordPage: buildStandardObjectRecordPageLayout({
    objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.message,
    tabs: {
      home: {
        title: 'Home',
        widgets: {
          fields: 'Fields',
        },
      },
    },
  }),
  messageThreadRecordPage: buildStandardObjectRecordPageLayout({
    objectUniversalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageThread,
    tabs: {
      home: {
        title: 'Home',
        widgets: {
          emailThread: 'Thread',
        },
      },
    },
  }),
  messageListRecordPage: buildStandardObjectRecordPageLayout({
    objectUniversalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageList,
    tabs: {
      home: {
        title: 'Home',
        widgets: {
          fields: 'Fields',
          members: 'Members',
        },
      },
      members: {
        title: 'Members',
        widgets: {
          members: 'Members',
        },
      },
    },
  }),
  messageCampaignRecordPage: buildStandardObjectRecordPageLayout({
    objectUniversalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageCampaign,
    tabs: {
      home: {
        title: 'Home',
        widgets: {
          details: 'Details',
          list: 'List',
          recipients: 'Recipients',
          fields: 'Fields',
        },
      },
      composer: {
        title: 'Email',
        widgets: {
          messageCampaign: 'Email',
        },
      },
    },
  }),
  projectRecordPage: {
    universalIdentifier: '1b1204ab-f0ca-41aa-ac9f-2174d85af3ec',
    tabs: {
      home: {
        universalIdentifier: 'f6ca20a1-9f20-4dd4-aa7b-4f2c0598eae6',
        widgets: {
          fields: {
            universalIdentifier: 'b187d9cf-2416-4e6f-a43e-0599880c6bde',
          },
        },
      },
    },
  },
  sprintRecordPage: {
    universalIdentifier: 'd43665dc-d6e6-4521-9f8f-9473b37c5334',
    tabs: {
      home: {
        universalIdentifier: '448fc205-52a6-4e68-868a-6fb5e672cf66',
        widgets: {
          fields: {
            universalIdentifier: '874c7912-618b-412e-a84e-3c0ecba72910',
          },
        },
      },
    },
  },
  epicRecordPage: {
    universalIdentifier: 'ab505298-a470-46e4-813e-5a552fe26eed',
    tabs: {
      home: {
        universalIdentifier: '1384251a-9ce2-4850-9502-f14a6bb5a058',
        widgets: {
          fields: {
            universalIdentifier: 'f953d36c-5086-4d0d-b259-5268800b10d3',
          },
        },
      },
      timeline: {
        universalIdentifier: '9ed67505-a5ff-4742-9ff3-e760170c0d86',
        widgets: {
          timeline: {
            universalIdentifier: 'd8aa7c29-0d36-4e3e-baf1-9c2643950d0b',
          },
        },
      },
    },
  },
  issueRecordPage: {
    universalIdentifier: '54851c38-c3f6-4853-a40e-18e942e97e55',
    tabs: {
      home: {
        universalIdentifier: 'c133e103-4229-47f9-b977-993d4e7d8555',
        widgets: {
          fields: {
            universalIdentifier: '5d8b1f0f-d3ad-4b66-89b5-b81b7b92608c',
          },
        },
      },
      timeline: {
        universalIdentifier: '9dd0bd67-8d35-4e23-b07c-0583e7b0b197',
        widgets: {
          timeline: {
            universalIdentifier: '4b77d8d2-6464-45a8-9497-7cdb94ce908d',
          },
        },
      },
    },
  },
  issueCommentRecordPage: {
    universalIdentifier: '57108a33-5331-4a0b-9649-171d0bfd4d40',
    tabs: {
      home: {
        universalIdentifier: '8c5e17d3-96b6-4857-84df-fad20de3d4d4',
        widgets: {
          fields: {
            universalIdentifier: '083d7abc-b699-4e64-b65f-f595b0f780da',
          },
        },
      },
    },
  },
  worklogRecordPage: {
    universalIdentifier: '07b7478a-ac07-42f2-b551-31f5f7a84f32',
    tabs: {
      home: {
        universalIdentifier: 'e59f540d-fc58-4f4b-b47f-b37b31149b51',
        widgets: {
          fields: {
            universalIdentifier: '26181cd9-cbeb-4f5e-9ef2-2b8ae51771c5',
          },
        },
      },
    },
  },
  shiftTemplateRecordPage: {
    universalIdentifier: '93448a17-a03a-4de2-9174-d0f811ee83f7',
    tabs: {
      home: {
        universalIdentifier: 'b2ca63c9-df6f-4744-bd18-7f131a24cd7a',
        widgets: {
          fields: {
            universalIdentifier: 'ad0bdb63-f170-4fdb-885f-a5f317829f68',
          },
        },
      },
    },
  },
  specialDayRecordPage: {
    universalIdentifier: 'd5ee38ca-a2fe-408e-b71d-6673d48dd74b',
    tabs: {
      home: {
        universalIdentifier: '71698c40-9e46-4bc6-a782-1b9b6dee3f15',
        widgets: {
          fields: {
            universalIdentifier: '7e7a231c-74ca-46d4-9332-fbad34d229ef',
          },
        },
      },
    },
  },
  shiftRecordPage: {
    universalIdentifier: '7bcd575f-feb9-43a3-b492-33333a734cf5',
    tabs: {
      home: {
        universalIdentifier: '7fccd49a-53e4-4cf8-936e-0d11bdd78220',
        widgets: {
          fields: {
            universalIdentifier: '1af603c5-71a4-42bc-b057-0e94309cab48',
          },
        },
      },
    },
  },
  merchantRecordPage: {
    universalIdentifier: '41a5a300-b048-4aba-8709-b45cc2c394d7',
    tabs: {
      home: {
        universalIdentifier: 'eb3851ec-a8ac-497f-b9d1-fb9ffbed0919',
        widgets: {
          fields: {
            universalIdentifier: 'f846ce25-18c2-4e7d-94ec-087ddde09396',
          },
        },
      },
      timeline: {
        universalIdentifier: 'd78224b7-c09c-49b2-b9d1-4eaf6d62e978',
        widgets: {
          timeline: {
            universalIdentifier: '0dcbd900-cb34-4bba-8597-a511f2f788b0',
          },
        },
      },
      tasks: {
        universalIdentifier: 'ae2a3830-0503-4573-b0e7-c8a58cde7334',
        widgets: {
          tasks: {
            universalIdentifier: 'bca6819d-53d3-4d6c-afa3-e4edc9205fee',
          },
        },
      },
      notes: {
        universalIdentifier: 'f4e56c49-a12b-4b3a-8918-031b162c115f',
        widgets: {
          notes: {
            universalIdentifier: '9c324267-9e20-4b98-91d3-a5dba740ad27',
          },
        },
      },
      files: {
        universalIdentifier: 'c4835f3b-128c-4f16-86d8-c50db38d494d',
        widgets: {
          files: {
            universalIdentifier: 'a22110f2-1cfc-4987-b4db-d15af445673e',
          },
        },
      },
    },
  },
} as const;
