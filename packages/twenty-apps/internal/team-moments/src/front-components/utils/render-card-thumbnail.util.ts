import { type CardTemplate } from '../../constants/card-templates';
import { CARD_HEIGHT, CARD_WIDTH } from '../../utils/build-card-svg.util';
import { wrapText } from '../../utils/wrap-text.util';

export const CARD_THUMBNAIL_WIDTH = 1200;
export const CARD_THUMBNAIL_HEIGHT = 630;

export type RenderCardThumbnailInput = {
  template: CardTemplate;
  isInvitation: boolean;
  eventTitle: string;
  cardEyebrow: string;
  dateLabel: string;
  recipient: string;
  message: string;
  signerNames: string[];
  signerLine: string;
  invitationLines: string[];
  startTime: string | null;
  location: string | null;
  backgroundImageUrl?: string | null;
};

type Canvas2D = OffscreenCanvasRenderingContext2D;

const BRAND_LINE = 'SAE · TEAM MOMENTS';
const CARD_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:ital,wght@0,500;0,600;1,500&display=swap';
const SERIF_FONT = '"Playfair Display", Georgia, "Times New Roman", serif';
const SANS_FONT = 'Inter, Arial, Helvetica, sans-serif';

const CARD_SCALE = 0.65;
const CARD_LEFT = 92;
const CARD_TOP = 56;
const COLUMN_LEFT = 576;
const COLUMN_WIDTH = 540;
const AVATARS_SHOWN = 4;
const AVATAR_SIZE = 52;
const AVATAR_OVERLAP = 12;
const PETAL_ANGLES = [0, 72, 144, 216, 288];

const parseHex = (hex: string): [number, number, number] => {
  const value = Number.parseInt(hex.replace('#', ''), 16);

  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const mixColor = (from: string, to: string, amount: number): string => {
  const start = parseHex(from);
  const end = parseHex(to);

  return `#${start
    .map((channel, index) => Math.round(channel + (end[index] - channel) * amount).toString(16).padStart(2, '0'))
    .join('')}`;
};

const luminance = (hex: string): number => {
  const [red, green, blue] = parseHex(hex);

  return (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
};

let cardFontsLoading: Promise<void> | null = null;

// Workers do not see the page's web fonts, so the card fonts are registered
// on the worker itself. Any failure leaves the system fallbacks in the stacks.
const loadCardFonts = (): Promise<void> => {
  cardFontsLoading ??= (async () => {
    const fontSet = (globalThis as { fonts?: FontFaceSet }).fonts;

    if (fontSet === undefined || typeof FontFace === 'undefined') {
      return;
    }

    const css = await (await fetch(CARD_FONTS_URL)).text();
    const faces = [...css.matchAll(/@font-face\s*{([^}]*)}/g)].flatMap(([, block]) => {
      const family = block.match(/font-family:\s*'([^']+)'/)?.[1];
      const source = block.match(/src:\s*(url\([^)]+\)[^;]*)/)?.[1];

      if (family === undefined || source === undefined) {
        return [];
      }

      return [
        new FontFace(family, source, {
          style: block.match(/font-style:\s*(\w+)/)?.[1] ?? 'normal',
          weight: block.match(/font-weight:\s*(\d+)/)?.[1] ?? '400',
          unicodeRange: block.match(/unicode-range:\s*([^;]+)/)?.[1] ?? 'U+0-10FFFF',
        }),
      ];
    });

    await Promise.allSettled(
      faces.map(async (face) => {
        fontSet.add(await face.load());
      }),
    );
  })().catch(() => undefined);

  return cardFontsLoading;
};

const loadBackgroundImage = async (url: string | null | undefined): Promise<ImageBitmap | null> => {
  if (!url || typeof createImageBitmap !== 'function') {
    return null;
  }

  try {
    return await createImageBitmap(await (await fetch(url)).blob());
  } catch {
    return null;
  }
};

