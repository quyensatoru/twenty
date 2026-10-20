import { describe, expect, it } from 'vitest';

import { buildSharePage } from '../build-share-page.util';
import { resolveShareImageUrl } from '../resolve-share-image-url.util';

const render = (imageUrl: string) => buildSharePage({
  title: 'Sinh nhật',
  description: 'Thiệp chúc mừng',
  cardSvg: '<svg/>',
  imageUrl,
  downloadUrl: 'https://crm.example.com/card.svg',
  eventDate: null,
  wishes: [],
  accent: '#123456',
});

describe('resolveShareImageUrl', () => {
  it('gives cards without a generated thumbnail a public preview image', () => {
    const imageUrl = resolveShareImageUrl(null, 'http://localhost:3000/public-assets/app/preview.png', 'https://crm.example.com');

    expect(render(imageUrl)).toContain('<meta property="og:image" content="https://crm.example.com/public-assets/app/preview.png">');
  });

  it('keeps a generated card thumbnail when available', () => {
    const imageUrl = resolveShareImageUrl('https://files.example.com/card.png', 'http://localhost:3000/public-assets/app/preview.png', 'https://crm.example.com');

    expect(render(imageUrl)).toContain('<meta property="og:image" content="https://files.example.com/card.png">');
  });
});
