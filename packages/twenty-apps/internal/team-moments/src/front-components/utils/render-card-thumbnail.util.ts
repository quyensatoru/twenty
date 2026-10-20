import { type CardTemplate } from '../../constants/card-templates';

export const CARD_THUMBNAIL_WIDTH = 1200;
export const CARD_THUMBNAIL_HEIGHT = 630;

type RenderCardThumbnailInput = {
  template: CardTemplate;
  eyebrow: string;
  recipient: string;
  footer: string;
  backgroundImageUrl?: string | null;
};

type Canvas2D = OffscreenCanvasRenderingContext2D;

const PETAL_ANGLES = [0, 72, 144, 216, 288];
const SERIF_FONT = 'Georgia, "Times New Roman", serif';
const SANS_FONT = 'Arial, Helvetica, sans-serif';

const drawFlower = (context: Canvas2D, centerX: number, centerY: number, scale: number, color: string) => {
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

  context.fillStyle = color;
  context.beginPath();
  context.arc(0, 0, 9, 0, Math.PI * 2);
  context.fill();
  context.restore();
};

const drawDecoration = (context: Canvas2D, template: CardTemplate) => {
  if (template.decoration === 'floral') {
    drawFlower(context, 1040, 140, 2.6, template.ornament);
    drawFlower(context, 900, 560, 1.4, template.ornament);

    return;
  }

  if (template.decoration === 'confetti') {
    context.fillStyle = template.ornament;

    for (const [x, y, radius] of [[90, 80, 9], [1110, 110, 7], [140, 560, 7], [700, 570, 10], [1030, 470, 8], [860, 90, 6]]) {
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }

    context.strokeStyle = template.ornament;
    context.lineWidth = 5;
    context.lineCap = 'round';

    for (const [x, y] of [[960, 230], [820, 420]]) {
      context.beginPath();
      context.moveTo(x, y);
      context.quadraticCurveTo(x + 20, y - 20, x + 40, y);
      context.quadraticCurveTo(x + 60, y + 20, x + 80, y);
      context.stroke();
    }

    return;
  }

  context.strokeStyle = template.ornament;
  context.lineWidth = 2;
  context.strokeRect(28, 28, CARD_THUMBNAIL_WIDTH - 56, CARD_THUMBNAIL_HEIGHT - 56);
  context.globalAlpha = 0.5;
  context.strokeRect(40, 40, CARD_THUMBNAIL_WIDTH - 80, CARD_THUMBNAIL_HEIGHT - 80);
  context.globalAlpha = 1;
};

// Shrinks the font until the text fits; returns the size it settled on.
const fitFont = (context: Canvas2D, text: string, font: (size: number) => string, maxWidth: number, startSize: number): number => {
  let size = startSize;

  context.font = font(size);

  while (size > 24 && context.measureText(text).width > maxWidth) {
    size -= 4;
    context.font = font(size);
  }

  return size;
};

// The link-preview image (Open Graph wants PNG or JPEG at about 1.91:1; chat
// apps ignore SVG). Drawn with canvas primitives because the sandbox cannot
// rasterise the SVG card, and with system fonts because web fonts are not
// loaded inside the worker.
export const renderCardThumbnail = async ({
  template,
  eyebrow,
  recipient,
  footer,
  backgroundImageUrl,
}: RenderCardThumbnailInput): Promise<Blob | null> => {
  if (typeof OffscreenCanvas === 'undefined') {
    return null;
  }

  const canvas = new OffscreenCanvas(CARD_THUMBNAIL_WIDTH, CARD_THUMBNAIL_HEIGHT);
  const context = canvas.getContext('2d');

  if (context === null) {
    return null;
  }

  const textMaxWidth = 720;
  const left = 88;

  context.fillStyle = template.ground;
  context.fillRect(0, 0, CARD_THUMBNAIL_WIDTH, CARD_THUMBNAIL_HEIGHT);

  let hasBackgroundImage = false;

  if (backgroundImageUrl && typeof createImageBitmap === 'function') {
    try {
      const response = await fetch(backgroundImageUrl);
      const image = await createImageBitmap(await response.blob());
      const scale = Math.max(CARD_THUMBNAIL_WIDTH / image.width, CARD_THUMBNAIL_HEIGHT / image.height);
      const width = image.width * scale;
      const height = image.height * scale;

      context.drawImage(image, (CARD_THUMBNAIL_WIDTH - width) / 2, (CARD_THUMBNAIL_HEIGHT - height) / 2, width, height);
      image.close();
      context.fillStyle = 'rgba(0,0,0,.65)';
      context.fillRect(0, 0, CARD_THUMBNAIL_WIDTH, CARD_THUMBNAIL_HEIGHT);
      hasBackgroundImage = true;
    } catch {
      // A missing preview image leaves the existing template visible.
    }
  }

  drawDecoration(context, template);

  context.fillStyle = hasBackgroundImage ? '#ffffff' : template.ink;
  context.textBaseline = 'alphabetic';

  context.font = `600 26px ${SANS_FONT}`;
  context.fillText(eyebrow, left, 150, textMaxWidth);

  const headlineLines = template.headline.split('\n');
  const headlineFont = (size: number) => `700 ${size}px ${SERIF_FONT}`;

  const longestHeadlineLine = headlineLines.reduce((longest, line) => (line.length > longest.length ? line : longest), '');
  const headlineLineHeight = fitFont(context, longestHeadlineLine, headlineFont, textMaxWidth, 104) * 1.02;

  headlineLines.forEach((line, index) => {
    context.fillText(line, left, 270 + index * headlineLineHeight, textMaxWidth);
  });

  fitFont(context, recipient, (size) => `italic 400 ${size}px ${SERIF_FONT}`, textMaxWidth, 46);
  context.fillText(recipient, left, 290 + headlineLines.length * headlineLineHeight, textMaxWidth);

  context.globalAlpha = 0.85;
  context.font = `600 22px ${SANS_FONT}`;
  context.fillText(footer, left, CARD_THUMBNAIL_HEIGHT - 60, textMaxWidth + 200);
  context.globalAlpha = 1;

  return canvas.convertToBlob({ type: 'image/png' });
};
