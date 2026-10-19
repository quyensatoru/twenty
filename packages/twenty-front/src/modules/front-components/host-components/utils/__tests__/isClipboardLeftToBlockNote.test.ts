import { isClipboardLeftToBlockNote } from '@/front-components/host-components/utils/isClipboardLeftToBlockNote';

const buildClipboard = (data: Record<string, string>) =>
  ({
    types: Object.keys(data),
    getData: (format: string) => data[format] ?? '',
  }) as unknown as DataTransfer;

const MARKDOWN =
  '## A heading longer than sixty-four characters, which BlockNote misses\n\n* Free\n* Paid';

describe('isClipboardLeftToBlockNote', () => {
  it('reads plain text as markdown', () => {
    expect(
      isClipboardLeftToBlockNote(buildClipboard({ 'text/plain': MARKDOWN })),
    ).toBe(false);
  });

  it('reads markdown copied from a chat app, one <div> or <br> per line', () => {
    expect(
      isClipboardLeftToBlockNote(
        buildClipboard({
          'text/plain': MARKDOWN,
          'text/html':
            '<meta charset="utf-8"><div>## A heading</div><div><br></div><div>* Free</div>',
        }),
      ),
    ).toBe(false);
    expect(
      isClipboardLeftToBlockNote(
        buildClipboard({
          'text/plain': MARKDOWN,
          'text/html': '<span>## A heading<br><br>* Free</span>',
        }),
      ),
    ).toBe(false);
  });

  it('reads a raw markdown file shown in <pre> as markdown', () => {
    expect(
      isClipboardLeftToBlockNote(
        buildClipboard({
          'text/plain': MARKDOWN,
          'text/html': '<pre>## A heading</pre>',
        }),
      ),
    ).toBe(false);
  });

  it('leaves rendered HTML to BlockNote', () => {
    expect(
      isClipboardLeftToBlockNote(
        buildClipboard({
          'text/plain': 'Title\nItem one',
          'text/html':
            '<h2>Title</h2><ul><li><strong>Item</strong> one</li></ul>',
        }),
      ),
    ).toBe(true);
    expect(
      isClipboardLeftToBlockNote(
        buildClipboard({
          'text/plain': 'const a = 1;',
          'text/html':
            '<pre><code class="language-js">const a = 1;</code></pre>',
        }),
      ),
    ).toBe(true);
  });

  it('reads a markdown file from VS Code as markdown, and leaves code to BlockNote', () => {
    const vscodeHtml = '<div><span>line</span></div>';

    expect(
      isClipboardLeftToBlockNote(
        buildClipboard({
          'text/plain': MARKDOWN,
          'text/html': vscodeHtml,
          'vscode-editor-data': JSON.stringify({ mode: 'markdown' }),
        }),
      ),
    ).toBe(false);
    expect(
      isClipboardLeftToBlockNote(
        buildClipboard({
          'text/plain': 'const b = 2;',
          'text/html': vscodeHtml,
          'vscode-editor-data': JSON.stringify({ mode: 'typescript' }),
        }),
      ),
    ).toBe(true);
  });

  it('leaves BlockNote content and files to BlockNote', () => {
    expect(
      isClipboardLeftToBlockNote(
        buildClipboard({ 'blocknote/html': '<p>x</p>', 'text/plain': 'x' }),
      ),
    ).toBe(true);
    expect(isClipboardLeftToBlockNote(buildClipboard({ Files: '' }))).toBe(
      true,
    );
  });
});
