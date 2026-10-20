import { describe, expect, it } from 'vitest';

import { findCardTemplate } from '../../constants/card-templates';
import { buildSharePage } from '../build-share-page.util';
import { buildCardPalette } from '../card-palette.util';
import { resolveShareImageUrl } from '../resolve-share-image-url.util';

const render = (imageUrl: string, cardRoomUrl: string | null = null) => buildSharePage({
  title: 'Sinh nhật',
  description: 'Thiệp chúc mừng',
  cardSvg: '<svg/>',
  imageUrl,
  downloadUrl: 'https://crm.example.com/card.svg',
  cardRoomUrl,
  eventDate: null,
  wishes: [],
  palette: buildCardPalette(findCardTemplate('birthday')),
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

  it('links to the shared card in the CRM only when its page is known', () => {
    const imageUrl = 'https://files.example.com/card.png';

    expect(render(imageUrl)).not.toContain('Ký thiệp và gửi lời chúc');
    expect(render(imageUrl, 'https://crm.example.com/page/abc#card=event%3A1')).toContain(
      '<a class="room" href="https://crm.example.com/page/abc#card=event%3A1">Ký thiệp và gửi lời chúc',
    );
  });
});
