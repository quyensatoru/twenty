import { describe, expect, it } from 'vitest';

import { appendImageMarkdown } from '../append-image-markdown.util';
import { removeNativePasteInsertion } from '../remove-native-paste-insertion.util';

// The path a file manager puts on the clipboard next to the file itself, which
// is what used to end up in the box beside the uploaded image.
const PASTED_FILE_PATH =
  '/home/quyen/Pictures/Screenshots/Screenshot from 2026-08-29 09-55-59.png';

describe('removeNativePasteInsertion', () => {
  it('undoes the file path the browser pasted at the end of the text', () => {
    const previousValue = 'Mô tả gốc\n\n## Kế hoạch';

    expect(
      removeNativePasteInsertion(
        previousValue,
        `${previousValue}${PASTED_FILE_PATH}`,
        PASTED_FILE_PATH,
      ),
    ).toEqual({ value: previousValue, caretPosition: previousValue.length });
  });

  it('undoes an insertion made in the middle of the text', () => {
    expect(
      removeNativePasteInsertion('abcd', 'abXYcd', 'XY'),
    ).toEqual({ value: 'abcd', caretPosition: 2 });
  });

  it('undoes an insertion into an empty box', () => {
    expect(removeNativePasteInsertion('', 'XY', 'XY')).toEqual({
      value: '',
      caretPosition: 0,
    });
  });

  it('finds the insertion even when the pasted text repeats the text around it', () => {
    expect(removeNativePasteInsertion('aa', 'aaa', 'a')).toEqual({
      value: 'aa',
      caretPosition: 2,
    });
    expect(removeNativePasteInsertion('xy', 'xxy', 'x')).toEqual({
      value: 'xy',
      caretPosition: 1,
    });
  });

  it('leaves a keystroke alone when the pasted text never landed', () => {
    expect(removeNativePasteInsertion('abc', 'abcd', PASTED_FILE_PATH)).toBeNull();
  });

  it('leaves a deletion alone', () => {
    expect(removeNativePasteInsertion('abcd', 'abc', 'd')).toBeNull();
  });

  it('leaves an edit alone when the text merely contains the pasted string', () => {
    expect(removeNativePasteInsertion('abc', 'aXYc', 'XY')).toBeNull();
  });

  it('does nothing when the clipboard carried no text at all', () => {
    expect(removeNativePasteInsertion('abc', 'abc', '')).toBeNull();
  });
});

// What the editor does between the paste event and the finished upload, with
// nothing in between: the browser inserts the path half of the clipboard, the
// app takes it back out, and the stored image is appended.
describe('a paste carrying both a file and its path as text', () => {
  const STORED_IMAGE_URL = 'https://api.test/file/files-field/abc?token=xyz';

  it('leaves the image and nothing else', () => {
    const valueBeforePaste = 'hehe\n';
    const valueAfterBrowserPaste = `${valueBeforePaste}${PASTED_FILE_PATH}`;

    const removal = removeNativePasteInsertion(
      valueBeforePaste,
      valueAfterBrowserPaste,
      PASTED_FILE_PATH,
    );

    expect(removal).not.toBeNull();

    const valueAfterUpload = appendImageMarkdown(
      removal?.value ?? valueAfterBrowserPaste,
      'shot.png',
      STORED_IMAGE_URL,
    );

    expect(valueAfterUpload).toBe(
      `hehe\n![shot.png](${STORED_IMAGE_URL})`,
    );
    expect(valueAfterUpload).not.toContain(PASTED_FILE_PATH);
  });

  it('would otherwise leave the path beside the image', () => {
    const valueAfterBrowserPaste = `hehe\n${PASTED_FILE_PATH}`;

    expect(
      appendImageMarkdown(valueAfterBrowserPaste, 'shot.png', STORED_IMAGE_URL),
    ).toContain(PASTED_FILE_PATH);
  });
});

describe('appendImageMarkdown', () => {
  it('starts a new line only when the text does not already end on one', () => {
    expect(appendImageMarkdown('', 'a.png', 'u')).toBe('![a.png](u)');
    expect(appendImageMarkdown('x\n', 'a.png', 'u')).toBe('x\n![a.png](u)');
    expect(appendImageMarkdown('x', 'a.png', 'u')).toBe('x\n![a.png](u)');
  });
});
