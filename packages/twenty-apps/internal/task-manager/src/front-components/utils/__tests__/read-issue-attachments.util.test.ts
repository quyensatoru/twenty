import { describe, expect, it } from 'vitest';

import {
  readAttachmentExtension,
  readAttachmentKind,
  readIssueAttachments,
} from '../read-issue-attachments.util';

describe('readAttachmentExtension', () => {
  it('reads the suffix after the last dot', () => {
    expect(readAttachmentExtension('screenshot.PNG')).toBe('png');
    expect(readAttachmentExtension('archive.tar.gz')).toBe('gz');
  });

  it('returns null when there is no usable suffix', () => {
    expect(readAttachmentExtension('README')).toBeNull();
    expect(readAttachmentExtension('.gitignore')).toBeNull();
    expect(readAttachmentExtension('trailing-dot.')).toBeNull();
  });
});

describe('readIssueAttachments', () => {
  it('returns an empty list for a missing value', () => {
    expect(readIssueAttachments(null)).toEqual([]);
    expect(readIssueAttachments(undefined)).toEqual([]);
    expect(readIssueAttachments('not-a-list')).toEqual([]);
  });

  it('keeps complete rows untouched', () => {
    expect(
      readIssueAttachments([
        {
          fileId: 'file-1',
          label: 'screenshot.png',
          extension: 'png',
          url: 'https://example.com/file-1?token=abc',
        },
      ]),
    ).toEqual([
      {
        fileId: 'file-1',
        label: 'screenshot.png',
        extension: 'png',
        url: 'https://example.com/file-1?token=abc',
      },
    ]);
  });

  it('drops rows without an id and falls back to the id for a missing label', () => {
    expect(
      readIssueAttachments([
        null,
        'not-a-row',
        { label: 'nameless.png' },
        { fileId: '', label: 'empty-id.png' },
        { fileId: 'file-2' },
      ]),
    ).toEqual([
      { fileId: 'file-2', label: 'file-2', extension: null, url: null },
    ]);
  });
});

describe('readAttachmentKind', () => {
  it('draws the common image formats as images', () => {
    for (const label of ['a.png', 'b.JPG', 'c.jpeg', 'd.gif', 'e.webp']) {
      expect(readAttachmentKind({ fileId: label, label })).toBe('image');
    }
  });

  it('prefers the stored extension over the file name', () => {
    expect(
      readAttachmentKind({ fileId: 'file', label: 'scan', extension: '.PDF' }),
    ).toBe('pdf');
  });

  it('groups code and data files, and leaves the rest as other', () => {
    expect(readAttachmentKind({ fileId: 'f1', label: 'payload.json' })).toBe(
      'code',
    );
    expect(readAttachmentKind({ fileId: 'f2', label: 'notes.docx' })).toBe(
      'other',
    );
    expect(readAttachmentKind({ fileId: 'f3', label: 'README' })).toBe('other');
  });
});
