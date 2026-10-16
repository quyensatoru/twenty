import { type Element, type Root, type RootContent } from 'hast';
import { find } from 'linkifyjs';
import {
  type Root as MarkdownRoot,
  type RootContent as MarkdownContent,
} from 'mdast';
import { type CSSProperties, type ReactNode, useContext } from 'react';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

import { TASK_TOKENS } from './task-tokens';
import { normalizeMarkdownHardBreaks } from '../utils/normalize-markdown-hard-breaks.util';
import { TASK_MENTION_HREF_PREFIX } from '../utils/task-mention-markdown.util';
import {
  isBareLinkText,
  parseRichTextLink,
} from '../utils/parse-rich-text-link.util';
import {
  stopLinkEventPropagation,
  TaskRichTextLinkChip,
  TaskRichTextLinkChipsContext,
} from './task-rich-text-link-chip';

type TaskRichTextPreviewProps = { value: string };

const PREVIEW_HTML_SCHEMA = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    'u',
    'mark',
    'video',
    'audio',
    'figure',
    'figcaption',
  ],
  attributes: {
    ...defaultSchema.attributes,
    p: [...(defaultSchema.attributes?.p ?? []), 'style'],
    // The editor wraps what markdown cannot spell (alignment, block colours,
    // nested blocks) in <div>s marked with data attributes.
    div: [...(defaultSchema.attributes?.div ?? []), 'style', 'data*'],
    span: [...(defaultSchema.attributes?.span ?? []), 'style'],
    td: [...(defaultSchema.attributes?.td ?? []), 'style'],
    th: [...(defaultSchema.attributes?.th ?? []), 'style'],
    video: ['src', 'controls', 'poster'],
    audio: ['src', 'controls'],
  },
};

// The editor this text was written in is BlockNote, so the preview copies its
// measurements (13px text, 1.5 line height, 3px around every block, its
// heading scale, list indent and colours): what was written and what is read
// should look like the same document. The host resets native HTML styles, so
// every tag is styled here.
const BLOCK_SPACING = '3px 0';
const LIST_INDENT = 24;
const NESTING_GUIDE_COLOR = '#cfcfcf';
const QUOTE_COLOR = '#7d797a';
const TABLE_BORDER_COLOR = '#dddddd';
const LINK_COLOR = '#0000ee';
const CODE_BLOCK_BACKGROUND = '#161616';
const CODE_BLOCK_COLOR = '#ffffff';
const HEADING_SCALE = ['3em', '2em', '1.3em', '1em', '0.9em', '0.8em'];
const BULLET_STYLES = ['disc', 'circle', 'square'];

const CELL_STYLE: CSSProperties = {
  border: `1px solid ${TABLE_BORDER_COLOR}`,
  minWidth: 120,
  padding: '5px 10px',
  textAlign: 'left',
  verticalAlign: 'top',
};

// A nested group in BlockNote sits one indent in, with a thin guide line under
// its parent's marker.
const NESTED_GROUP_STYLE: CSSProperties = {
  borderLeft: `1px solid ${NESTING_GUIDE_COLOR}`,
  marginLeft: 4 - LIST_INDENT,
  paddingLeft: 2 * LIST_INDENT - 5,
};

// The same guide and text position for a group whose parent has no indent to
// pull back into: a top-level checklist, or a block's nested children.
const UNINDENTED_PARENT_GROUP_STYLE: CSSProperties = {
  borderLeft: `1px solid ${NESTING_GUIDE_COLOR}`,
  marginLeft: 4,
  paddingLeft: LIST_INDENT - 5,
};

const headingStyle = (level: number): CSSProperties => ({
  fontSize: HEADING_SCALE[level - 1],
  fontWeight: 700,
  lineHeight: 1.5,
  margin: 0,
  padding: '18px 0 3px',
});

const readDepth = (node: Element | undefined) => {
  const depth = Number(node?.properties?.dataListDepth);

  return Number.isFinite(depth) ? depth : 0;
};

const listStyle = (node: Element | undefined): CSSProperties => {
  const depth = readDepth(node);

  return {
    margin: 0,
    padding: 0,
    ...(depth === 0
      ? { paddingLeft: LIST_INDENT }
      : node?.properties?.dataUnderTopLevelTask === true
        ? UNINDENTED_PARENT_GROUP_STYLE
        : NESTED_GROUP_STYLE),
  };
};

