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
    div: [...(defaultSchema.attributes?.div ?? []), 'style'],
    span: [...(defaultSchema.attributes?.span ?? []), 'style'],
    td: [...(defaultSchema.attributes?.td ?? []), 'style'],
    th: [...(defaultSchema.attributes?.th ?? []), 'style'],
    video: ['src', 'controls', 'poster'],
    audio: ['src', 'controls'],
  },
};

// Mirrors Twenty's TipTap editor (AdvancedTextEditor, app variant), which is
// what edits this text: reading and editing must look like one document.
// The host resets native HTML styles, so every tag is styled here.
const LINE_HEIGHT = '24px';
const BLOCK_SPACING = 12;
const HEADING_FONT_SIZES = ['24px', '20px', '16px', '1.15em', '1em', '0.9em'];
const LIST_INDENT = 16;
const LIST_ITEM_SPACING = 8;
const NON_BREAKING_SPACE = String.fromCharCode(160);

type BlockNode = { properties?: Record<string, unknown> } | undefined;

// The editor drops the outer margins of a container's first and last blocks.
const isFirstChild = (node: BlockNode) =>
  node?.properties?.dataFirstChild === true;
const isLastChild = (node: BlockNode) =>
  node?.properties?.dataLastChild === true;

const blockMargin = (
  node: BlockNode,
  bottom = BLOCK_SPACING,
): CSSProperties => ({
  margin: `0 0 ${isLastChild(node) ? 0 : bottom}px`,
});

const headingStyle = (level: number, node: BlockNode): CSSProperties => ({
  fontSize: HEADING_FONT_SIZES[level - 1],
  fontWeight: 600,
  lineHeight: 1.2,
  margin: `${isFirstChild(node) ? 0 : 24}px 0 ${isLastChild(node) ? 0 : 8}px`,
});

// The host resets list markers, so the browser's own are restated.
const BULLET_STYLES = ['disc', 'circle', 'square'];

const listStyle = (
  node: BlockNode,
  listStyleType: CSSProperties['listStyleType'],
): CSSProperties => ({
  ...blockMargin(node),
  listStyleType,
  padding: 0,
  paddingLeft: listStyleType === 'none' ? 0 : LIST_INDENT,
});

const CELL_STYLE: CSSProperties = {
  border: `1px solid ${TASK_TOKENS.border}`,
  boxSizing: 'border-box',
  padding: '4px 8px',
  textAlign: 'left',
  verticalAlign: 'top',
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

// The editor writes a line break as a bare newline and reads it back as one,
// where plain markdown would fold it into a space.
const remarkSoftBreaks = () => (tree: MarkdownRoot) => {
  const visit = (node: MarkdownRoot | MarkdownContent) => {
    if (!('children' in node)) {
      return;
    }

    node.children = node.children.flatMap((child) => {
      if (child.type !== 'text' || !child.value.includes('\n')) {
        visit(child);
        return [child];
      }

      return child.value
        .split('\n')
        .flatMap((line, index): MarkdownContent[] =>
          index === 0
            ? [{ type: 'text', value: line }]
            : [{ type: 'break' }, { type: 'text', value: line }],
        );
    }) as typeof node.children;
  };

  visit(tree);
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
        color: TASK_TOKENS.accent,
        cursor: 'pointer',
        textDecoration: 'underline',
      }}
    >
      {children}
    </a>
  );
};

// Marks what the preview has to style by context, since a component only sees
// its own node: each container's first and last block, and the inline text of
// a ticked task (crossed out like the editor's, subtasks included).
const rehypeEditorLayout = () => (tree: Root) => {
  const visit = (parent: Root | Element, bulletDepth: number) => {
    const elements = (parent.children as RootContent[]).filter(
      (child): child is Element => child.type === 'element',
    );

    elements.forEach((child, index) => {
      child.properties = {
        ...child.properties,
        dataFirstChild: index === 0,
        dataLastChild: index === elements.length - 1,
      };

      if (parent.type === 'element' && parent.tagName === 'pre') {
        child.properties.dataInCodeBlock = true;
      }

      if (
        parent.type === 'element' &&
        (parent.tagName === 'li' || parent.properties?.dataTaskContent === true)
      ) {
        child.properties.dataInListItem = true;
      }

      if (child.tagName === 'li') {
        const checkbox = child.children.find(
          (node): node is Element =>
            node.type === 'element' && node.tagName === 'input',
        );

        // GFM keeps the space after `[ ]`, which the checkbox gap already
        // provides.
        const textAfterCheckbox =
          checkbox === undefined
            ? undefined
            : child.children[child.children.indexOf(checkbox) + 1];

        if (textAfterCheckbox?.type === 'text') {
          textAfterCheckbox.value = textAfterCheckbox.value.trimStart();
        }

        if (checkbox !== undefined) {
          child.properties.dataChecked = checkbox.properties?.checked === true;
          child.children = [
            checkbox,
            {
              type: 'element',
              tagName: 'div',
              properties: { dataTaskContent: true },
              children: child.children.filter((node) => node !== checkbox),
            },
          ];
        }
      }

      const isBulletList = child.tagName === 'ul';

      if (isBulletList) {
        child.properties.dataBulletDepth = bulletDepth;
      }

      visit(child, isBulletList ? bulletDepth + 1 : bulletDepth);
    });
  };

  visit(tree, 0);
};

