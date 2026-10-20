import { findCardTemplate } from '../constants/card-templates';
import { type EventCardRow } from '../types/moments-records';
import { buildCardSvg } from './build-card-svg.util';
import { parseIsoDate } from './moments-date.util';

const SIGNER_NAMES_SHOWN = 4;

export const formatSignerLine = (names: string[]): string => {
  if (names.length === 0) {
    return '';
  }

  const shown = names.slice(0, SIGNER_NAMES_SHOWN).join(' · ').toUpperCase();
  const rest = names.length - SIGNER_NAMES_SHOWN;

  return rest > 0 ? `${shown} · VÀ ${rest} NGƯỜI KHÁC` : shown;
};

export const formatVietnameseDate = (isoDate: string | null): string => {
  const date = parseIsoDate(isoDate);

  return date === null
    ? ''
    : `${String(date.day).padStart(2, '0')} · ${String(date.month).padStart(2, '0')} · ${date.year}`;
};

type CardExtras = { startTime?: string | null; location?: string | null };

// One place that turns a stored card into its SVG, shared by the in-app
// preview, the download route and the public share page.
export const describeCardSvg = (card: EventCardRow, extras: CardExtras = {}, backgroundImageDataUrl?: string | null): string => {
  const template = findCardTemplate(card.templateKey);
  const isInvitation = card.cardKind === 'INVITATION';
  const dateLabel = formatVietnameseDate(card.eventDate);

  return buildCardSvg({
    template,
    eyebrow: isInvitation ? `THIỆP MỜI · ${dateLabel}` : dateLabel || template.eyebrow,
    recipient: card.recipient ?? '',
    message: card.message ?? '',
    signerLine: formatSignerLine((card.signatures ?? []).map((signature) => signature.name)),
    invitationLines: isInvitation
      ? [
          [extras.startTime, dateLabel.replace(/ · /g, '/')].filter(Boolean).join(', '),
          extras.location ?? '',
        ].filter((line) => line.length > 0)
      : [],
    backgroundImageDataUrl,
  });
};
