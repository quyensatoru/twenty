import { type Element, type Root, type RootContent } from 'hast';
import { find } from 'linkifyjs';
import {
  type Root as MarkdownRoot,
  type RootContent as MarkdownContent,
} from 'mdast';
import { type CSSProperties, type SyntheticEvent } from 'react';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

import { TASK_TOKENS } from './task-tokens';

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
    span: [...(defaultSchema.attributes?.span ?? []), 'style'],
    td: [...(defaultSchema.attributes?.td ?? []), 'style'],
    th: [...(defaultSchema.attributes?.th ?? []), 'style'],
    video: ['src', 'controls', 'poster'],
    audio: ['src', 'controls'],
  },
};

// The host resets native HTML styles, so semantic tags need explicit formatting.
const CELL_STYLE: CSSProperties = {
  border: `1px solid ${TASK_TOKENS.borderStrong}`,
  padding: '6px 12px',
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

const stopLinkEventPropagation = (event: SyntheticEvent) => {
  event.stopPropagation();
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

export const TaskRichTextPreview = ({ value }: TaskRichTextPreviewProps) => (
  <div
    style={{
      color: TASK_TOKENS.textPrimary,
      fontFamily: TASK_TOKENS.fontFamily,
      fontSize: 13,
      lineHeight: '1.6',
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
      ]}
      components={{
        a: ({ children, href, title }) => (
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
        ),
        h1: ({ children }) => (
          <h1
            style={{ fontSize: '2em', fontWeight: 'bold', margin: '0 0 8px' }}
          >
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2
            style={{ fontSize: '1.5em', fontWeight: 'bold', margin: '0 0 8px' }}
          >
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3
            style={{
              fontSize: '1.17em',
              fontWeight: 'bold',
              margin: '0 0 8px',
            }}
          >
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4
            style={{ fontSize: '1em', fontWeight: 'bold', margin: '0 0 8px' }}
          >
            {children}
          </h4>
        ),
        h5: ({ children }) => (
          <h5
            style={{ fontSize: '.83em', fontWeight: 'bold', margin: '0 0 8px' }}
          >
            {children}
          </h5>
        ),
        h6: ({ children }) => (
          <h6
            style={{ fontSize: '.67em', fontWeight: 'bold', margin: '0 0 8px' }}
          >
            {children}
          </h6>
        ),
        p: ({ children, style }) => (
          <p style={{ margin: '0 0 8px', ...inlineStyle(style) }}>{children}</p>
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
        ul: ({ children }) => (
          <ul
            style={{
              listStyleType: 'disc',
              paddingLeft: 24,
              margin: '0 0 8px',
            }}
          >
            {children}
          </ul>
        ),
        ol: ({ children, start }) => (
          <ol
            start={start}
            style={{
              listStyleType: 'decimal',
              counterReset:
                start === undefined ? undefined : `list-item ${start - 1}`,
              paddingLeft: 24,
              margin: '0 0 8px',
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
            }}
          >
            {children}
          </li>
        ),
        blockquote: ({ children }) => (
          <blockquote
            style={{
              borderLeft: `3px solid ${TASK_TOKENS.borderStrong}`,
              paddingLeft: 12,
              margin: '0 0 8px',
              color: TASK_TOKENS.textSecondary,
            }}
          >
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div style={{ overflowX: 'auto', marginBottom: 8 }}>
            <table style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
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
              backgroundColor: TASK_TOKENS.backgroundTertiary,
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
        img: ({ src, alt, title }) => (
          <img
            src={src}
            alt={alt}
            title={title}
            style={{ borderRadius: TASK_TOKENS.radiusSmall, maxWidth: '100%' }}
          />
        ),
        pre: ({ children }) => (
          <pre
            style={{
              background: TASK_TOKENS.backgroundSecondary,
              borderRadius: TASK_TOKENS.radiusSmall,
              overflowX: 'auto',
              padding: 8,
              whiteSpace: 'pre',
            }}
          >
            {children}
          </pre>
        ),
        code: ({ children }) => (
          <code
            style={{
              fontFamily: 'monospace',
              backgroundColor: TASK_TOKENS.backgroundTertiary,
              borderRadius: 3,
              padding: '1px 3px',
            }}
          >
            {children}
          </code>
        ),
        hr: () => (
          <hr
            style={{
              border: 0,
              borderTop: `1px solid ${TASK_TOKENS.borderStrong}`,
              margin: '12px 0',
            }}
          />
        ),
      }}
    >
      {value}
    </Markdown>
  </div>
);