export const TaskRichTextPreview = ({ value }: TaskRichTextPreviewProps) => (
  <div
    style={{
      color: TASK_TOKENS.textPrimary,
      fontFamily: TASK_TOKENS.fontFamily,
      fontSize: 13,
      lineHeight: LINE_HEIGHT,
      minWidth: 0,
      overflowWrap: 'anywhere',
      userSelect: 'text',
      width: '100%',
    }}
  >
    <Markdown
      remarkPlugins={[remarkGfm, remarkSoftBreaks, remarkPreviewLinks]}
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
        h1: ({ children, node }) => (
          <h1 style={headingStyle(1, node)}>{children}</h1>
        ),
        h2: ({ children, node }) => (
          <h2 style={headingStyle(2, node)}>{children}</h2>
        ),
        h3: ({ children, node }) => (
          <h3 style={headingStyle(3, node)}>{children}</h3>
        ),
        h4: ({ children, node }) => (
          <h4 style={headingStyle(4, node)}>{children}</h4>
        ),
        h5: ({ children, node }) => (
          <h5 style={headingStyle(5, node)}>{children}</h5>
        ),
        h6: ({ children, node }) => (
          <h6 style={headingStyle(6, node)}>{children}</h6>
        ),
        div: ({ children, style, node }) =>
          node?.properties?.dataTaskContent === true ? (
            <div style={{ flex: '1 1 auto', minWidth: 0 }}>{children}</div>
          ) : (
            <div style={inlineStyle(style)}>{children}</div>
          ),
        // An `&nbsp;` paragraph is how the editor keeps an empty line. The
        // character itself reaches the host page as the literal text
        // "&nbsp;", so the line is drawn with a break instead.
        p: ({ children, style, node }) => (
          <p
            style={{
              ...(node?.properties?.dataInListItem === true
                ? { margin: 0 }
                : blockMargin(node)),
              ...inlineStyle(style),
            }}
          >
            {children === NON_BREAKING_SPACE ? <br /> : children}
          </p>
        ),
        span: ({ children, style }) => (
          <span style={inlineStyle(style)}>{children}</span>
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
            style={listStyle(
              node,
              className?.includes('contains-task-list') === true
                ? 'none'
                : BULLET_STYLES[
                    Number(node?.properties?.dataBulletDepth ?? 0) %
                      BULLET_STYLES.length
                  ],
            )}
          >
            {children}
          </ul>
        ),
        ol: ({ children, start, node }) => (
          <ol start={start} style={listStyle(node, 'decimal')}>
            {children}
          </ol>
        ),
        li: ({ children, node }) => {
          const isTask = node?.properties?.dataChecked !== undefined;
          const isChecked = node?.properties?.dataChecked === true;

          return (
            <li
              style={{
                ...blockMargin(node, LIST_ITEM_SPACING),
                ...(isTask
                  ? {
                      alignItems: 'flex-start',
                      display: 'flex',
                      gap: 8,
                      listStyleType: 'none',
                    }
                  : { display: 'list-item' }),
                ...(isChecked
                  ? {
                      color: TASK_TOKENS.textTertiary,
                      textDecoration: 'line-through',
                    }
                  : {}),
              }}
            >
              {children}
            </li>
          );
        },
        input: ({ checked, type }) =>
          type === 'checkbox' ? (
            // Not disabled: a disabled box is greyed out, unlike the editor's.
            <input
              type="checkbox"
              checked={checked === true}
              readOnly
              tabIndex={-1}
              // The browser's own checkbox margins, which the editor keeps.
              style={{
                flex: '0 0 auto',
                margin: '3px 3px 3px 4px',
                pointerEvents: 'none',
              }}
            />
          ) : null,
        blockquote: ({ children, node }) => (
          <blockquote
            style={{
              ...blockMargin(node),
              borderLeft: `2px solid ${TASK_TOKENS.accent}`,
              fontStyle: 'italic',
              paddingLeft: 12,
            }}
          >
            {children}
          </blockquote>
        ),
        table: ({ children, node }) => (
          <div
            style={{
              ...blockMargin(node),
              overflowX: 'auto',
              padding: '0 16px 16px 0',
            }}
          >
            <table
              style={{
                borderCollapse: 'collapse',
                tableLayout: 'fixed',
                width: '100%',
              }}
            >
              {children}
            </table>
          </div>
        ),
        th: ({ children, style, colSpan, rowSpan }) => (
          <th
            colSpan={colSpan}
            rowSpan={rowSpan}
            style={{
              ...CELL_STYLE,
              ...inlineStyle(style),
              backgroundColor: TASK_TOKENS.backgroundTertiary,
              fontWeight: 500,
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
            style={mediaSizeStyle(width)}
          />
        ),
        video: ({ src, width }) => (
          <video src={src} controls style={mediaSizeStyle(width)} />
        ),
        audio: ({ src }) => (
          <audio src={src} controls style={{ maxWidth: '100%' }} />
        ),
        figure: ({ children, node }) => (
          <figure style={blockMargin(node)}>{children}</figure>
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
        pre: ({ children, node }) => (
          <pre
            style={{
              ...blockMargin(node),
              backgroundColor: TASK_TOKENS.backgroundTransparentLighter,
              borderRadius: TASK_TOKENS.radius,
              overflowX: 'auto',
              padding: '8px 12px',
              whiteSpace: 'pre',
            }}
          >
            {children}
          </pre>
        ),
        code: ({ children, node }) => (
          <code
            style={{
              fontFamily: 'var(--t-code-font-family, monospace)',
              fontSize: '0.9em',
              ...(node?.properties?.dataInCodeBlock === true
                ? {}
                : {
                    backgroundColor: TASK_TOKENS.backgroundTransparentLight,
                    borderRadius: TASK_TOKENS.radiusExtraSmall,
                    padding: '0 4px',
                  }),
            }}
          >
            {children}
          </code>
        ),
        hr: ({ node }) => (
          <hr
            style={{
              ...blockMargin(node),
              border: 0,
              borderTop: `1px solid ${TASK_TOKENS.border}`,
            }}
          />
        ),
      }}
    >
      {normalizeMarkdownHardBreaks(value)}
    </Markdown>
  </div>
);