const drawCover = (context: Canvas2D, image: ImageBitmap, width: number, height: number) => {
  const scale = Math.max(width / image.width, height / image.height);

  context.drawImage(image, (width - image.width * scale) / 2, (height - image.height * scale) / 2, image.width * scale, image.height * scale);
};

const drawFlower = (context: Canvas2D, centerX: number, centerY: number, scale: number, color: string, withCenter: boolean) => {
  context.save();
  context.translate(centerX, centerY);
  context.scale(scale, scale);
  context.strokeStyle = color;
  context.lineWidth = 1.6 / scale;

  for (const angle of PETAL_ANGLES) {
    context.save();
    context.rotate((angle * Math.PI) / 180);
    context.beginPath();
    context.ellipse(0, -40, 22, 40, 0, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  }

  if (withCenter) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(0, 0, 9, 0, Math.PI * 2);
    context.fill();
  }

  context.restore();
};

const drawConfetti = (context: Canvas2D, color: string, dots: number[][], squares: number[][], waves: number[][], waveWidth: number) => {
  context.fillStyle = color;

  for (const [x, y, radius] of dots) {
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  for (const [x, y, size, angle] of squares) {
    context.save();
    context.translate(x + size / 2, y + size / 2);
    context.rotate((angle * Math.PI) / 180);
    context.fillRect(-size / 2, -size / 2, size, size);
    context.restore();
  }

  context.strokeStyle = color;
  context.lineWidth = waveWidth;
  context.lineCap = 'round';

  for (const [x, y, step] of waves) {
    context.beginPath();
    context.moveTo(x, y);
    context.quadraticCurveTo(x + step / 2, y - step / 2, x + step, y);
    context.quadraticCurveTo(x + step * 1.5, y + step / 2, x + step * 2, y);
    context.stroke();
  }
};

const drawCanvasDecoration = (context: Canvas2D, template: CardTemplate, ground: string) => {
  context.save();

  if (template.decoration === 'floral') {
    context.globalAlpha = 0.35;
    drawFlower(context, 1110, 70, 2.2, template.ornament, false);
    context.globalAlpha = 0.25;
    drawFlower(context, 560, 610, 1.1, template.ornament, false);
  } else if (template.decoration === 'confetti') {
    context.globalAlpha = 0.55;
    drawConfetti(
      context,
      template.ornament,
      [[1130, 70, 10], [1040, 560, 8], [560, 40, 6], [600, 590, 9]],
      [[1150, 300, 14, 30], [40, 590, 12, 20]],
      [[980, 110, 20], [700, 580, 20]],
      5,
    );
  } else {
    context.strokeStyle = mixColor(template.ornament, ground, 0.65);
    context.lineWidth = 1;
    context.beginPath();
    context.roundRect(24, 24, CARD_THUMBNAIL_WIDTH - 48, CARD_THUMBNAIL_HEIGHT - 48, 6);
    context.stroke();
  }

  context.restore();
};

const drawCardDecoration = (context: Canvas2D, template: CardTemplate) => {
  if (template.decoration === 'floral') {
    drawFlower(context, 520, 90, 1.5, template.ornament, true);
    drawFlower(context, 70, 720, 1.1, template.ornament, true);

    return;
  }

  if (template.decoration === 'confetti') {
    drawConfetti(
      context,
      template.ornament,
      [[60, 70, 7], [540, 100, 6], [90, 690, 6], [530, 720, 9]],
      [[470, 220, 12, 30], [80, 260, 10, 20]],
      [[110, 150, 18], [420, 620, 18]],
      4,
    );

    return;
  }

  context.strokeStyle = template.ornament;
  context.lineWidth = 1.5;
  context.beginPath();
  context.roundRect(28, 28, CARD_WIDTH - 56, CARD_HEIGHT - 56, 6);
  context.stroke();
  context.globalAlpha = 0.5;
  context.lineWidth = 1;
  context.beginPath();
  context.roundRect(38, 38, CARD_WIDTH - 76, CARD_HEIGHT - 76, 3);
  context.stroke();
  context.globalAlpha = 1;
};

const setFont = (context: Canvas2D, font: string, letterSpacing = 0) => {
  context.font = font;
  context.letterSpacing = `${letterSpacing}px`;
};

// Shrinks the font until the text fits; returns the size it settled on.
const fitFont = (context: Canvas2D, text: string, font: (size: number) => string, maxWidth: number, startSize: number, minSize: number): number => {
  let size = startSize;

  context.font = font(size);

  while (size > minSize && context.measureText(text).width > maxWidth) {
    size -= 2;
    context.font = font(size);
  }

  return size;
};

// The card as drawn by build-card-svg, in its own 600×800 coordinates.
const drawMiniCard = (context: Canvas2D, input: RenderCardThumbnailInput, backgroundImage: ImageBitmap | null) => {
  const { template } = input;
  const centerX = CARD_WIDTH / 2;

  context.save();
  context.translate(CARD_LEFT + (CARD_WIDTH * CARD_SCALE) / 2, CARD_TOP + (CARD_HEIGHT * CARD_SCALE) / 2);
  context.rotate((-3 * Math.PI) / 180);
  context.scale(CARD_SCALE, CARD_SCALE);
  context.translate(-CARD_WIDTH / 2, -CARD_HEIGHT / 2);

  context.save();
  context.shadowColor = 'rgba(0, 0, 0, 0.4)';
  context.shadowBlur = 90;
  context.shadowOffsetY = 46;
  context.fillStyle = template.ground;
  context.beginPath();
  context.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 18);
  context.fill();
  context.restore();

  context.save();
  context.beginPath();
  context.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 18);
  context.clip();

  if (backgroundImage !== null) {
    drawCover(context, backgroundImage, CARD_WIDTH, CARD_HEIGHT);
    context.fillStyle = 'rgba(0, 0, 0, 0.65)';
    context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  }

  drawCardDecoration(context, template);

  context.fillStyle = backgroundImage !== null ? '#ffffff' : template.ink;
  context.textAlign = 'center';
  context.textBaseline = 'alphabetic';

  let cursorY = 230;

  setFont(context, `600 15px ${SANS_FONT}`, 4);
  context.fillText(input.cardEyebrow, centerX, cursorY, CARD_WIDTH - 80);
  cursorY += 72;

  setFont(context, `600 58px ${SERIF_FONT}`);

  for (const line of template.headline.split('\n')) {
    context.fillText(line, centerX, cursorY, CARD_WIDTH - 80);
    cursorY += 66;
  }

  cursorY += 8;
  setFont(context, `italic 500 30px ${SERIF_FONT}`);
  context.fillText(input.recipient, centerX, cursorY, CARD_WIDTH - 80);
  cursorY += 34;

  context.strokeStyle = template.ornament;
  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(centerX - 28, cursorY);
  context.lineTo(centerX + 28, cursorY);
  context.stroke();
  cursorY += 42;

  setFont(context, `400 19px ${SANS_FONT}`);

  for (const line of wrapText(input.message, 40, input.invitationLines.length > 0 ? 3 : 5)) {
    context.fillText(line, centerX, cursorY, CARD_WIDTH - 80);
    cursorY += 30;
  }

  if (input.invitationLines.length > 0) {
    cursorY += 14;

    for (const [index, line] of input.invitationLines.entries()) {
      setFont(context, `${index === 0 ? 700 : 400} 18px ${SANS_FONT}`);
      context.fillText(line, centerX, cursorY, CARD_WIDTH - 80);
      cursorY += 28;
    }
  }

  context.globalAlpha = 0.85;
  setFont(context, `400 13px ${SANS_FONT}`, 1.5);
  context.fillText(input.signerLine, centerX, CARD_HEIGHT - 48, CARD_WIDTH - 80);
  context.restore();
  context.restore();
};

