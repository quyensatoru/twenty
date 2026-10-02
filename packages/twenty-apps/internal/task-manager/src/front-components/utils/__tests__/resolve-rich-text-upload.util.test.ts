import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveRichTextUpload } from '../resolve-rich-text-upload.util';
import * as transferredFileUpload from '../upload-image-from-transferred-file.util';

const buildImageFile = (handle?: string) => ({
  name: 'screenshot.png',
  size: 1024,
  type: 'image/png',
  handle,
});

describe('resolveRichTextUpload', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('answers with the url the app stored the image under', async () => {
    vi.spyOn(
      transferredFileUpload,
      'uploadImageFromTransferredFile',
    ).mockResolvedValue({
      status: 'uploaded',
      url: 'https://files.test/screenshot.png',
      name: 'screenshot.png',
    });

    expect(await resolveRichTextUpload(buildImageFile('handle-1'))).toEqual({
      handle: 'handle-1',
      url: 'https://files.test/screenshot.png',
      outcome: 'stored',
    });
  });

  it('answers with no url for anything that is not an image, without uploading', async () => {
    const upload = vi.spyOn(
      transferredFileUpload,
      'uploadImageFromTransferredFile',
    );

    expect(
      await resolveRichTextUpload({
        name: 'spec.pdf',
        size: 2048,
        type: 'application/pdf',
        handle: 'handle-2',
      }),
    ).toEqual({ handle: 'handle-2', url: null, outcome: 'not-an-image' });
    expect(upload).not.toHaveBeenCalled();
  });

  it('answers with no url when the upload failed, so the editor stops waiting', async () => {
    vi.spyOn(
      transferredFileUpload,
      'uploadImageFromTransferredFile',
    ).mockResolvedValue({ status: 'failed', failure: 'no-attachment-field' });

    expect(await resolveRichTextUpload(buildImageFile('handle-1'))).toEqual({
      handle: 'handle-1',
      url: null,
      outcome: 'no-attachment-field',
    });
  });

  it('answers with an empty handle rather than throwing on a file the host never stashed', async () => {
    expect(await resolveRichTextUpload(buildImageFile())).toEqual({
      handle: '',
      url: null,
      outcome: 'not-an-image',
    });
  });
});
