import { find } from 'linkifyjs';

// Existing Markdown destinations and code must stay opaque to URL detection.
const MARKDOWN_TOKEN_PATTERN =
  /^ {0,3}(`{3,}|~{3,})[^\n]*(?:\n[\s\S]*?(?:^ {0,3}\1[`~]*[ \t]*\r?$|(?![\s\S]))|$)|(`+)[\s\S]*?\2(?!`)|!?\[(?:\\.|[^\]\\])*\]\((?:\\.|[^()\\]|\([^()]*\))*\)|!?\[(?:\\.|[^\]\\])*\]\s*\[[^\]]*\]|<[^>\n]*>|^ {0,3}\[[^\]]+\]:[^\n]*$|^(?: {4}|\t)[^\n]*$|(?<![\w\\])(\*\*|__|\*|_)(?=\S)([\s\S]*?\S)\3(?!\w)/gm;

const ESCAPED_MARKDOWN_PATTERN = /\\([!"#$%&'()*+,\-./:;<=>?@[\]\\^_`{|}~])/g;

const linkifyText = (text: string): string => {
  let result = '';
  let lastIndex = 0;

  for (const link of find(text, 'url', { defaultProtocol: 'https' })) {
    if (!/^https?:\/\//i.test(link.href)) {
      continue;
    }

    const label = link.value
      .replace(ESCAPED_MARKDOWN_PATTERN, '$1')
      .replace(/[\\\[\]*_`]/g, '\\$&');
    const destination = link.href
      .replace(ESCAPED_MARKDOWN_PATTERN, '$1')
      .replace(
        /[()<>\\]/g,
        (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
      );

    result += `${text.slice(lastIndex, link.start)}[${label}](${destination})`;
    lastIndex = link.end;
  }

  return result + text.slice(lastIndex);
};

export const linkifyPreviewMarkdown = (markdown: string): string => {
  let result = '';
  let lastIndex = 0;

  for (const match of markdown.matchAll(MARKDOWN_TOKEN_PATTERN)) {
    const matchIndex = match.index ?? 0;

    const emphasisMarker = match[3];
    const token =
      emphasisMarker !== undefined
        ? `${emphasisMarker}${linkifyPreviewMarkdown(match[4])}${emphasisMarker}`
        : match[0];

    result += linkifyText(markdown.slice(lastIndex, matchIndex)) + token;
    lastIndex = matchIndex + match[0].length;
  }

  return result + linkifyText(markdown.slice(lastIndex));
};
