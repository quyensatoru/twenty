import { ATTACHMENT_FIELD_ROUTE_PATH } from '../../constants/route-paths';
import { postAppRoute } from './post-app-route.util';

type AttachmentFieldRouteResult = { fieldMetadataId?: string | null };

// One lookup per page load, shared by every composer on it. The id is
// workspace-local metadata that only changes when the app is re-applied, and
// the whole point of the round trip is that it cannot be baked into the bundle.
// Only a real id is remembered: caching a miss would disable uploading for the
// rest of the session over one flaky request.
let resolvedFieldMetadataId: string | null = null;
let pendingLookup: Promise<string | null> | null = null;

export const resolveAttachmentFieldMetadataId =
  async (): Promise<string | null> => {
    if (resolvedFieldMetadataId !== null) {
      return resolvedFieldMetadataId;
    }

    if (pendingLookup === null) {
      pendingLookup = postAppRoute<AttachmentFieldRouteResult>(
        ATTACHMENT_FIELD_ROUTE_PATH,
        {},
      )
        .then((result) => result.fieldMetadataId ?? null)
        .catch(() => null)
        .then((fieldMetadataId) => {
          resolvedFieldMetadataId = fieldMetadataId;
          pendingLookup = null;

          return fieldMetadataId;
        });
    }

    return pendingLookup;
  };
