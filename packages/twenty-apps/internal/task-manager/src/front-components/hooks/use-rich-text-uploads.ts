import { useState } from 'react';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';

import {
  type RichTextUploadEvent,
  type RichTextUploadResolution,
} from '../../types/front-component-host-elements';
import { appendIssueAttachment } from '../utils/append-issue-attachment.util';
import { readTransferredFiles } from '../utils/read-transferred-files.util';
import {
  resolveRichTextUpload,
  type RichTextUploadOutcome,
} from '../utils/resolve-rich-text-upload.util';

type UploadNotice = { message: string; variant: 'success' | 'warning' | 'info' };

// Written as literals inside t() because the extractor only sees literals.
const readUploadNotice = (outcome: RichTextUploadOutcome): UploadNotice => {
  switch (outcome) {
    case 'stored':
      return { message: t('Image stored in Twenty.'), variant: 'success' };
    case 'not-an-image':
      // Only images become part of the document. Anything else still belongs
      // in the Attachments field, which is where the host's picker puts it.
      return {
        message: t(
          'Only an image can be pasted or dropped here. Add any other file in the Attachments field on the Issue tab.',
        ),
        variant: 'info',
      };
    case 'host-too-old':
      return {
        message: t(
          'This Twenty server cannot receive a pasted or dropped file yet. Add the image in the Attachments field on the Issue tab.',
        ),
        variant: 'warning',
      };
    case 'no-attachment-field':
      return {
        message: t(
          'The Attachments field is missing, so the image could not be stored.',
        ),
        variant: 'warning',
      };
    case 'upload-failed':
      return {
        message: t('The image could not be stored in Twenty.'),
        variant: 'warning',
      };
  }
};

export const useRichTextUploads = (issueId?: string | null) => {
  const [resolvedUploads, setResolvedUploads] = useState<
    RichTextUploadResolution[]
  >([]);

  const storeImage = async (file: Parameters<typeof resolveRichTextUpload>[0]) => {
    const answer = await resolveRichTextUpload(file);
    const notice = readUploadNotice(answer.outcome);

    // Appended rather than replaced: several files can be in flight at once
    // and the editor matches each answer to the handle it sent.
    setResolvedUploads((current) => [
      ...current,
      { handle: answer.handle, url: answer.url },
    ]);

    // Filed against the issue as well, so the Attachments widget lists what
    // the prose embeds. The host upload only stores the bytes; without this
    // the FILES field stays empty and the widget correctly shows nothing.
    // Fire-and-forget on purpose: the editor already has its url, and a filing
    // failure must not rewrite the answer the editor is waiting for.
    if (
      answer.outcome === 'stored' &&
      typeof issueId === 'string' &&
      typeof answer.fileId === 'string' &&
      typeof answer.fileName === 'string'
    ) {
      void appendIssueAttachment(issueId, {
        fileId: answer.fileId,
        label: answer.fileName,
      }).catch(() => {});
    }

    void enqueueSnackbar(notice);
  };

  const handleUpload = (event: RichTextUploadEvent) => {
    for (const file of readTransferredFiles(event.detail)) {
      void storeImage(file);
    }
  };

  return { resolvedUploads, handleUpload };
};
