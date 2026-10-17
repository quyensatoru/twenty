import { describe, expect, it } from 'vitest';

import { readTransferredFiles } from '../read-transferred-files.util';

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