const drawCalendarIcon = (context: Canvas2D, x: number, y: number, color: string) => {
  context.save();
  context.translate(x, y);
  context.scale(28 / 24, 28 / 24);
  context.strokeStyle = color;
  context.lineWidth = 1.8;
  context.lineCap = 'round';
  context.beginPath();
  context.roundRect(4, 5, 16, 16, 2);
  context.moveTo(16, 3);
  context.lineTo(16, 7);
  context.moveTo(8, 3);
  context.lineTo(8, 7);
  context.moveTo(4, 11);
  context.lineTo(20, 11);
  context.stroke();
  context.restore();
};

const drawPinIcon = (context: Canvas2D, x: number, y: number, color: string) => {
  context.save();
  context.translate(x, y);
  context.scale(28 / 24, 28 / 24);
  context.strokeStyle = color;
  context.lineWidth = 1.8;
  context.beginPath();
  context.moveTo(12, 21);
  context.bezierCurveTo(12, 21, 5, 14.8, 5, 9.5);
  context.arc(12, 9.5, 7, Math.PI, 0);
  context.bezierCurveTo(19, 14.8, 12, 21, 12, 21);
  context.stroke();
  context.beginPath();
  context.arc(12, 9.5, 2.5, 0, Math.PI * 2);
  context.stroke();
  context.restore();
};

