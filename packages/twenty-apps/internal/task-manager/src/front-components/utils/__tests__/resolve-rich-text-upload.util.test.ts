import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveRichTextUpload } from '../resolve-rich-text-upload.util';
import * as transferredFileUpload from '../upload-file-from-transferred-file.util';

const buildFile = (type: string, handle?: string) => ({
  name: 'screenshot.png',
  size: 1024,
  type,
  handle,
});

describe('resolveRichTextUpload', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('answers with the url the app stored the file under', async () => {
    vi.spyOn(
      transferredFileUpload,
      'uploadFileFromTransferredFile',
    ).mockResolvedValue({
      status: 'uploaded',
      url: 'https://files.test/screenshot.png',
      name: 'screenshot.png',
      fileId: 'file-1',
    });

    expect(
      await resolveRichTextUpload(buildFile('image/png', 'handle-1')),
    ).toEqual({
      handle: 'handle-1',
      url: 'https://files.test/screenshot.png',
      outcome: 'stored',
      fileId: 'file-1',
      fileName: 'screenshot.png',
    });
  });

  it('stores a file that is not an image too, the same route Attachments uses', async () => {
    vi.spyOn(
      transferredFileUpload,
      'uploadFileFromTransferredFile',
    ).mockResolvedValue({
      status: 'uploaded',
      url: 'https://files.test/spec.pdf',
      name: 'spec.pdf',
      fileId: 'file-2',
    });

    expect(
      await resolveRichTextUpload(buildFile('application/pdf', 'handle-2')),
    ).toEqual({
      handle: 'handle-2',
      url: 'https://files.test/spec.pdf',
      outcome: 'stored',
      fileId: 'file-2',
      fileName: 'spec.pdf',
    });
  });

  it('answers with no url when the upload failed, so the editor stops waiting', async () => {
    vi.spyOn(
      transferredFileUpload,
      'uploadFileFromTransferredFile',
    ).mockResolvedValue({ status: 'failed', failure: 'no-attachment-field' });

    expect(
      await resolveRichTextUpload(buildFile('image/png', 'handle-1')),
    ).toEqual({
      handle: 'handle-1',
      url: null,
      outcome: 'no-attachment-field',
    });
  });

  it('answers with an empty handle rather than throwing on a file the host never stashed', async () => {
    vi.spyOn(
      transferredFileUpload,
      'uploadFileFromTransferredFile',
    ).mockResolvedValue({ status: 'failed', failure: 'upload-failed' });

    expect(await resolveRichTextUpload(buildFile('image/png'))).toEqual({
      handle: '',
      url: null,
      outcome: 'upload-failed',
    });
  });
});
