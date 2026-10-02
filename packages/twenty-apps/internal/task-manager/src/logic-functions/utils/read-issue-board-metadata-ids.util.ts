import { MetadataApiClient } from 'twenty-client-sdk/metadata';

import {
  ISSUE_APP_FIELD_UID,
  ISSUE_ASSIGNEE_FIELD_UID,
  ISSUE_KEY_FIELD_UID,
  ISSUE_OBJECT_UID,
  ISSUE_PRIORITY_FIELD_UID,
  ISSUE_PROJECT_FIELD_UID,
  ISSUE_STATUS_FIELD_UID,
  ISSUE_STORY_POINTS_FIELD_UID,
  ISSUE_TITLE_FIELD_UID,
} from '../../constants/universal-identifiers';

type MetadataFieldNode = {
  id?: string | null;
  universalIdentifier?: string | null;
};

// Metadata ids are per workspace, so they can only be resolved at run time.
export const readIssueBoardMetadataIds = async (): Promise<{
  objectMetadataId: string;
  statusFieldId: string;
  projectFieldId: string;
  appFieldId: string;
  storyPointsFieldId: string;
  cardFieldIds: string[];
}> => {
  const result = await new MetadataApiClient({ runAs: 'application' }).query({
    objects: {
      __args: {
        paging: { first: 1 },
        filter: { universalIdentifier: { eq: ISSUE_OBJECT_UID } },
      },
      edges: {
        node: {
          id: true,
          fields: {
            __args: { paging: { first: 200 }, filter: {} },
            edges: { node: { id: true, universalIdentifier: true } },
          },
        },
      },
    },
  });

  const objectNode = result?.objects?.edges?.[0]?.node;
  const objectMetadataId = objectNode?.id;
  const fieldNodes = (objectNode?.fields?.edges ?? []).map(
    (edge: { node?: MetadataFieldNode }) => edge?.node,
  );

  const findFieldId = (universalIdentifier: string): string => {
    const fieldId = fieldNodes.find(
      (field: MetadataFieldNode | undefined) =>
        field?.universalIdentifier === universalIdentifier,
    )?.id;

    if (typeof fieldId !== 'string') {
      throw new Error(`Field ${universalIdentifier} not found on issue`);
    }

    return fieldId;
  };

  if (typeof objectMetadataId !== 'string') {
    throw new Error('Issue object metadata not found');
  }

  return {
    objectMetadataId,
    statusFieldId: findFieldId(ISSUE_STATUS_FIELD_UID),
    projectFieldId: findFieldId(ISSUE_PROJECT_FIELD_UID),
    appFieldId: findFieldId(ISSUE_APP_FIELD_UID),
    storyPointsFieldId: findFieldId(ISSUE_STORY_POINTS_FIELD_UID),
    // Reading order of a card: headline, which issue, how urgent, how big, on
    // whom. Every project board shares this order.
    cardFieldIds: [
      ISSUE_TITLE_FIELD_UID,
      ISSUE_KEY_FIELD_UID,
      ISSUE_PRIORITY_FIELD_UID,
      ISSUE_STORY_POINTS_FIELD_UID,
      ISSUE_ASSIGNEE_FIELD_UID,
    ].map(findFieldId),
  };
};
