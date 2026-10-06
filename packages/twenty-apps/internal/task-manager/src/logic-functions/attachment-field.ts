import { MetadataApiClient } from 'twenty-client-sdk/metadata';
import { defineLogicFunction, FieldType } from 'twenty-sdk/define';

import { ATTACHMENT_FIELD_ROUTE_PATH } from '../constants/route-paths';
import {
  ATTACHMENT_FIELD_LOGIC_FUNCTION_UID,
  ISSUE_ATTACHMENTS_FIELD_UID,
  ISSUE_OBJECT_UID,
} from '../constants/universal-identifiers';
import { runScopedRoute } from './utils/run-scoped-route.util';

type MetadataFieldNode = {
  id?: string | null;
  name?: string | null;
  type?: string | null;
  universalIdentifier?: string | null;
};

// The composer's uploads have to name a real fieldMetadataId, which is
// per-workspace and therefore unknowable at build time — only the
// universalIdentifier is. A hardcoded id would work on one workspace and
// silently fail everywhere else, so it is resolved here, against the
// application's own token: a viewer stripped of metadata reads (DEPLOY.md 4.1
// level B) must still be able to paste an image.
const handler = async () =>
  runScopedRoute(async () => {
    const metadataClient = new MetadataApiClient({ runAs: 'application' });

    const result = await metadataClient.query({
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
              edges: {
                node: {
                  id: true,
                  name: true,
                  type: true,
                  universalIdentifier: true,
                },
              },
            },
          },
        },
      },
    });

    const fieldEdges =
      result?.objects?.edges?.[0]?.node?.fields?.edges ??
      ([] as { node?: MetadataFieldNode }[]);

    const attachmentsField = fieldEdges
      .map((edge) => edge?.node as MetadataFieldNode | undefined)
      .find(
        (field) =>
          field?.universalIdentifier === ISSUE_ATTACHMENTS_FIELD_UID &&
          field?.type === FieldType.FILES,
      );

    return { fieldMetadataId: attachmentsField?.id ?? null };
  });

export default defineLogicFunction({
  universalIdentifier: ATTACHMENT_FIELD_LOGIC_FUNCTION_UID,
  name: 'attachment-field',
  description:
    "Route: the workspace-local fieldMetadataId of issue.files, the markdown composer's upload target.",
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: ATTACHMENT_FIELD_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
