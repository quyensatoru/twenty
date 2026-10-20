import { useCallback, useEffect, useState } from 'react';
import { copyToClipboard, enqueueSnackbar, uploadFile } from 'twenty-sdk/front-component';
import { getPublicAssetUrl } from 'twenty-sdk/utils';
import { IconPhoto } from 'twenty-ui/icon';

import { CARD_TEMPLATES, findCardTemplate } from '../../constants/card-templates';
import { CARD_IMAGE_ROUTE_PATH, SHARE_PAGE_ROUTE_PATH } from '../../constants/route-paths';
import { EVENT_CARD_BACKGROUND_IMAGE_FIELD_UID, EVENT_CARD_OBJECT_UID, EVENT_CARD_THUMBNAIL_FIELD_UID } from '../../constants/universal-identifiers';
import { type Occurrence } from '../../types/occurrence';
import { type CardSignature, type EventCardRow, type MemberSummary } from '../../types/moments-records';
import { type TransferredFile } from '../../types/transferred-file';
import { formatSignerLine, formatVietnameseDate } from '../../utils/describe-card.util';
import { resolveShareImageUrl } from '../../utils/resolve-share-image-url.util';
import { buildMattermostShareText } from '../utils/build-mattermost-share-text.util';
import { createShareToken } from '../utils/create-share-token.util';
import { renderCardThumbnail } from '../utils/render-card-thumbnail.util';
import { readTransferredFiles } from '../utils/read-transferred-files.util';
import { resolveFieldMetadataId } from '../utils/resolve-field-metadata-id.util';
import { isUploadFileByHandleAvailable, uploadFileByHandle } from '../utils/upload-file-by-handle.util';
import {
  createRecord,
  listRecords,
  readErrorText,
  resolveAppRouteUrl,
  updateRecord,
} from '../utils/moments-rest.util';
import {
  pickDefaultMessage,
  pickDefaultRecipient,
  pickDefaultTemplate,
} from '../utils/pick-default-template.util';
import { CardPreview } from './card-preview';
import { MomentsButton } from './moments-button';
import { MomentsField } from './moments-field';
import { MomentsTextField } from './moments-text-field';
import { MOMENTS_TOKENS } from './moments-tokens';

type CardPanelProps = {
  occurrence: Occurrence;
  currentMember: MemberSummary | null;
};

type CardDraft = Pick<EventCardRow, 'templateKey' | 'cardKind' | 'recipient' | 'message' | 'backgroundImage'>;

const MAX_BACKGROUND_BYTES = 3 * 1024 * 1024;
const BACKGROUND_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

const sectionTitleStyle = { color: MOMENTS_TOKENS.textPrimary, fontSize: 13, fontWeight: 600 } as const;

