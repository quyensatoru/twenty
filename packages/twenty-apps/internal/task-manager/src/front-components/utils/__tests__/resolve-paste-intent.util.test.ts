import { describe, expect, it } from 'vitest';

import { appendImageMarkdown } from '../../../utils/append-image-markdown.util';
import { removeNativePasteInsertion } from '../../../utils/remove-native-paste-insertion.util';
import { resolvePasteIntent } from '../resolve-paste-intent.util';

const SCREENSHOT_PATH =
  '/home/quyen/Pictures/Screenshots/Screenshot from 2026-08-29 10-07-20.png';

const buildClipboard = (files: unknown[]) => ({
  files: Object.assign([...files], { length: files.length }),
});

const buildImageFile = (name: string) => ({
  name,
  size: 12345,
  type: 'image/png',
  handle: 'handle-1',
});

describe('resolvePasteIntent', () => {
  it('claims a paste that carries a file, and remembers the text beside it', () => {
    expect(
      resolvePasteIntent({
        clipboardText: SCREENSHOT_PATH,
        transfer: buildClipboard([buildImageFile('shot.png')]),
      }),
    ).toEqual({
      kind: 'files',
      imageFiles: [
        { name: 'shot.png', size: 12345, type: 'image/png', handle: 'handle-1' },
      ],
      nativePastedText: SCREENSHOT_PATH,
    });
  });

  it('claims a file paste that carries no text at all', () => {
    expect(
      resolvePasteIntent({
        clipboardText: '',
        transfer: buildClipboard([buildImageFile('shot.png')]),
      }),
    ).toMatchObject({ kind: 'files', nativePastedText: null });
  });

  it('separates files that are not images, so the box still gets cleaned up', () => {
    const intent = resolvePasteIntent({
      clipboardText: '/home/quyen/notes.txt',
      transfer: buildClipboard([
        { name: 'notes.txt', size: 5, type: 'text/plain', handle: 'handle-2' },
      ]),
    });

    expect(intent).toEqual({
      kind: 'files',
      imageFiles: [],
      nativePastedText: '/home/quyen/notes.txt',
    });
  });

  it('turns a bare URL into a url paste', () => {
    expect(
      resolvePasteIntent({
        clipboardText: '  https://x.test/a.png  ',
        transfer: buildClipboard([]),
      }),
    ).toEqual({ kind: 'url', url: 'https://x.test/a.png' });
  });

  it('leaves ordinary text alone', () => {
    expect(
      resolvePasteIntent({
        clipboardText: 'see https://x.test and https://y.test',
        transfer: buildClipboard([]),
      }),
    ).toEqual({ kind: 'plain-text' });
  });

  it('never reads a URL out of a clipboard that also carried a file', () => {
    expect(
      resolvePasteIntent({
        clipboardText: 'https://x.test/a.png',
        transfer: buildClipboard([buildImageFile('a.png')]),
      }),
    ).toMatchObject({ kind: 'files' });
  });
});

// The regression the owner reported: a pasted screenshot showed up as the
// image AND a leftover line pointing at where it came from.
describe('pasting a screenshot leaves only the image', () => {
  it('drops the path the browser pasted and keeps the stored image', () => {
    const valueBeforePaste = 'hehe\n';
    const storedImageUrl = 'https://api.test/file/files-field/abc?token=xyz';

    const intent = resolvePasteIntent({
      clipboardText: SCREENSHOT_PATH,
      transfer: buildClipboard([buildImageFile('shot.png')]),
    });

    expect(intent.kind).toBe('files');

    const nativePastedText =
      intent.kind === 'files' ? intent.nativePastedText : null;

    // The browser performs its own paste: the host never cancels a paste, so
    // the path lands in the box before the app hears about the change.
    const valueAfterBrowserPaste = `${valueBeforePaste}${SCREENSHOT_PATH}`;

    const removal = removeNativePasteInsertion(
      valueBeforePaste,
      valueAfterBrowserPaste,
      nativePastedText ?? '',
    );

    expect(removal).toEqual({
      value: valueBeforePaste,
      caretPosition: valueBeforePaste.length,
    });

    const valueAfterUpload = appendImageMarkdown(
      removal?.value ?? valueAfterBrowserPaste,
      'shot.png',
      storedImageUrl,
    );

    expect(valueAfterUpload).toBe(`hehe\n![shot.png](${storedImageUrl})`);
    expect(valueAfterUpload).not.toContain(SCREENSHOT_PATH);
  });
});
