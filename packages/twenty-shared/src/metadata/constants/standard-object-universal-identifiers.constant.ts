// Single source of truth for standard object universal identifiers: an object
// identifier is referenced from its own STANDARD_OBJECTS entry, from its
// STANDARD_OBJECT_FIELDS entry (system fields and INDEX view derivation), and
// sometimes from another object's declaration (default relation builders need
// both the host and the source object identifiers, and an object literal
// cannot reference its sibling keys).
export const STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS = {
  app: '4d71d304-ea37-457c-9422-48812659d75e',
  appAccess: '467cc684-c385-4536-bd9a-dfdf80c2d60f',
  agentChatThread: 'fab0fff8-0c90-4116-9bb0-7dbc07392633',
  agentTurn: '63697477-8606-415e-86cb-be078d7fcf7e',
  agentMessage: '62d0354c-3b99-4769-b0f5-4e2651c2ca7d',
  agentMessagePart: '214bacb0-df89-494e-be42-e5b11c99cff6',
  agentTurnEvaluation: '73741409-7835-426f-8425-9de13af22302',
  timelineActivity: '20202020-6736-4337-b5c4-8b39fae325a5',
  attachment: '20202020-bd3d-4c60-8dca-571c71d4447a',
  blocklist: '20202020-0408-4f38-b8a8-4d5e3e26e24d',
  calendarChannelEventAssociation: '20202020-491b-4aaa-9825-afd1bae6ae00',
  calendarEvent: '20202020-8f1d-4eef-9f85-0d1965e27221',
  calendarEventTarget: '6a9b9656-3e23-4234-94a4-b913c5dde668',
  calendarEventParticipant: '20202020-a1c3-47a6-9732-27e5b1e8436d',
  callRecording: 'ce19efb9-710f-45b2-b141-473abbeea60b',
  noteTarget: '20202020-fff0-4b44-be82-bda313884400',
  taskTarget: '20202020-5a9a-44e8-95df-771cd06d0fb1',
  person: '20202020-e674-48e5-a542-72570eee7213',
  recordShare: 'fecdb92c-d150-4544-81f8-f1158d18a7a2',
  company: '20202020-b374-4779-a561-80086cb2e17f',
  opportunity: '20202020-9549-49dd-b2b2-883999db8938',
  note: '20202020-0b00-45cd-b6f6-6cd806fc6804',
  task: '20202020-1ba1-48ba-bc83-ef7e5990ed10',
  workflow: '20202020-62be-406c-b9ca-8caa50d51392',
  workflowAutomatedTrigger: '20202020-3319-4234-a34c-7f3b9d2e4d1f',
  workflowVersion: '20202020-d65d-4ab9-9344-d77bfb376a3d',
  workflowRun: '20202020-4e28-4e95-a9d7-6c00874f843c',
  workspaceMember: '20202020-3319-4234-a34c-82d5c0e881a6',
  dashboard: '20202020-3840-4b6d-9425-0c5188b05ca8',
  message: '20202020-3f6b-4425-80ab-e468899ab4b2',
  messageChannelMessageAssociation: '20202020-ad1e-4127-bccb-d83ae04d2ccb',
  messageChannelMessageAssociationMessageFolder:
    '20202020-a1b0-40b0-8ab0-5b6c7d8e9f0a',
  messageList: '826561ea-4816-411c-baa0-eec5e6ca8866',
  messageListMember: '27773d24-8ce3-40f8-aa6c-1f590f2c08d2',
  messageCampaign: '238acb94-dd4c-4036-bc55-19b99d821efd',
  project: 'bf773e17-d100-40b8-9e8d-ef476c1d2fb8',
  merchant: '5d9a58bd-983c-4ca4-9f0a-b53cdec4cfca',
  sprint: '6acc95fa-4a04-49f1-ac53-50efe1032cbf',
  epic: '4aef1443-d2b0-42a9-9ce9-f08891b93430',
  issueStatus: '3439277b-2995-4a5c-b497-1b75396533a4',
  issue: 'e14a5928-2bbe-4e20-b766-ea8975ee819f',
  issueComment: '860287e4-e447-4e1b-85e4-4952c02f57dd',
  worklog: '8e4d81e8-6ab8-42c4-9e61-16b98bab83fa',
  issueMerchant: 'a469cd28-a0f7-4132-8f5d-d89fa044f516',
  shift: '476bd249-6ab7-472f-82e0-3e538b41722d',
  shiftTemplate: '930c8d12-0e7e-427c-87ec-5b155483b5d4',
  specialDay: '25080a86-ab21-450f-b33b-b8be58f36a59',
  messageParticipant: '20202020-a433-4456-aa2d-fd9cb26b774a',
  messageThread: '20202020-849a-4c3e-84f5-a25a7d802271',
  messageThreadTarget: '378ad1b0-592d-4084-80ee-86fef44725b9',
} as const;

export type StandardObjectWithUniversalIdentifierName =
  keyof typeof STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS;
