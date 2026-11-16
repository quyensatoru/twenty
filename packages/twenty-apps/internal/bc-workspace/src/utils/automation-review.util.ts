// Only a link to one published review counts; the app listing or its review
// page would credit a review nobody can open.
export const readDirectReviewUrl = (value: unknown): string | null => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null;
  }

  try {
    const url = new URL(value.trim());

    if (url.protocol !== 'https:' || url.hostname !== 'apps.shopify.com') {
      return null;
    }

    return /^\/[^/]+\/reviews\/\d+\/?$/.test(url.pathname) ? url.toString() : null;
  } catch {
    return null;
  }
};
