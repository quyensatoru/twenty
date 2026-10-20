const SUPPORTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_BACKGROUND_BYTES = 3 * 1024 * 1024;

// The file URL is temporary, so inline its bytes before serving a public or downloaded SVG.
export const readCardBackground = async (url: string | null | undefined): Promise<string | null> => {
  if (!url) {
    return null;
  }

  try {
    const response = await fetch(url);
    const contentType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();

    if (!response.ok || contentType === undefined || !SUPPORTED_IMAGE_TYPES.has(contentType)) {
      return null;
    }

    const bytes = await response.arrayBuffer();

    if (bytes.byteLength > MAX_BACKGROUND_BYTES) {
      return null;
    }

    return `data:${contentType};base64,${Buffer.from(bytes).toString('base64')}`;
  } catch {
    return null;
  }
};
