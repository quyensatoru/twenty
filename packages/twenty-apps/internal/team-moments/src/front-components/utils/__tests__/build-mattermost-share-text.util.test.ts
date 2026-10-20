import { describe, expect, it } from 'vitest';

import { buildMattermostShareText } from '../build-mattermost-share-text.util';

describe('buildMattermostShareText', () => {
  it('makes the inline image open the shared card in Mattermost', () => {
    expect(buildMattermostShareText({
      imageUrl: 'https://crm.example.com/public-assets/app/preview.png',
      shareUrl: 'https://crm.example.com/s/moments/share?t=abc',
    })).toBe('[![Thiệp Team Moments](https://crm.example.com/public-assets/app/preview.png)](https://crm.example.com/s/moments/share?t=abc)');
  });
});
