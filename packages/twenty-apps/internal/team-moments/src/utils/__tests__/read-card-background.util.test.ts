import { afterEach, describe, expect, it, vi } from 'vitest';

import { readCardBackground } from '../read-card-background.util';

afterEach(() => vi.unstubAllGlobals());

describe('readCardBackground', () => {
  it('embeds a stored image so downloaded SVGs keep their background', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(new Uint8Array([1, 2, 3]), {
      headers: { 'content-type': 'image/png' },
    })));

    expect(await readCardBackground('https://files.example.com/photo')).toBe('data:image/png;base64,AQID');
  });

  it('ignores unsupported image content', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<svg/>', {
      headers: { 'content-type': 'image/svg+xml' },
    })));

    expect(await readCardBackground('https://files.example.com/photo')).toBeNull();
  });
});
