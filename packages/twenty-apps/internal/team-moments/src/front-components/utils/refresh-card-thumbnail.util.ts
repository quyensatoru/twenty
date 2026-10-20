import { uploadFile } from 'twenty-sdk/front-component';

import { findCardTemplate } from '../../constants/card-templates';
import { EVENT_CARD_OBJECT_UID, EVENT_CARD_THUMBNAIL_FIELD_UID } from '../../constants/universal-identifiers';
import { type EventCardRow } from '../../types/moments-records';
import { type Occurrence } from '../../types/occurrence';
import { formatSignerLine, formatVietnameseDate } from '../../utils/describe-card.util';
import { updateRecord } from './moments-rest.util';
import { renderCardThumbnail } from './render-card-thumbnail.util';
import { resolveFieldMetadataId } from './resolve-field-metadata-id.util';

// A failed thumbnail only costs the link preview its image, never the card save.
export const refreshCardThumbnail = async (
  card: EventCardRow,
  occurrence: Occurrence,
  fallbackBackgroundImageUrl?: string | null,
): Promise<EventCardRow['thumbnail']> => {
  try {
    const isInvitation = card.cardKind === 'INVITATION';
    const template = findCardTemplate(card.templateKey);
    const dateLabel = formatVietnameseDate(card.eventDate);
    const signerNames = (card.signatures ?? []).map((signature) => signature.name);
    const blob = await renderCardThumbnail({
      template,
      isInvitation,
      eventTitle: card.eventTitle,
      cardEyebrow: isInvitation ? `THIỆP MỜI · ${dateLabel}` : dateLabel || template.eyebrow,
      dateLabel,
      recipient: card.recipient ?? '',
      message: card.message ?? '',
      signerNames,
      signerLine: formatSignerLine(signerNames),
      invitationLines: isInvitation
        ? [[occurrence.startTime, dateLabel.replace(/ · /g, '/')].filter(Boolean).join(', '), occurrence.location ?? ''].filter((line) => line.length > 0)
        : [],
      startTime: occurrence.startTime,
      location: occurrence.location,
      backgroundImageUrl: card.backgroundImage?.[0]?.url ?? fallbackBackgroundImageUrl,
    });
    const fieldMetadataId = await resolveFieldMetadataId({
      objectUniversalIdentifier: EVENT_CARD_OBJECT_UID,
      fieldUniversalIdentifier: EVENT_CARD_THUMBNAIL_FIELD_UID,
    });

    if (blob === null || fieldMetadataId === null) {
      return null;
    }

    const result = await uploadFile(blob, { fieldMetadataId, fileName: 'thiep.png' });

    if (result.status !== 'uploaded') {
      return null;
    }

    const thumbnail = [{ fileId: result.file.fileId, label: 'thiep.png' }];

    await updateRecord('eventCards', card.id, { thumbnail });

    return thumbnail;
  } catch {
    // Ignored on purpose, see above.
    return null;
  }
};
