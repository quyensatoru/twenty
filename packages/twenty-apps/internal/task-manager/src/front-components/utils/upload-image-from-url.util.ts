import { RestApiClient } from 'twenty-client-sdk/rest';
import { uploadFile } from 'twenty-sdk/front-component';

import { buildUploadFileName } from '../../utils/build-upload-file-name.util';
import { resolveAttachmentFieldMetadataId } from './resolve-attachment-field-metadata-id.util';

// Not named `reason`: the translation extractor treats `reason: '...'` as a
// user-facing message and would add these discriminants to the catalogs.
export type UploadImageFromUrlFailure =
  | 'no-attachment-field'
  | 'fetch-blocked'
  | 'not-an-image'
  | 'upload-failed';

export type UploadImageFromUrlResult =
  | { status: 'uploaded'; url: string }
  | { status: 'already-stored' }
  | { status: 'failed'; failure: UploadImageFromUrlFailure };

const readApiOrigin = (): string | null => {
  try {
    return new URL(new RestApiClient().resolveUrl('/')).origin;
  } catch {
    return null;
  }
};

// Re-hosts a pasted image URL inside Twenty. The bytes are fetched by the
// sandbox itself — it has `fetch`, `Blob` and `File`, which is why a URL can
// become a file here while a file from the user's disk cannot: no local file's
// bytes ever cross into a front component.
//
// Every step is a plausible, non-exceptional failure — the remote host may not
// send the CORS header the sandbox's opaque origin needs, the URL may not be an
// image, the field may not be synced yet — so each one is named rather than
// thrown, and the caller keeps the author's original URL in the text either
// way.
export const uploadImageFromUrl = async (
  sourceUrl: string,
): Promise<UploadImageFromUrlResult> => {
  const apiOrigin = readApiOrigin();

  // A URL already on the API's own origin is already a stored Twenty file, and
  // re-fetching it would corrupt it: requests to that origin are routed through
  // the host fetch bridge, which serialises every response body as text.
  if (apiOrigin !== null && sourceUrl.startsWith(`${apiOrigin}/`)) {
    return { status: 'already-stored' };
  }

  const fieldMetadataId = await resolveAttachmentFieldMetadataId();

  if (fieldMetadataId === null) {
    return { status: 'failed', failure: 'no-attachment-field' };
  }

  let blob: Blob;

  try {
    const response = await fetch(sourceUrl);

    if (!response.ok) {
      return { status: 'failed', failure: 'fetch-blocked' };
    }

    blob = await response.blob();
  } catch {
    return { status: 'failed', failure: 'fetch-blocked' };
  }

  if (blob.size === 0) {
    return { status: 'failed', failure: 'fetch-blocked' };
  }

  if (!blob.type.startsWith('image/')) {
    return { status: 'failed', failure: 'not-an-image' };
  }

  const result = await uploadFile(blob, {
    fieldMetadataId,
    fileName: buildUploadFileName(sourceUrl),
  });

  if (result.status !== 'uploaded') {
    return { status: 'failed', failure: 'upload-failed' };
  }

  return { status: 'uploaded', url: result.file.url };
};
