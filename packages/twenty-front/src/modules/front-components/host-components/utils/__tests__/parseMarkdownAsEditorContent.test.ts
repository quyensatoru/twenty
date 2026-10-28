import { convertEditorDocumentToMarkdown } from '@/front-components/host-components/utils/convertEditorDocumentToMarkdown';
import { buildMarkdownRichTextExtensions } from '@/front-components/host-components/utils/buildMarkdownRichTextExtensions';
import { parseMarkdownAsEditorContent } from '@/front-components/host-components/utils/parseMarkdownAsEditorContent';
import { Editor } from '@tiptap/core';
import { Document } from '@tiptap/extension-document';
import { HardBreak } from '@tiptap/extension-hard-break';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Text } from '@tiptap/extension-text';

const roundTrip = (markdown: string) => {
  const editor = new Editor({
    extensions: [
      Document,
      Paragraph,
      Text,
      HardBreak,
      ...buildMarkdownRichTextExtensions({}),
    ],
    content: parseMarkdownAsEditorContent(markdown),
  });

  const result = convertEditorDocumentToMarkdown(editor.getJSON());

  editor.destroy();

  return result;
};

describe('parseMarkdownAsEditorContent', () => {
  it.each([
    'Plain paragraph',
    '**bold** and _italic_ and ~~strike~~ and `code`',
    '# Heading 1\n\n## Heading 2',
    '- one\n- two',
    '1. one\n2. two',
    '- [ ] todo\n- [x] done',
    '> quoted',
    '[link](https://twenty.com)',
    'first line\nsecond line',
    'First paragraph\n\nSecond paragraph',
    '```\nconst a = 1;\n```',
    'Above\n\n&nbsp;\n\n&nbsp;\n\nBelow',
    'Text\n\n![shot.png](https://twenty.com/shot.png)\n\nMore',
  ])('keeps %j unchanged through the editor', (markdown) => {
    expect(roundTrip(markdown)).toBe(markdown);
  });
});

describe('convertEditorDocumentToMarkdown', () => {
  it('drops the empty paragraphs the caret leaves at the end', () => {
    expect(
      convertEditorDocumentToMarkdown({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Text' }] },
          { type: 'paragraph' },
          { type: 'paragraph' },
        ],
      }),
    ).toBe('Text');
  });
});

describe('buildMarkdownRichTextExtensions', () => {
  it('does not carry a link onto the text typed right after it', () => {
    const editor = new Editor({
      extensions: [
        Document,
        Paragraph,
        Text,
        HardBreak,
        ...buildMarkdownRichTextExtensions({}),
      ],
      content: parseMarkdownAsEditorContent(
        '[@Jony Ive](/task-mention/member-1) ',
      ),
    });

    editor.commands.focus('end');

    expect(
      editor.state.selection.$from.marks().map((mark) => mark.type.name),
    ).not.toContain('link');

    editor.destroy();
  });
});
