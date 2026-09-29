export type MarkdownFormat =
  | 'bold'
  | 'italic'
  | 'code'
  | 'link'
  | 'bulletList'
  | 'numberedList'
  | 'quote'
  | 'heading'
  | 'codeBlock';

export type MarkdownSelection = {
  value: string;
  selectionStart: number;
  selectionEnd: number;
};

type ApplyMarkdownFormatInput = MarkdownSelection & {
  format: MarkdownFormat;
  placeholder: string;
  linkUrl?: string;
};

const WRAP_MARKER_BY_FORMAT = {
  bold: '**',
  italic: '*',
  code: '`',
} as const;

const LINE_PREFIX_BY_FORMAT = {
  bulletList: '- ',
  numberedList: '1. ',
  quote: '> ',
  heading: '## ',
} as const;

const clamp = (position: number, length: number): number =>
  Math.min(Math.max(position, 0), length);

const applyWrap = (
  { value, selectionStart, selectionEnd }: MarkdownSelection,
  marker: string,
  placeholder: string,
): MarkdownSelection => {
  const selected = value.slice(selectionStart, selectionEnd);
  const isWrappedInside =
    selected.length > marker.length * 2 &&
    selected.startsWith(marker) &&
    selected.endsWith(marker);

  if (isWrappedInside) {
    const unwrapped = selected.slice(marker.length, -marker.length);

    return {
      value:
        value.slice(0, selectionStart) + unwrapped + value.slice(selectionEnd),
      selectionStart,
      selectionEnd: selectionStart + unwrapped.length,
    };
  }

  // The markers can also sit just outside the range — that is the state the
  // previous click on this same button left behind, so pressing it again has to
  // undo rather than nest.
  const isWrappedOutside =
    value.slice(selectionStart - marker.length, selectionStart) === marker &&
    value.slice(selectionEnd, selectionEnd + marker.length) === marker;

  if (isWrappedOutside) {
    return {
      value:
        value.slice(0, selectionStart - marker.length) +
        selected +
        value.slice(selectionEnd + marker.length),
      selectionStart: selectionStart - marker.length,
      selectionEnd: selectionEnd - marker.length,
    };
  }

  const text = selected === '' ? placeholder : selected;

  return {
    value:
      value.slice(0, selectionStart) +
      marker +
      text +
      marker +
      value.slice(selectionEnd),
    selectionStart: selectionStart + marker.length,
    selectionEnd: selectionStart + marker.length + text.length,
  };
};

const applyLinePrefix = (
  { value, selectionStart, selectionEnd }: MarkdownSelection,
  prefix: string,
): MarkdownSelection => {
  const lineStart = value.lastIndexOf('\n', Math.max(selectionStart - 1, 0)) + 1;
  const lineEndIndex = value.indexOf('\n', selectionEnd);
  const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;

  const lines = value.slice(lineStart, lineEnd).split('\n');
  // A numbered list has to renumber as it goes, so the prefix is rebuilt per
  // line rather than repeated.
  const buildPrefix = (index: number) =>
    prefix === '1. ' ? `${index + 1}. ` : prefix;
  const matchesPrefix = (line: string, index: number) =>
    prefix === '1. '
      ? /^\s*\d+[.)]\s+/.test(line)
      : line.startsWith(buildPrefix(index));

  const shouldRemove = lines.every(
    (line, index) => line.trim() === '' || matchesPrefix(line, index),
  );

  const nextLines = lines.map((line, index) => {
    if (line.trim() === '') {
      return line;
    }

    if (shouldRemove) {
      return prefix === '1. '
        ? line.replace(/^\s*\d+[.)]\s+/, '')
        : line.slice(buildPrefix(index).length);
    }

    return `${buildPrefix(index)}${line}`;
  });

  const nextBlock = nextLines.join('\n');
  const nextValue =
    value.slice(0, lineStart) + nextBlock + value.slice(lineEnd);

  return {
    value: nextValue,
    selectionStart: lineStart,
    selectionEnd: lineStart + nextBlock.length,
  };
};

const applyLink = (
  { value, selectionStart, selectionEnd }: MarkdownSelection,
  placeholder: string,
  linkUrl: string,
): MarkdownSelection => {
  const selected = value.slice(selectionStart, selectionEnd);
  const text = selected === '' ? placeholder : selected;
  const inserted = `[${text}](${linkUrl})`;

  return {
    value:
      value.slice(0, selectionStart) + inserted + value.slice(selectionEnd),
    selectionStart: selectionStart + 1,
    selectionEnd: selectionStart + 1 + text.length,
  };
};

const applyCodeBlock = ({
  value,
  selectionStart,
  selectionEnd,
}: MarkdownSelection): MarkdownSelection => {
  const selected = value.slice(selectionStart, selectionEnd);
  const before = value.slice(0, selectionStart);
  const leadingNewline = before === '' || before.endsWith('\n') ? '' : '\n';
  const inserted = `${leadingNewline}\`\`\`\n${selected}\n\`\`\`\n`;

  return {
    value: before + inserted + value.slice(selectionEnd),
    selectionStart: selectionStart + leadingNewline.length + 4,
    selectionEnd: selectionStart + leadingNewline.length + 4 + selected.length,
  };
};

// Pure so the composer stays a thin shell over it: the sandbox gives a
// textarea's own selectionStart/selectionEnd only through the events it
// forwards, and everything that turns that range into new markdown is tested
// here rather than in the browser.
export const applyMarkdownFormat = ({
  value,
  selectionStart,
  selectionEnd,
  format,
  placeholder,
  linkUrl = 'https://',
}: ApplyMarkdownFormatInput): MarkdownSelection => {
  const start = clamp(Math.min(selectionStart, selectionEnd), value.length);
  const end = clamp(Math.max(selectionStart, selectionEnd), value.length);
  const selection = { value, selectionStart: start, selectionEnd: end };

  if (format === 'link') {
    return applyLink(selection, placeholder, linkUrl);
  }

  if (format === 'codeBlock') {
    return applyCodeBlock(selection);
  }

  if (format in WRAP_MARKER_BY_FORMAT) {
    return applyWrap(
      selection,
      WRAP_MARKER_BY_FORMAT[format as keyof typeof WRAP_MARKER_BY_FORMAT],
      placeholder,
    );
  }

  return applyLinePrefix(
    selection,
    LINE_PREFIX_BY_FORMAT[format as keyof typeof LINE_PREFIX_BY_FORMAT],
  );
};

// A pasted or dropped link becomes an image when the URL looks like one, which
// is the only attachment shape a front component can produce: the sandbox never
// receives file bytes, only a file's name, size and type.
export const buildMarkdownForUrl = (url: string, isImage: boolean): string => {
  const name = decodeURIComponent(url.split('/').pop() ?? url).split('?')[0];

  return isImage ? `![${name}](${url})` : `[${name}](${url})`;
};