type ColumnBlock = { height: number; draw: (top: number) => void };

// The link-preview image (Open Graph wants PNG or JPEG at about 1.91:1; chat
// apps ignore SVG). Drawn with canvas primitives because the sandbox cannot
// rasterise the SVG card.
export const renderCardThumbnail = async (input: RenderCardThumbnailInput): Promise<Blob | null> => {
  if (typeof OffscreenCanvas === 'undefined') {
    return null;
  }

  const canvas = new OffscreenCanvas(CARD_THUMBNAIL_WIDTH, CARD_THUMBNAIL_HEIGHT);
  const context = canvas.getContext('2d');

  if (context === null) {
    return null;
  }

  const [, backgroundImage] = await Promise.all([loadCardFonts(), loadBackgroundImage(input.backgroundImageUrl)]);

  const { template } = input;
  const isLight = luminance(template.ground) > 0.6;
  const ground = isLight ? mixColor(template.ground, template.ornament, 0.15) : mixColor(template.ground, '#000000', 0.3);
  const ink = template.ink;
  const mutedInk = mixColor(ink, ground, 0.22);
  const accent = isLight ? mixColor(template.ornament, '#000000', 0.35) : template.ornament;
  const [darker, lighter] = luminance(template.ground) < luminance(ink) ? [template.ground, ink] : [ink, template.ground];

  context.fillStyle = ground;
  context.fillRect(0, 0, CARD_THUMBNAIL_WIDTH, CARD_THUMBNAIL_HEIGHT);
  drawCanvasDecoration(context, template, ground);
  drawMiniCard(context, input, backgroundImage);
  backgroundImage?.close();

  context.textAlign = 'left';
  context.textBaseline = 'alphabetic';

  const blocks: ColumnBlock[] = [];
  const eyebrow = input.isInvitation ? 'THIỆP MỜI' : template.eyebrow;

  blocks.push({
    height: 22,
    draw: (top) => {
      context.fillStyle = accent;
      context.fillRect(COLUMN_LEFT, top + 9, 28, 2);
      setFont(context, `600 18px ${SANS_FONT}`, 4);
      context.fillText(eyebrow, COLUMN_LEFT + 40, top + 18, COLUMN_WIDTH - 40);
    },
  });

  const recipient = input.recipient.trim();
  const isAddressed = !input.isInvitation && recipient.length > 0;
  const title = isAddressed ? `Gửi ${recipient}` : input.eventTitle;
  const titleFont = (size: number) => `${isAddressed ? 'italic ' : ''}500 ${size}px ${SERIF_FONT}`;
  const titleSize = fitFont(context, title, titleFont, COLUMN_WIDTH, isAddressed ? 76 : 70, 40);

  blocks.push({
    height: 26 + titleSize * 1.1,
    draw: (top) => {
      context.fillStyle = ink;
      setFont(context, titleFont(titleSize));
      context.fillText(title, COLUMN_LEFT, top + 26 + titleSize * 0.9, COLUMN_WIDTH);
    },
  });

  if (input.isInvitation) {
    const rows = [
      { icon: drawCalendarIcon, text: [input.startTime, input.dateLabel.replace(/ · /g, '/')].filter(Boolean).join(' · ') },
      { icon: drawPinIcon, text: input.location ?? '' },
    ].filter((row) => row.text.length > 0);

    blocks.push({
      height: 34 + rows.length * 50 - 16,
      draw: (top) => {
        setFont(context, `400 26px ${SANS_FONT}`);
        rows.forEach((row, index) => {
          const rowTop = top + 34 + index * 50;

          row.icon(context, COLUMN_LEFT, rowTop, template.ornament);
          context.fillStyle = ink;
          context.fillText(row.text, COLUMN_LEFT + 44, rowTop + 24, COLUMN_WIDTH - 44);
        });
      },
    });
  } else {
    const signerCount = input.signerNames.length;

    blocks.push({
      height: 18 + 36,
      draw: (top) => {
        context.fillStyle = mutedInk;
        setFont(context, `400 26px ${SANS_FONT}`);
        context.fillText(
          signerCount > 0 ? `${signerCount} đồng đội đã ký tấm thiệp này` : 'Cùng ký tấm thiệp này nhé',
          COLUMN_LEFT,
          top + 18 + 27,
          COLUMN_WIDTH,
        );
      },
    });

    if (signerCount > 0) {
      const avatarFills = [template.ornament, lighter, mixColor(template.ornament, '#ffffff', 0.45), darker];
      const shown = input.signerNames.slice(0, AVATARS_SHOWN);
      const rest = signerCount - shown.length;

      blocks.push({
        height: 26 + AVATAR_SIZE,
        draw: (top) => {
          const avatars = [...shown.map((name) => name.trim().charAt(0).toUpperCase()), ...(rest > 0 ? [`+${rest}`] : [])];

          context.textAlign = 'center';
          avatars.forEach((label, index) => {
            const fill = avatarFills[index % avatarFills.length];
            const centerX = COLUMN_LEFT + AVATAR_SIZE / 2 + index * (AVATAR_SIZE - AVATAR_OVERLAP);
            const centerY = top + 26 + AVATAR_SIZE / 2;

            context.fillStyle = ground;
            context.beginPath();
            context.arc(centerX, centerY, AVATAR_SIZE / 2 + 3, 0, Math.PI * 2);
            context.fill();
            context.fillStyle = fill;
            context.beginPath();
            context.arc(centerX, centerY, AVATAR_SIZE / 2, 0, Math.PI * 2);
            context.fill();
            context.fillStyle = luminance(fill) > 0.55 ? darker : lighter;
            setFont(context, `700 ${label.startsWith('+') ? 17 : 20}px ${SANS_FONT}`);
            context.fillText(label, centerX, centerY + 7);
          });
          context.textAlign = 'left';
        },
      });
    }
  }

  blocks.push({
    height: 56 + 20,
    draw: (top) => {
      const baseline = top + 56 + 17;
      const dateText = input.dateLabel.replace(/ · /g, '/');

      context.fillStyle = mutedInk;
      setFont(context, `600 18px ${SANS_FONT}`, 3);
      context.fillText(BRAND_LINE, COLUMN_LEFT, baseline);

      if (dateText.length > 0) {
        const brandWidth = context.measureText(BRAND_LINE).width;

        context.globalAlpha = 0.5;
        context.fillText('|', COLUMN_LEFT + brandWidth + 14, baseline);
        context.globalAlpha = 1;
        setFont(context, `600 18px ${SANS_FONT}`, 1);
        context.fillText(dateText, COLUMN_LEFT + brandWidth + 40, baseline);
      }
    },
  });

  let top = (CARD_THUMBNAIL_HEIGHT - blocks.reduce((total, block) => total + block.height, 0)) / 2;

  for (const block of blocks) {
    block.draw(top);
    top += block.height;
  }

  return canvas.convertToBlob({ type: 'image/png' });
};
