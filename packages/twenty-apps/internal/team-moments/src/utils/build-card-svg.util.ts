import { type CardTemplate } from '../constants/card-templates';
import { escapeMarkup } from './escape-markup.util';
import { wrapText } from './wrap-text.util';

export const CARD_WIDTH = 600;
export const CARD_HEIGHT = 800;

type BuildCardSvgInput = {
  template: CardTemplate;
  eyebrow: string;
  recipient: string;
  message: string;
  signerLine: string;
  invitationLines: string[];
  backgroundImageDataUrl?: string | null;
};

const FLOWER_PETAL_ANGLES = [0, 72, 144, 216, 288];

const flower = (cx: number, cy: number, scale: number, color: string): string =>
  `<g transform="translate(${cx} ${cy}) scale(${scale})" fill="none" stroke="${color}" stroke-width="1.6">${FLOWER_PETAL_ANGLES.map(
    (angle) => `<ellipse cx="0" cy="-40" rx="22" ry="40" transform="rotate(${angle})"/>`,
  ).join('')}<circle r="9" fill="${color}" stroke="none"/></g>`;

const decorationMarkup = (template: CardTemplate): string => {
  const color = template.ornament;

  if (template.decoration === 'floral') {
    return flower(520, 90, 1.5, color) + flower(70, 720, 1.1, color);
  }

  if (template.decoration === 'confetti') {
    return `<g fill="${color}"><circle cx="60" cy="70" r="7"/><circle cx="540" cy="100" r="6"/><circle cx="90" cy="690" r="6"/><circle cx="530" cy="720" r="9"/><rect x="470" y="220" width="12" height="12" transform="rotate(30 476 226)"/><rect x="80" y="260" width="10" height="10" transform="rotate(20 85 265)"/></g><g fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"><path d="M110 150 q18 -18 36 0 t36 0"/><path d="M420 620 q18 -18 36 0 t36 0"/></g>`;
  }

  return `<rect x="28" y="28" width="544" height="744" rx="6" fill="none" stroke="${color}" stroke-width="1.5"/><rect x="38" y="38" width="524" height="724" rx="3" fill="none" stroke="${color}" stroke-opacity="0.5"/>`;
};

// A standalone SVG, so the downloaded card opens in any browser or image
// viewer and the share page can inline the same markup.
export const buildCardSvg = ({
  template,
  eyebrow,
  recipient,
  message,
  signerLine,
  invitationLines,
  backgroundImageDataUrl,
}: BuildCardSvgInput): string => {
  const headlineLines = template.headline.split('\n');
  const messageLines = wrapText(message, 40, invitationLines.length > 0 ? 3 : 5);
  const centerX = CARD_WIDTH / 2;
  let cursorY = 230;

  const text = (content: string, y: number, attributes: string) =>
    `<text x="${centerX}" y="${y}" text-anchor="middle" ${attributes}>${escapeMarkup(content)}</text>`;

  const parts: string[] = [];

  parts.push(text(eyebrow, cursorY, 'font-family="Inter, Arial, sans-serif" font-size="15" font-weight="600" letter-spacing="4"'));
  cursorY += 72;

  for (const line of headlineLines) {
    parts.push(text(line, cursorY, 'font-family="\'Playfair Display\', Georgia, serif" font-size="58" font-weight="600"'));
    cursorY += 66;
  }

  cursorY += 8;
  parts.push(text(recipient, cursorY, 'font-family="\'Playfair Display\', Georgia, serif" font-size="30" font-style="italic"'));
  cursorY += 34;
  parts.push(`<line x1="${centerX - 28}" x2="${centerX + 28}" y1="${cursorY}" y2="${cursorY}" stroke="${template.ornament}" stroke-width="1.5"/>`);
  cursorY += 42;

  for (const line of messageLines) {
    parts.push(text(line, cursorY, 'font-family="Inter, Arial, sans-serif" font-size="19"'));
    cursorY += 30;
  }

  if (invitationLines.length > 0) {
    cursorY += 14;

    for (const [index, line] of invitationLines.entries()) {
      parts.push(text(line, cursorY, `font-family="Inter, Arial, sans-serif" font-size="18" ${index === 0 ? 'font-weight="700"' : ''}`));
      cursorY += 28;
    }
  }

  parts.push(text(signerLine, CARD_HEIGHT - 48, 'font-family="Inter, Arial, sans-serif" font-size="13" letter-spacing="1.5" opacity="0.85"'));

  const background = backgroundImageDataUrl?.match(/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/)
    ? `<image href="${backgroundImageDataUrl}" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" preserveAspectRatio="xMidYMid slice"/><rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="#000000" fill-opacity="0.65"/>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}"><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&amp;family=Playfair+Display:ital,wght@0,600;1,500&amp;display=swap');</style><rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" rx="16" fill="${template.ground}"/>${background}${decorationMarkup(template)}<g fill="${background ? '#ffffff' : template.ink}">${parts.join('')}</g></svg>`;
};