const inlineStyle = (style?: CSSProperties): CSSProperties => {
  const result: CSSProperties = {};
  for (const property of [
    'color',
    'backgroundColor',
    'textAlign',
    'fontWeight',
    'fontStyle',
    'textDecoration',
  ] as const) {
    const value = style?.[property];
    if (value !== undefined) {
      Object.assign(result, { [property]: value });
    }
  }
  return result;
};

// The editor saves a resized image or video as an HTML width; the preview
// honours it the same way the editor does, never wider than the column.
const mediaSizeStyle = (width?: number | string): CSSProperties => {
  const pixelWidth = Number(width);

  // Inline so an aligned block around it can centre or right-align it.
  return {
    display: 'inline-block',
    verticalAlign: 'top',
    height: 'auto',
    maxWidth: '100%',
    ...(Number.isFinite(pixelWidth) && pixelWidth > 0
      ? { width: pixelWidth }
      : {}),
  };
};

// GFM literal links retain Markdown escapes and default bare www URLs to HTTP.
const remarkPreviewLinks =
  () => (tree: MarkdownRoot, file: { value: unknown }) => {
    const markdown = String(file.value);
    const visit = (node: MarkdownRoot | MarkdownContent) => {
      if (node.type === 'link') {
        const source = markdown.slice(
          node.position?.start.offset,
          node.position?.end.offset,
        );
        if (/^(?:https?:\/\/|www\.)/i.test(source)) {
          const normalized = source.replace(
            /\\([!"#$%&'()*+,\-./:;<=>?@[\]\\^_`{|}~])/g,
            '$1',
          );
          const [link] = find(normalized, 'url', { defaultProtocol: 'https' });
          if (link !== undefined) {
            node.url = link.href;
            node.children = [{ type: 'text', value: link.value }];
          }
        }
        return;
      }
      if ('children' in node) {
        node.children.forEach(visit);
      }
    };
    visit(tree);
  };

// Links inside raw HTML must be handled after parsing, without changing code or destinations.
const rehypePreviewLinks = () => (tree: Root) => {
  const visitChildren = (parent: Root | Element) => {
    const children = parent.children as RootContent[];
    for (let index = 0; index < children.length; index++) {
      const child = children[index];
      if (child.type === 'element') {
        if (!['a', 'code', 'pre', 'script', 'style'].includes(child.tagName)) {
          visitChildren(child);
        }
        continue;
      }
      if (child.type !== 'text') {
        continue;
      }
      const links = find(child.value, 'url', {
        defaultProtocol: 'https',
      }).filter((link) => /^https?:\/\//i.test(link.href));
      if (links.length === 0) {
        continue;
      }
      const replacements: RootContent[] = [];
      let lastIndex = 0;
      for (const link of links) {
        replacements.push(
          { type: 'text', value: child.value.slice(lastIndex, link.start) },
          {
            type: 'element',
            tagName: 'a',
            properties: { href: link.href },
            children: [{ type: 'text', value: link.value }],
          },
        );
        lastIndex = link.end;
      }
      replacements.push({ type: 'text', value: child.value.slice(lastIndex) });
      children.splice(index, 1, ...replacements);
      index += replacements.length - 1;
    }
  };
  visitChildren(tree);
};

const readPlainText = (children: ReactNode): string | null => {
  if (typeof children === 'string') {
    return children;
  }

  return Array.isArray(children) &&
    children.every((child) => typeof child === 'string')
    ? children.join('')
    : null;
};

const PreviewLink = ({
  href,
  title,
  children,
}: {
  href?: string;
  title?: string;
  children?: ReactNode;
}) => {
  const linkChips = useContext(TaskRichTextLinkChipsContext);

  if (href?.startsWith(TASK_MENTION_HREF_PREFIX) === true) {
    return (
      <span
        style={{
          color: TASK_TOKENS.accent,
          backgroundColor: TASK_TOKENS.accentSoft,
          borderRadius: TASK_TOKENS.radiusExtraSmall,
          padding: '1px 4px',
          fontWeight: 500,
          boxDecorationBreak: 'clone',
        }}
      >
        {children}
      </span>
    );
  }

  const text = readPlainText(children);
  const target =
    linkChips === null || href === undefined || text === null
      ? null
      : isBareLinkText(text, href)
        ? parseRichTextLink(href)
        : null;
  const issue =
    target?.kind === 'issue'
      ? linkChips?.issuesById.get(target.issueId)
      : undefined;

  const externalDomain =
    target?.kind === 'external'
      ? target.domain
      : target?.kind === 'issue' && issue === undefined
        ? target.domain
        : null;

  if (href !== undefined && externalDomain !== null) {
    return (
      <TaskRichTextLinkChip
        href={href}
        chip={{ kind: 'external', domain: externalDomain }}
      />
    );
  }

  if (href !== undefined && target?.kind === 'issue' && issue !== undefined) {
    return (
      <TaskRichTextLinkChip
        href={href}
        chip={{ kind: 'issue', issue, isComment: target.commentId !== null }}
      />
    );
  }

  // An issue link nobody could look up (still loading, or out of the
  // reader's reach) stays the plain link it was.
  return (
    <a
      href={href}
      title={title}
      target="_blank"
      rel="noopener noreferrer"
      onMouseDown={stopLinkEventPropagation}
      onClick={stopLinkEventPropagation}
      onKeyDown={stopLinkEventPropagation}
      style={{
        color: LINK_COLOR,
        cursor: 'pointer',
        textDecoration: 'underline',
      }}
    >
      {children}
    </a>
  );
};

const isListElement = (node: RootContent) =>
  node.type === 'element' && (node.tagName === 'ul' || node.tagName === 'ol');

const isElementWith = (node: RootContent | undefined, property: string) =>
  node?.type === 'element' &&
  node.tagName === 'div' &&
  node.properties?.[property] !== undefined;

// A toggle is written as a wrapper around its line followed by a wrapper
// around its children. BlockNote shows it closed, so it becomes a closed
// <details>: the line is the summary, the children open under it.
const foldTogglesIntoDetails = (parent: Root | Element) => {
  const children = parent.children as RootContent[];

  for (let index = 0; index < children.length; index++) {
    const toggle = children[index];

    if (toggle.type !== 'element' || !isElementWith(toggle, 'dataToggle')) {
      continue;
    }

    const [line] = toggle.children.filter(
      (node): node is Element => node.type === 'element',
    );
    const item =
      line?.tagName === 'ul'
        ? line.children.find(
            (node): node is Element =>
              node.type === 'element' && node.tagName === 'li',
          )
        : undefined;
    const nextSibling = children
      .slice(index + 1)
      .find((node) => node.type !== 'text' || node.value.trim() !== '');
    const hasChildren = isElementWith(nextSibling, 'dataBlocknoteChildren');
    const details: Element = {
      type: 'element',
      tagName: 'details',
      properties: { style: toggle.properties?.style },
      children: [
        {
          type: 'element',
          tagName: 'summary',
          properties: {},
          children: item?.children ?? (line === undefined ? [] : [line]),
        },
        ...(hasChildren ? [nextSibling as Element] : []),
      ],
    };

    children.splice(
      index,
      hasChildren
        ? children.indexOf(nextSibling as RootContent) - index + 1
        : 1,
      details,
    );
  }
};

// Marks up what the preview has to style by context, since a component only
// sees its own node: which wrappers are toggles, how deep a list sits, and
// which inline text of a ticked task is crossed out (not its subtasks, which
// BlockNote leaves alone).
const rehypeEditorLayout = () => (tree: Root) => {
  const visit = (parent: Root | Element, listDepth: number) => {
    foldTogglesIntoDetails(parent);

    for (const child of parent.children as RootContent[]) {
      if (child.type !== 'element') {
        continue;
      }

      if (isListElement(child)) {
        child.properties = { ...child.properties, dataListDepth: listDepth };
        visit(child, listDepth + 1);
        continue;
      }

      if (child.tagName === 'li') {
        const checkbox = child.children.find(
          (node): node is Element =>
            node.type === 'element' && node.tagName === 'input',
        );

        // GFM keeps the space after `[ ]`, which would push the text past
        // where BlockNote puts it and start a strike line before the word.
        const textAfterCheckbox =
          checkbox === undefined
            ? undefined
            : child.children[child.children.indexOf(checkbox) + 1];

        if (textAfterCheckbox?.type === 'text') {
          textAfterCheckbox.value = textAfterCheckbox.value.trimStart();
        }

        // A top-level checklist has no indent, unlike other lists.
        if (checkbox !== undefined && listDepth === 1) {
          for (const list of child.children.filter(isListElement)) {
            (list as Element).properties = {
              ...(list as Element).properties,
              dataUnderTopLevelTask: true,
            };
          }
        }

        if (checkbox?.properties?.checked === true) {
          const inline = child.children.filter(
            (node) => node !== checkbox && !isListElement(node),
          );
          const lists = child.children.filter(isListElement) as Element[];

          child.children = [
            checkbox,
            {
              type: 'element',
              tagName: 'span',
              properties: { dataChecked: true },
              children: inline as Element['children'],
            },
            ...lists,
          ];
        }
      }

      visit(child, listDepth);
    }
  };

  visit(tree, 0);
};

export const TaskRichTextPreview = ({ value }: TaskRichTextPreviewProps) => (
  <div
    style={{
      color: TASK_TOKENS.textPrimary,
      fontFamily: TASK_TOKENS.fontFamily,
      fontSize: 13,
      lineHeight: 1.5,
      minWidth: 0,
      overflowWrap: 'anywhere',
      userSelect: 'text',
      width: '100%',
    }}
  >
    <Markdown
      remarkPlugins={[remarkGfm, remarkPreviewLinks]}
      rehypePlugins={[
        rehypeRaw,
        rehypePreviewLinks,
        [rehypeSanitize, PREVIEW_HTML_SCHEMA],
        rehypeEditorLayout,
      ]}
      components={{
        a: ({ children, href, title }) => (
          <PreviewLink href={href} title={title}>
            {children}
          </PreviewLink>
        ),
        h1: ({ children }) => <h1 style={headingStyle(1)}>{children}</h1>,
        h2: ({ children }) => <h2 style={headingStyle(2)}>{children}</h2>,
        h3: ({ children }) => <h3 style={headingStyle(3)}>{children}</h3>,
        h4: ({ children }) => <h4 style={headingStyle(4)}>{children}</h4>,
        h5: ({ children }) => <h5 style={headingStyle(5)}>{children}</h5>,
        h6: ({ children }) => <h6 style={headingStyle(6)}>{children}</h6>,
        div: ({ children, style, node }) => (
          <div
            style={{
              ...(node?.properties?.dataBlocknoteChildren === undefined
                ? {}
                : UNINDENTED_PARENT_GROUP_STYLE),
              ...inlineStyle(style),
            }}
          >
            {children}
          </div>
        ),
        p: ({ children, style }) => (
          <p
            style={{ margin: 0, padding: BLOCK_SPACING, ...inlineStyle(style) }}
          >
            {children}
          </p>
        ),
        span: ({ children, style, node }) => (
          <span
            style={{
              ...inlineStyle(style),
              ...(node?.properties?.dataChecked === undefined
                ? {}
                : { textDecoration: 'line-through' }),
            }}
          >
            {children}
          </span>
        ),
        strong: ({ children }) => (
          <strong style={{ fontWeight: 'bold' }}>{children}</strong>
        ),
        em: ({ children }) => (
          <em style={{ fontStyle: 'italic' }}>{children}</em>
        ),
        del: ({ children }) => (
          <del style={{ textDecoration: 'line-through' }}>{children}</del>
        ),
        u: ({ children }) => (
          <u style={{ textDecoration: 'underline' }}>{children}</u>
        ),
        mark: ({ children }) => (
          <mark style={{ backgroundColor: '#fff59d' }}>{children}</mark>
        ),
        ul: ({ children, className, node }) => (
          <ul
            style={{
              ...listStyle(node),
              listStyleType: className?.includes('contains-task-list')
                ? 'none'
                : BULLET_STYLES[readDepth(node) % BULLET_STYLES.length],
              ...(className?.includes('contains-task-list') &&
              readDepth(node) === 0
                ? { paddingLeft: 0 }
                : {}),
            }}
          >
            {children}
          </ul>
        ),
        ol: ({ children, start, node }) => (
          <ol
            start={start}
            style={{
              ...listStyle(node),
              listStyleType: 'decimal',
              counterReset:
                start === undefined ? undefined : `list-item ${start - 1}`,
            }}
          >
            {children}
          </ol>
        ),
        li: ({ children, className }) => (
          <li
            style={{
              display: 'list-item',
              listStyleType:
                className === 'task-list-item' ? 'none' : 'inherit',
              padding: BLOCK_SPACING,
            }}
          >
            {children}
          </li>
        ),
        input: ({ checked, type }) =>
          type === 'checkbox' ? (
            // Not disabled: a disabled box is greyed out, unlike the editor's.
            <input
              type="checkbox"
              checked={checked === true}
              readOnly
              tabIndex={-1}
              style={{
                margin: '0 8px 0 0',
                pointerEvents: 'none',
                verticalAlign: 'middle',
              }}
            />
          ) : null,
        details: ({ children, style }) => (
          <details style={{ padding: BLOCK_SPACING, ...inlineStyle(style) }}>
            {children}
          </details>
        ),
        // Like a link, opening a toggle must not also open the editor the
        // preview sits in.
        summary: ({ children }) => (
          <summary
            onMouseDown={stopLinkEventPropagation}
            onClick={stopLinkEventPropagation}
            style={{ cursor: 'pointer', display: 'list-item' }}
          >
            {children}
          </summary>
        ),
        blockquote: ({ children }) => (
          <blockquote
            style={{
              borderLeft: `2px solid ${QUOTE_COLOR}`,
              paddingLeft: 13,
              margin: BLOCK_SPACING,
              color: QUOTE_COLOR,
            }}
          >
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div style={{ overflowX: 'auto', padding: BLOCK_SPACING }}>
            <table style={{ borderCollapse: 'collapse' }}>{children}</table>
          </div>
        ),
        th: ({ children, style, colSpan, rowSpan }) => (
          <th
            colSpan={colSpan}
            rowSpan={rowSpan}
            style={{
              ...CELL_STYLE,
              ...inlineStyle(style),
              fontWeight: 'bold',
            }}
          >
            {children}
          </th>
        ),
        td: ({ children, style, colSpan, rowSpan }) => (
          <td
            colSpan={colSpan}
            rowSpan={rowSpan}
            style={{ ...CELL_STYLE, ...inlineStyle(style) }}
          >
            {children}
          </td>
        ),
        img: ({ src, alt, title, width }) => (
          <img
            src={src}
            alt={alt}
            title={title}
            style={{ borderRadius: 4, ...mediaSizeStyle(width) }}
          />
        ),
        video: ({ src, width }) => (
          <video
            src={src}
            controls
            style={{ borderRadius: 4, ...mediaSizeStyle(width) }}
          />
        ),
        audio: ({ src }) => (
          <audio src={src} controls style={{ maxWidth: '100%' }} />
        ),
        figure: ({ children }) => (
          <figure style={{ margin: 0, padding: BLOCK_SPACING }}>
            {children}
          </figure>
        ),
        figcaption: ({ children }) => (
          <figcaption
            style={{
              color: TASK_TOKENS.textSecondary,
              fontSize: TASK_TOKENS.fontSizeSmall,
              marginTop: 4,
            }}
          >
            {children}
          </figcaption>
        ),
        pre: ({ children }) => (
          <pre
            style={{
              background: CODE_BLOCK_BACKGROUND,
              borderRadius: 8,
              color: CODE_BLOCK_COLOR,
              margin: BLOCK_SPACING,
              overflowX: 'auto',
              padding: 24,
              whiteSpace: 'pre',
            }}
          >
            {children}
          </pre>
        ),
        code: ({ children }) => (
          <code style={{ fontFamily: 'monospace', fontSize: 13 }}>
            {children}
          </code>
        ),
        hr: () => (
          <hr
            style={{
              border: 0,
              borderTop: `1px solid ${QUOTE_COLOR}`,
              margin: '9.5px 0',
            }}
          />
        ),
      }}
    >
      {normalizeMarkdownHardBreaks(value)}
    </Markdown>
  </div>
);
