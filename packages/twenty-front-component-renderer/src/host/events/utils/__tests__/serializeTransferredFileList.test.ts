import { takeTransferredFile } from '../transferredFileStash';
import { serializeTransferredFileList } from '../serializeTransferredFileList';

const buildFileList = (files: File[]) =>
  Object.assign([...files], { length: files.length });

describe('serializeTransferredFileList', () => {
  it('should ignore an event type that carries no transfer', () => {
    expect(serializeTransferredFileList({}, 'change')).toBeUndefined();
  });

  it('should ignore a paste with no files', () => {
    expect(
      serializeTransferredFileList(
        { clipboardData: { files: buildFileList([]) } },
        'paste',
      ),
    ).toBeUndefined();
  });

  it('should serialize a pasted file with a handle that resolves to it', () => {
    const file = new File(['bytes'], 'screenshot.png', { type: 'image/png' });

    const serialized = serializeTransferredFileList(
      { clipboardData: { files: buildFileList([file]) } },
      'paste',
    );

    expect(serialized).toHaveLength(1);
    expect(serialized?.[0]).toMatchObject({
      name: 'screenshot.png',
      type: 'image/png',
      size: file.size,
    });
    expect(takeTransferredFile(serialized?.[0].handle ?? '')).toBe(file);
  });

  it('should read a dropped file from dataTransfer', () => {
    const file = new File(['bytes'], 'dropped.png', { type: 'image/png' });

    const serialized = serializeTransferredFileList(
      { dataTransfer: { files: buildFileList([file]) } },
      'drop',
    );

    expect(takeTransferredFile(serialized?.[0].handle ?? '')).toBe(file);
  });

  it('should read a picked file from a real <input type="file">', () => {
    const file = new File(['bytes'], 'picked.csv', { type: 'text/csv' });

    const serialized = serializeTransferredFileList(
      { target: { files: buildFileList([file]) } },
      'change',
    );

    expect(serialized).toHaveLength(1);
    expect(takeTransferredFile(serialized?.[0].handle ?? '')).toBe(file);
  });

  it('should ignore a change event with no file input target', () => {
    expect(
      serializeTransferredFileList({ target: { value: 'hello' } }, 'change'),
    ).toBeUndefined();
  });

  it('should never stash anything that is not a host File', () => {
    expect(
      serializeTransferredFileList(
        {
          clipboardData: {
            files: buildFileList([
              { name: 'fake.png', size: 1, type: 'image/png' },
            ] as unknown as File[]),
          },
        },
        'paste',
      ),
    ).toBeUndefined();
  });
});
