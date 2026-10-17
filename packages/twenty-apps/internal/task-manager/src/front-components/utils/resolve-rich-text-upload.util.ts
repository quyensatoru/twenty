import {
  uploadFileFromTransferredFile,
  type TransferredFile,
  type UploadFileFromTransferredFileFailure,
} from './upload-file-from-transferred-file.util';

// Not named `reason`: the translation extractor treats `reason: '...'` as a
// user-facing message and would add these discriminants to the catalogs.
export type RichTextUploadOutcome =
  | 'stored'
  | UploadFileFromTransferredFileFailure;

export type RichTextUploadAnswer = {
  handle: string;
  url: string | null;
  outcome: RichTextUploadOutcome;
  // Carried for the Attachments filing below: the editor only needs the url,
  // but the stored file also belongs on the issue's FILES field.
  fileId?: string;
  fileName?: string;
};

// The editor runs on the host and has no credentials of its own: it hands over
// a handle for a file whose bytes never left the host and waits for an answer.
// The upload itself goes through the app's own scoped route, which is the only
// place the app's access rules live — an editor that uploaded by itself would
// spend the signed-in user's token and walk straight around them. Any file
// type goes through, matching the Attachments widget's own picker: the block
// the user chose (image, file, video…) is what decides how the stored URL
// gets shown, not this function.
export const resolveRichTextUpload = async (
  file: TransferredFile,
): Promise<RichTextUploadAnswer> => {
  const handle = file.handle ?? '';
  const result = await uploadFileFromTransferredFile(file);

  if (result.status === 'failed') {
    return { handle, url: null, outcome: result.failure };
  }

  return {
    handle,
    url: result.url,
    outcome: 'stored',
    fileId: result.fileId,
    fileName: result.name,
  };
};