export const CardPanel = ({ occurrence, currentMember }: CardPanelProps) => {
  const [card, setCard] = useState<EventCardRow | null>(null);
  const [draft, setDraft] = useState<CardDraft | null>(null);
  const [note, setNote] = useState('');
  const [noteKey, setNoteKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingBackground, setIsUploadingBackground] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [existing] = await listRecords<EventCardRow>('eventCards', {
        filter: `occurrenceKey[eq]:"${occurrence.key}"`,
        limit: 1,
      });

      setCard(existing ?? null);
      setDraft(
        existing === undefined
          ? {
              ...pickDefaultTemplate(occurrence),
              recipient: pickDefaultRecipient(occurrence),
              message: pickDefaultMessage(occurrence),
              backgroundImage: null,
            }
          : {
              templateKey: existing.templateKey,
              cardKind: existing.cardKind,
              recipient: existing.recipient,
              message: existing.message,
              backgroundImage: existing.backgroundImage,
            },
      );
      setError(null);
    } catch (loadError) {
      setError(readErrorText(loadError));
    } finally {
      setIsLoading(false);
    }
    // Reloading with the same key would throw away an unsaved draft whenever
    // the parent recomputes occurrences.
  }, [occurrence.key]);

  useEffect(() => {
    setIsLoading(true);
    void load();
  }, [load]);

  const signatures = card?.signatures ?? [];
  const hasSigned = currentMember !== null && signatures.some((signature) => signature.memberId === currentMember.id);

  // A failed thumbnail only costs the link preview its image, never the card save.
  const refreshThumbnail = async (saved: EventCardRow) => {
    try {
      const signatures = saved.signatures ?? [];
      const blob = await renderCardThumbnail({
        template: findCardTemplate(saved.templateKey),
        eyebrow: saved.cardKind === 'INVITATION' ? `THIỆP MỜI · ${formatVietnameseDate(saved.eventDate)}` : formatVietnameseDate(saved.eventDate),
        recipient: saved.recipient ?? '',
        footer: signatures.length > 0 ? formatSignerLine(signatures.map((signature) => signature.name)) : 'MIDA · TEAM MOMENTS',
        backgroundImageUrl: saved.backgroundImage?.[0]?.url ?? draft?.backgroundImage?.[0]?.url,
      });
      const fieldMetadataId = await resolveFieldMetadataId({
        objectUniversalIdentifier: EVENT_CARD_OBJECT_UID,
        fieldUniversalIdentifier: EVENT_CARD_THUMBNAIL_FIELD_UID,
      });

      if (blob === null || fieldMetadataId === null) {
        return;
      }

      const result = await uploadFile(blob, { fieldMetadataId, fileName: 'thiep.png' });

      if (result.status === 'uploaded') {
        await updateRecord('eventCards', saved.id, { thumbnail: [{ fileId: result.file.fileId, label: 'thiep.png' }] });
      }
    } catch {
      // Ignored on purpose, see above.
    }
  };

  const uploadBackground = async (files: TransferredFile[]) => {
    const file = files[0];

    if (file === undefined) {
      return;
    }

    if (!BACKGROUND_IMAGE_TYPES.has(file.type) || file.size > MAX_BACKGROUND_BYTES) {
      setError('Chọn ảnh PNG, JPG hoặc WebP tối đa 3 MB.');

      return;
    }

    if (!file.handle || !isUploadFileByHandleAvailable()) {
      setError('Trình duyệt này chưa hỗ trợ tải ảnh lên từ app.');

      return;
    }

    setIsUploadingBackground(true);

    try {
      const fieldMetadataId = await resolveFieldMetadataId({
        objectUniversalIdentifier: EVENT_CARD_OBJECT_UID,
        fieldUniversalIdentifier: EVENT_CARD_BACKGROUND_IMAGE_FIELD_UID,
      });

      if (fieldMetadataId === null) {
        throw new Error('Không tìm thấy nơi lưu ảnh nền.');
      }

      const result = await uploadFileByHandle(file.handle, { fieldMetadataId, fileName: file.name });

      if (result.status !== 'uploaded') {
        throw new Error('Không tải ảnh nền lên được.');
      }

      setDraft((current) => current === null ? null : ({ ...current, backgroundImage: [{ fileId: result.file.fileId, label: file.name, url: result.file.url }] }));
      setError(null);
    } catch (uploadError) {
      setError(readErrorText(uploadError));
    } finally {
      setIsUploadingBackground(false);
    }
  };

  // The card is created on first save or first signature, so an occasion
  // nobody touched leaves no empty card behind.
  const saveCard = async (patch: Partial<EventCardRow>): Promise<EventCardRow | null> => {
    if (draft === null) {
      return null;
    }

    setIsSaving(true);

    try {
      const cardDraft = {
        ...draft,
        backgroundImage: draft.backgroundImage?.map(({ fileId, label }) => ({ fileId, label })) ?? null,
      };
      const saved =
        card === null
          ? await createRecord<EventCardRow>('eventCards', {
              occurrenceKey: occurrence.key,
              eventTitle: occurrence.title,
              eventDate: occurrence.date,
              shareToken: createShareToken(),
              signatures: [],
              ...cardDraft,
              ...patch,
            })
          : await updateRecord<EventCardRow>('eventCards', card.id, { ...cardDraft, ...patch, thumbnail: null });

      setCard(saved);
      setError(null);
      await refreshThumbnail(saved);

      return saved;
    } catch (saveError) {
      setError(readErrorText(saveError));

      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const sign = async () => {
    if (currentMember === null) {
      return;
    }

    const signature: CardSignature = {
      memberId: currentMember.id,
      name: currentMember.name,
      note: note.trim(),
      signedAt: new Date().toISOString(),
    };
    const saved = await saveCard({
      signatures: [...signatures.filter((existing) => existing.memberId !== currentMember.id), signature],
    });

    if (saved !== null) {
      setNote('');
      setNoteKey((current) => current + 1);
      void enqueueSnackbar({ message: 'Đã ký thiệp.', variant: 'success' });
    }
  };

  const ensureSharedCard = async (): Promise<EventCardRow | null> => card ?? (await saveCard({}));

  const copyShareLink = async () => {
    const shared = await ensureSharedCard();

    if (shared?.shareToken === null || shared?.shareToken === undefined) {
      return;
    }

    await copyToClipboard(resolveAppRouteUrl(SHARE_PAGE_ROUTE_PATH, { t: shared.shareToken }));
    void enqueueSnackbar({ message: 'Đã copy link chia sẻ.', variant: 'success' });
  };

  const copyMattermostShare = async () => {
    const shared = await ensureSharedCard();

    if (!shared?.shareToken) {
      return;
    }

    try {
      const shareUrl = resolveAppRouteUrl(SHARE_PAGE_ROUTE_PATH, { t: shared.shareToken });
      const imageUrl = resolveShareImageUrl(null, getPublicAssetUrl('team-moments-preview.png'), new URL(shareUrl).origin);

      await copyToClipboard(buildMattermostShareText({ imageUrl, shareUrl }));
      void enqueueSnackbar({ message: 'Đã copy thiệp cho Mattermost.', variant: 'success' });
    } catch (shareError) {
      setError(readErrorText(shareError));
    }
  };

  if (isLoading || draft === null) {
    return <div style={{ color: MOMENTS_TOKENS.textSecondary, fontFamily: MOMENTS_TOKENS.fontFamily, fontSize: 13, padding: 24 }}>Đang tải thiệp...</div>;
  }

  const shareToken = card?.shareToken ?? null;
  const invitationLines =
    draft.cardKind === 'INVITATION'
      ? [[occurrence.startTime, formatVietnameseDate(occurrence.date).replace(/ · /g, '/')].filter(Boolean).join(', '), occurrence.location ?? ''].filter((line) => line.length > 0)
      : [];

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', fontFamily: MOMENTS_TOKENS.fontFamily, gap: 24, padding: 24 }}>
      <div style={{ alignItems: 'center', background: MOMENTS_TOKENS.backgroundTertiary, borderRadius: 12, display: 'flex', flex: '1 1 380px', justifyContent: 'center', padding: 24 }}>
        <CardPreview
          templateKey={draft.templateKey}
          cardKind={draft.cardKind}
          eventDate={occurrence.date}
          recipient={draft.recipient ?? ''}
          message={draft.message ?? ''}
          signerNames={signatures.map((signature) => signature.name)}
          invitationLines={invitationLines}
          backgroundImageUrl={draft.backgroundImage?.[0]?.url}
        />
      </div>

      <div style={{ display: 'flex', flex: '1 1 320px', flexDirection: 'column', gap: 16, maxWidth: 420 }}>
        {error === null ? null : <span style={{ color: MOMENTS_TOKENS.danger, fontSize: 12 }}>{error}</span>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={sectionTitleStyle}>Mẫu thiệp</span>
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
            {CARD_TEMPLATES.map((template) => {
              const isSelected = template.key === draft.templateKey;

              return (
                <button
                  key={template.key}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setDraft({ ...draft, templateKey: template.key })}
                  style={{
                    background: MOMENTS_TOKENS.background,
                    border: `2px solid ${isSelected ? MOMENTS_TOKENS.accent : 'transparent'}`,
                    borderRadius: 8,
                    boxShadow: isSelected ? 'none' : `0 0 0 1px ${MOMENTS_TOKENS.border}`,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    padding: 4,
                  }}
                >
                  <span style={{ alignItems: 'center', background: template.ground, borderRadius: 4, color: template.ink, display: 'flex', fontFamily: MOMENTS_TOKENS.displayFontFamily, fontSize: 15, height: 48, justifyContent: 'center' }}>
                    {template.short}
                  </span>
                  <span style={{ color: MOMENTS_TOKENS.textSecondary, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{template.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={sectionTitleStyle}>Ảnh nền</span>
          <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
            <label style={{ alignItems: 'center', border: `1px solid ${MOMENTS_TOKENS.border}`, borderRadius: MOMENTS_TOKENS.radiusSmall, color: MOMENTS_TOKENS.textPrimary, cursor: 'pointer', display: 'inline-flex', fontSize: 13, gap: 6, height: 32, padding: '0 12px' }}>
              <IconPhoto size={16} />
              {isUploadingBackground ? 'Đang tải ảnh…' : 'Chọn ảnh nền'}
              <input type="file" accept="image/png,image/jpeg,image/webp" disabled={isUploadingBackground} onChange={(event) => {
                void uploadBackground(readTransferredFiles(event.target));
                event.target.value = '';
              }} style={{ display: 'none' }} />
            </label>
            {draft.backgroundImage?.[0] ? <MomentsButton variant="ghost" size="small" onClick={() => setDraft({ ...draft, backgroundImage: null })}>Bỏ ảnh</MomentsButton> : null}
          </div>
          <span style={{ color: MOMENTS_TOKENS.textSecondary, fontSize: 12 }}>PNG, JPG hoặc WebP, tối đa 3 MB. Ảnh sẽ được cắt vừa khung thiệp.</span>
        </div>

        <div role="radiogroup" aria-label="Loại thiệp" style={{ background: MOMENTS_TOKENS.backgroundTertiary, borderRadius: 6, display: 'flex', padding: 2 }}>
          {(['GREETING', 'INVITATION'] as const).map((cardKind) => {
            const isSelected = cardKind === draft.cardKind;

            return (
              <button
                key={cardKind}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setDraft({ ...draft, cardKind })}
                style={{
                  background: isSelected ? MOMENTS_TOKENS.background : 'transparent',
                  border: 'none',
                  borderRadius: 4,
                  boxShadow: isSelected ? '0 1px 2px rgba(0,0,0,.12)' : 'none',
                  color: isSelected ? MOMENTS_TOKENS.textPrimary : MOMENTS_TOKENS.textSecondary,
                  cursor: 'pointer',
                  flex: 1,
                  fontSize: 13,
                  fontWeight: isSelected ? 500 : 400,
                  height: 28,
                }}
              >
                {cardKind === 'GREETING' ? 'Thiệp chúc' : 'Thiệp mời'}
              </button>
            );
          })}
        </div>

        <MomentsField label="Người nhận">
          <MomentsTextField ariaLabel="Người nhận" value={draft.recipient ?? ''} onChange={(recipient) => setDraft({ ...draft, recipient })} />
        </MomentsField>
        <MomentsField label="Lời chúc">
          <MomentsTextField ariaLabel="Lời chúc trên thiệp" isMultiline rows={3} value={draft.message ?? ''} onChange={(message) => setDraft({ ...draft, message })} />
        </MomentsField>
        <div>
          <MomentsButton variant="secondary" isDisabled={isSaving || isUploadingBackground} onClick={() => void saveCard({})}>Lưu thiệp</MomentsButton>
        </div>

        <div style={{ background: MOMENTS_TOKENS.borderLight, height: 1 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ alignItems: 'center', display: 'flex' }}>
            <span style={sectionTitleStyle}>Chữ ký đồng đội</span>
            <span style={{ color: MOMENTS_TOKENS.textSecondary, fontSize: 12, marginLeft: 'auto' }}>{signatures.length} người đã ký</span>
          </div>
          {signatures.length === 0 ? null : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {signatures.map((signature) => (
                <span key={signature.memberId} title={signature.note} style={{ background: MOMENTS_TOKENS.backgroundTertiary, borderRadius: 10, color: MOMENTS_TOKENS.textPrimary, fontSize: 12, padding: '2px 8px' }}>
                  {signature.name}
                </span>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ flex: 1 }}>
              <MomentsTextField key={noteKey} ariaLabel="Lời nhắn kèm chữ ký" value={note} onChange={setNote} placeholder="Lời nhắn kèm chữ ký (không bắt buộc)" />
            </div>
            <MomentsButton variant="primary" isDisabled={isSaving || isUploadingBackground || currentMember === null} onClick={() => void sign()}>
              {hasSigned ? 'Ký lại' : 'Ký thiệp'}
            </MomentsButton>
          </div>
        </div>

        <div style={{ background: MOMENTS_TOKENS.borderLight, height: 1 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={sectionTitleStyle}>Chia sẻ</span>
          <span style={{ color: MOMENTS_TOKENS.textSecondary, fontSize: 12, lineHeight: 1.5 }}>
            Ai có link đều xem được thiệp, đồng hồ đếm ngược và lời chúc, kể cả người ngoài CRM.
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <MomentsButton variant="secondary" isDisabled={isSaving || isUploadingBackground} onClick={() => void copyShareLink()}>Copy link chia sẻ</MomentsButton>
            <MomentsButton variant="secondary" isDisabled={isSaving || isUploadingBackground} onClick={() => void copyMattermostShare()}>Copy cho Mattermost</MomentsButton>
            {shareToken === null ? null : (
              <>
                <a
                  href={resolveAppRouteUrl(SHARE_PAGE_ROUTE_PATH, { t: shareToken })}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ alignItems: 'center', border: `1px solid ${MOMENTS_TOKENS.border}`, borderRadius: MOMENTS_TOKENS.radiusSmall, color: MOMENTS_TOKENS.textPrimary, display: 'inline-flex', fontSize: 13, height: 32, padding: '0 12px', textDecoration: 'none' }}
                >
                  Mở trang chia sẻ
                </a>
                <a
                  href={resolveAppRouteUrl(CARD_IMAGE_ROUTE_PATH, { t: shareToken, download: 1 })}
                  target="_blank"
                  rel="noopener noreferrer"
                  download="thiep.svg"
                  style={{ alignItems: 'center', border: `1px solid ${MOMENTS_TOKENS.border}`, borderRadius: MOMENTS_TOKENS.radiusSmall, color: MOMENTS_TOKENS.textPrimary, display: 'inline-flex', fontSize: 13, height: 32, padding: '0 12px', textDecoration: 'none' }}
                >
                  Tải thiệp (SVG)
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
