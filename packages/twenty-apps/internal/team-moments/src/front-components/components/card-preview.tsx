import { findCardTemplate } from '../../constants/card-templates';
import { formatSignerLine, formatVietnameseDate } from '../../utils/describe-card.util';
import { MOMENTS_TOKENS } from './moments-tokens';

type CardPreviewProps = {
  templateKey: string;
  cardKind: 'GREETING' | 'INVITATION';
  eventDate: string | null;
  recipient: string;
  message: string;
  signerNames: string[];
  invitationLines: string[];
  backgroundImageUrl?: string | null;
  width?: number;
};

const PETAL_ANGLES = [0, 72, 144, 216, 288];

// The in-app preview of the card. It mirrors the SVG the share routes render
// (build-card-svg.util) in HTML, because the sandbox cannot inject markup.
export const CardPreview = ({
  templateKey,
  cardKind,
  eventDate,
  recipient,
  message,
  signerNames,
  invitationLines,
  backgroundImageUrl,
  width = 360,
}: CardPreviewProps) => {
  const template = findCardTemplate(templateKey);
  const scale = width / 600;
  const dateLabel = formatVietnameseDate(eventDate);
  const eyebrow = cardKind === 'INVITATION' ? `THIỆP MỜI · ${dateLabel}` : dateLabel || template.eyebrow;

  return (
    <div
      style={{
        alignItems: 'center',
        background: template.ground,
        borderRadius: 10,
        boxShadow: '0 20px 40px rgba(0,0,0,.18), 0 2px 6px rgba(0,0,0,.08)',
        color: backgroundImageUrl ? '#ffffff' : template.ink,
        display: 'flex',
        flex: 'none',
        height: width * (4 / 3),
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        width,
      }}
    >
      {backgroundImageUrl ? (
        <>
          <img src={backgroundImageUrl} alt="" style={{ height: '100%', objectFit: 'cover', position: 'absolute', width: '100%' }} />
          <div style={{ background: 'rgba(0,0,0,.65)', inset: 0, position: 'absolute' }} />
        </>
      ) : null}
      {template.decoration === 'floral' ? (
        <>
          <svg width={260 * scale * 1.6} height={260 * scale * 1.6} viewBox="0 0 200 200" aria-hidden="true" style={{ position: 'absolute', right: -50 * scale, top: -40 * scale }}>
            <g fill="none" stroke={template.ornament} strokeWidth="1.2">
              {PETAL_ANGLES.map((angle) => (
                <ellipse key={angle} cx="100" cy="60" rx="22" ry="40" transform={`rotate(${angle} 100 100)`} />
              ))}
            </g>
          </svg>
          <svg width={200 * scale * 1.6} height={200 * scale * 1.6} viewBox="0 0 200 200" aria-hidden="true" style={{ bottom: -60 * scale, left: -70 * scale, position: 'absolute' }}>
            <g fill="none" stroke={template.ornament} strokeWidth="1.2">
              {PETAL_ANGLES.map((angle) => (
                <ellipse key={angle} cx="100" cy="60" rx="22" ry="40" transform={`rotate(${angle} 100 100)`} />
              ))}
            </g>
          </svg>
        </>
      ) : null}
      {template.decoration === 'confetti' ? (
        <svg width="100%" height="100%" viewBox="0 0 600 800" preserveAspectRatio="none" aria-hidden="true" style={{ inset: 0, position: 'absolute' }}>
          <g fill={template.ornament}>
            <circle cx="60" cy="70" r="7" />
            <circle cx="540" cy="100" r="6" />
            <circle cx="90" cy="690" r="6" />
            <circle cx="530" cy="720" r="9" />
            <rect x="470" y="220" width="12" height="12" transform="rotate(30 476 226)" />
            <rect x="80" y="260" width="10" height="10" transform="rotate(20 85 265)" />
          </g>
          <g fill="none" stroke={template.ornament} strokeWidth="4" strokeLinecap="round">
            <path d="M110 150 q18 -18 36 0 t36 0" />
            <path d="M420 620 q18 -18 36 0 t36 0" />
          </g>
        </svg>
      ) : null}
      {template.decoration === 'frame' ? (
        <>
          <div style={{ border: `1px solid ${template.ornament}`, borderRadius: 4, inset: 18 * scale * 1.5, position: 'absolute' }} />
          <div style={{ border: `1px solid ${template.ornament}`, borderRadius: 2, inset: 26 * scale * 1.5, opacity: 0.5, position: 'absolute' }} />
        </>
      ) : null}
      <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 12 * scale * 1.4, padding: `0 ${44 * scale * 1.4}px`, position: 'relative', textAlign: 'center' }}>
        <div style={{ fontFamily: MOMENTS_TOKENS.fontFamily, fontSize: Math.max(9, 15 * scale), fontWeight: 600, letterSpacing: '0.24em' }}>{eyebrow}</div>
        <div style={{ fontFamily: MOMENTS_TOKENS.displayFontFamily, fontSize: 58 * scale, fontWeight: 600, lineHeight: 1.08, whiteSpace: 'pre-line' }}>{template.headline}</div>
        <div style={{ fontFamily: MOMENTS_TOKENS.displayFontFamily, fontSize: 30 * scale, fontStyle: 'italic' }}>{recipient}</div>
        <div style={{ background: template.ornament, height: 1, width: 40 }} />
        <div style={{ fontFamily: MOMENTS_TOKENS.fontFamily, fontSize: Math.max(11, 19 * scale), lineHeight: 1.6, maxWidth: 440 * scale, whiteSpace: 'pre-line' }}>{message}</div>
        {invitationLines.length === 0 ? null : (
          <div style={{ display: 'flex', flexDirection: 'column', fontFamily: MOMENTS_TOKENS.fontFamily, fontSize: Math.max(11, 18 * scale), gap: 4 }}>
            {invitationLines.map((line, index) => (
              <div key={line} style={{ fontWeight: index === 0 ? 700 : 400 }}>{line}</div>
            ))}
          </div>
        )}
      </div>
      <div style={{ bottom: 40 * scale, fontFamily: MOMENTS_TOKENS.fontFamily, fontSize: Math.max(9, 13 * scale), left: 0, letterSpacing: '0.08em', opacity: 0.85, position: 'absolute', right: 0, textAlign: 'center' }}>
        {formatSignerLine(signerNames)}
      </div>
    </div>
  );
};
