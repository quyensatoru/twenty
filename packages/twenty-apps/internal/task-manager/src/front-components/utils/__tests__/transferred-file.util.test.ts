import { describe, expect, it } from 'vitest';

import { readTransferredFiles } from '../read-transferred-files.util';
import { isTransferredImageFile } from '../upload-image-from-transferred-file.util';

const buildTransfer = (files: unknown[]) => ({
  files: Object.assign([...files], { length: files.length }),
});

describe('readTransferredFiles', () => {
  it('returns nothing when the event carried no transfer', () => {
    expect(readTransferredFiles(undefined)).toEqual([]);
    expect(readTransferredFiles(null)).toEqual([]);
    expect(readTransferredFiles({})).toEqual([]);
  });

  it('reads name, size, type and the host handle', () => {
    const transfer = buildTransfer([
      {
        name: 'screenshot.png',
        size: 12,
        type: 'image/png',
        lastModified: 1,
        handle: 'handle-1',
      },
    ]);

    expect(readTransferredFiles(transfer)).toEqual([
      {
        name: 'screenshot.png',
        size: 12,
        type: 'image/png',
        handle: 'handle-1',
      },
    ]);
  });

  it('keeps an entry with no handle so the caller can refuse it', () => {
    const transfer = buildTransfer([
      { name: 'a.png', size: 1, type: 'image/png' },
    ]);

    expect(readTransferredFiles(transfer)[0].handle).toBeUndefined();
  });

  it('skips entries missing required metadata', () => {
    const transfer = buildTransfer([{ name: 'incomplete' }, null]);

    expect(readTransferredFiles(transfer)).toEqual([]);
  });
});

describe('isTransferredImageFile', () => {
  it('accepts a non-empty image with a handle', () => {
    expect(
      isTransferredImageFile({
        name: 'a.png',
        size: 1,
        type: 'image/png',
        handle: 'handle-1',
      }),
    ).toBe(true);
  });

  it('refuses a file with no handle, no bytes, or another type', () => {
    expect(
      isTransferredImageFile({ name: 'a.png', size: 1, type: 'image/png' }),
    ).toBe(false);
    expect(
      isTransferredImageFile({
        name: 'a.png',
        size: 0,
        type: 'image/png',
        handle: 'handle-1',
      }),
    ).toBe(false);
    expect(
      isTransferredImageFile({
        name: 'a.pdf',
        size: 1,
        type: 'application/pdf',
        handle: 'handle-1',
      }),
    ).toBe(false);
  });
});
