import { DEFAULT_EMAIL_DESIGN } from '../constants/default-email-design';
import { type EmailBlock, type EmailBlockAlign } from '../types/email-block';
import { type EmailDesign } from '../types/email-design';
import { safeJsonParse } from './safe-json-parse.util';

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (value: unknown, fallback: string): string =>
  typeof value === 'string' ? value : fallback;

const readNumber = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const readAlign = (value: unknown): EmailBlockAlign =>
  value === 'center' || value === 'right' ? value : 'left';

const parseBlock = (value: unknown, index: number): EmailBlock | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = readString(value.id, `block-${index}`);

  switch (value.type) {
    case 'heading': {
      const level = value.level === 1 || value.level === 3 ? value.level : 2;

      return {
        id,
        type: 'heading',
        text: readString(value.text, ''),
        level,
        align: readAlign(value.align),
      };
    }
    case 'text':
      return {
        id,
        type: 'text',
        text: readString(value.text, ''),
        align: readAlign(value.align),
      };
    case 'button':
      return {
        id,
        type: 'button',
        label: readString(value.label, 'Button'),
        url: readString(value.url, ''),
        align: readAlign(value.align),
        backgroundColor: readString(value.backgroundColor, '#1961ed'),
        textColor: readString(value.textColor, '#ffffff'),
      };
    case 'image':
      return {
        id,
        type: 'image',
        src: readString(value.src, ''),
        alt: readString(value.alt, ''),
        href: readString(value.href, ''),
        widthPercent: readNumber(value.widthPercent, 100),
        align: readAlign(value.align),
      };
    case 'divider':
      return { id, type: 'divider', color: readString(value.color, '#e5e7eb') };
    case 'spacer':
      return { id, type: 'spacer', height: readNumber(value.height, 24) };
    default:
      return null;
  }
};

// The design column is RAW_JSON anyone can edit from the record page, so it is
// read defensively: a broken block is dropped instead of failing the send.
export const parseEmailDesign = (value: unknown): EmailDesign => {
  const parsed = typeof value === 'string' ? safeJsonParse(value) : value;

  if (!isRecord(parsed)) {
    return DEFAULT_EMAIL_DESIGN;
  }

  const settings = isRecord(parsed.settings) ? parsed.settings : {};
  const defaults = DEFAULT_EMAIL_DESIGN.settings;
  const blocks = Array.isArray(parsed.blocks)
    ? parsed.blocks
        .map((block, index) => parseBlock(block, index))
        .filter((block): block is EmailBlock => block !== null)
    : [];

  return {
    version: 1,
    mode: parsed.mode === 'html' ? 'html' : 'blocks',
    html: readString(parsed.html, ''),
    css: readString(parsed.css, ''),
    settings: {
      backgroundColor: readString(
        settings.backgroundColor,
        defaults.backgroundColor,
      ),
      contentBackgroundColor: readString(
        settings.contentBackgroundColor,
        defaults.contentBackgroundColor,
      ),
      textColor: readString(settings.textColor, defaults.textColor),
      linkColor: readString(settings.linkColor, defaults.linkColor),
      fontFamily: readString(settings.fontFamily, defaults.fontFamily),
      contentWidth: readNumber(settings.contentWidth, defaults.contentWidth),
      footerText: readString(settings.footerText, defaults.footerText),
      unsubscribeLabel: readString(
        settings.unsubscribeLabel,
        defaults.unsubscribeLabel,
      ),
    },
    blocks,
  };
};
