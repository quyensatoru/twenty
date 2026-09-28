import { type EmailBlock } from '../types/email-block';
import { type EmailDesignSettings } from '../types/email-design';
import { type TemplateVariables } from '../types/template-variables';
import { escapeHtml } from './escape-html.util';
import { interpolateTemplate } from './interpolate-template.util';
import { renderInlineMarkup } from './render-inline-markup.util';
import { sanitizeUrl } from './sanitize-url.util';

const HEADING_FONT_SIZES = { 1: 28, 2: 22, 3: 18 } as const;

const wrapInRow = (content: string, padding: string): string =>
  `<tr><td style="padding:${padding};">${content}</td></tr>`;

// Table-based markup with inline styles only: Outlook and Gmail drop <style>
// blocks and flexbox, so this is the one layout every client renders alike.
export const renderEmailBlockHtml = (
  block: EmailBlock,
  settings: EmailDesignSettings,
  variables: TemplateVariables,
): string => {
  const interpolate = (value: string) => interpolateTemplate(value, variables);
  const color = escapeHtml(settings.textColor);

  switch (block.type) {
    case 'heading': {
      const fontSize = HEADING_FONT_SIZES[block.level] ?? HEADING_FONT_SIZES[2];

      return wrapInRow(
        `<h${block.level} style="margin:0;font-size:${fontSize}px;line-height:1.3;font-weight:700;color:${color};text-align:${block.align};">${renderInlineMarkup(interpolate(block.text), settings.linkColor)}</h${block.level}>`,
        '8px 32px',
      );
    }
    case 'text': {
      const paragraphs = interpolate(block.text)
        .split(/\r?\n\s*\r?\n/)
        .filter((paragraph) => paragraph.trim() !== '')
        .map(
          (paragraph) =>
            `<p style="margin:0 0 12px 0;font-size:16px;line-height:1.6;color:${color};text-align:${block.align};">${renderInlineMarkup(paragraph, settings.linkColor)}</p>`,
        )
        .join('');

      return wrapInRow(paragraphs, '4px 32px');
    }
    case 'button': {
      const href = escapeHtml(sanitizeUrl(interpolate(block.url)));
      const background = escapeHtml(block.backgroundColor);
      const textColor = escapeHtml(block.textColor);

      return wrapInRow(
        `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="${block.align}" style="margin:0 ${block.align === 'center' ? 'auto' : '0'};"><tr><td bgcolor="${background}" style="border-radius:6px;background:${background};"><a href="${href}" target="_blank" style="display:inline-block;padding:12px 24px;font-size:16px;font-weight:600;line-height:1.2;color:${textColor};text-decoration:none;border-radius:6px;">${escapeHtml(interpolate(block.label))}</a></td></tr></table>`,
        '12px 32px',
      );
    }
    case 'image': {
      if (block.src.trim() === '') {
        return '';
      }

      const widthPercent = Math.min(100, Math.max(10, block.widthPercent));
      const widthPixels = Math.round(
        ((settings.contentWidth - 64) * widthPercent) / 100,
      );
      const image = `<img src="${escapeHtml(sanitizeUrl(interpolate(block.src)))}" alt="${escapeHtml(interpolate(block.alt))}" width="${widthPixels}" style="display:block;width:100%;max-width:${widthPixels}px;height:auto;border:0;outline:none;${block.align === 'center' ? 'margin:0 auto;' : block.align === 'right' ? 'margin-left:auto;' : ''}" />`;
      const linkedImage =
        block.href.trim() === ''
          ? image
          : `<a href="${escapeHtml(sanitizeUrl(interpolate(block.href)))}" target="_blank">${image}</a>`;

      return wrapInRow(linkedImage, '8px 32px');
    }
    case 'divider':
      return wrapInRow(
        `<div style="border-top:1px solid ${escapeHtml(block.color)};font-size:0;line-height:0;">&nbsp;</div>`,
        '12px 32px',
      );
    case 'spacer':
      return `<tr><td style="height:${Math.max(0, Math.round(block.height))}px;font-size:0;line-height:0;">&nbsp;</td></tr>`;
    default:
      return '';
  }
};
