import { applySerializedEventTransferredFiles } from '@/remote/elements/utils/applySerializedEventTransferredFiles';
import { type SerializedFileData } from '@/types/SerializedFileData';

const FILE: SerializedFileData = {
  name: 'screenshot.png',
  size: 12,
  type: 'image/png',
  lastModified: 1,
  handle: 'handle-1',
};

describe('applySerializedEventTransferredFiles', () => {
  it('should do nothing when the event carried no files', () => {
    const event: Record<string, unknown> = {};

    applySerializedEventTransferredFiles(event, { type: 'paste' });

    expect(event).toEqual({});
  });

  it('should add the files onto an existing clipboardData for a paste', () => {
    const event: Record<string, unknown> = {
      clipboardData: { types: ['text/plain'] },
    };

    applySerializedEventTransferredFiles(event, {
      type: 'paste',
      files: [FILE],
    });

    const clipboardData = event.clipboardData as Record<string, unknown>;

    expect(clipboardData.types).toEqual(['text/plain', 'Files']);
    expect((clipboardData.files as SerializedFileData[])[0]).toEqual(FILE);
  });

  it('should build a dataTransfer for a drop', () => {
    const event: Record<string, unknown> = {};

    applySerializedEventTransferredFiles(event, {
      type: 'drop',
      files: [FILE],
    });

    const dataTransfer = event.dataTransfer as Record<string, unknown>;

    expect(dataTransfer.types).toEqual(['Files']);
    expect((dataTransfer.files as SerializedFileData[])[0]).toEqual(FILE);
  });

  it('should put the files on detail for an editor upload', () => {
    const event = new Event('upload') as unknown as Record<string, unknown>;

    applySerializedEventTransferredFiles(event, {
      type: 'upload',
      files: [FILE],
    });

    const detail = event.detail as { files: SerializedFileData[] };

    expect(detail.files[0]).toEqual(FILE);
  });
});
