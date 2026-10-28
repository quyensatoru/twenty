import { NON_BREAKING_SPACE } from '@/front-components/host-components/utils/convertEditorDocumentToMarkdown';
import { marked } from 'marked';
import { isDefined } from 'twenty-shared/utils';

// marked renders a checklist item as an <li> holding a checkbox input, which
// TipTap's TaskItem does not recognise.
const convertCheckboxListItemsToTaskItems = (root: DocumentFragment) => {
  for (const checkbox of root.querySelectorAll<HTMLInputElement>(
    'li > input[type="checkbox"], li > p:first-child > input[type="checkbox"]',
  )) {
    const listItem = checkbox.closest('li');

    if (!isDefined(listItem)) {
      continue;
    }

    listItem.setAttribute('data-type', 'taskItem');
    listItem.setAttribute('data-checked', String(checkbox.checked));
    listItem.parentElement?.setAttribute('data-type', 'taskList');
    checkbox.remove();
  }
};

// marked keeps the newline before the closing fence, which the code block
// would otherwise show as an extra empty line.
const trimCodeBlockTrailingNewlines = (root: DocumentFragment) => {
  for (const code of root.querySelectorAll('pre > code')) {
    code.textContent = (code.textContent ?? '').replace(/\n$/, '');
  }
};

// marked wraps a standalone image in a paragraph, but the image is a block
// here, so the wrapper would be left behind as an empty paragraph.
const unwrapStandaloneImages = (root: DocumentFragment) => {
  for (const paragraph of root.querySelectorAll('p')) {
    const elements = [...paragraph.children];

    if (
      elements.length > 0 &&
      elements.every((element) => element.tagName === 'IMG') &&
      (paragraph.textContent ?? '').trim() === ''
    ) {
      paragraph.replaceWith(...elements);
    }
  }
};

// The `&nbsp;` convertEditorDocumentToMarkdown writes for an empty paragraph.
const emptyNonBreakingSpaceParagraphs = (root: DocumentFragment) => {
  for (const paragraph of root.querySelectorAll('p')) {
    if (paragraph.textContent === NON_BREAKING_SPACE) {
      paragraph.textContent = '';
    }
  }
};

// `breaks` because tipTapDocumentToMarkdown writes a hard break as a bare
// newline, which plain markdown would fold back into a space.
export const parseMarkdownAsEditorContent = (markdown: string): string => {
  const template = document.createElement('template');

  template.innerHTML = marked.parse(markdown, {
    async: false,
    breaks: true,
    gfm: true,
  }) as string;

  convertCheckboxListItemsToTaskItems(template.content);
  trimCodeBlockTrailingNewlines(template.content);
  emptyNonBreakingSpaceParagraphs(template.content);
  unwrapStandaloneImages(template.content);

  return template.innerHTML;
};
