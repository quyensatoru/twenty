import { UNSUBSCRIBE_PAGE_COPIES } from '../constants/unsubscribe-page-copies';
import { type UnsubscribePageCopy } from '../types/unsubscribe-page-copy';

// Takes the first language of Accept-Language the page has a copy for.
export const pickUnsubscribePageCopy = (
  acceptLanguage: string | undefined,
): UnsubscribePageCopy => {
  const languages = (acceptLanguage ?? '')
    .split(',')
    .map((entry) => entry.split(';')[0].trim().toLowerCase().split('-')[0]);

  for (const language of languages) {
    if (language === 'vi' || language === 'en') {
      return UNSUBSCRIBE_PAGE_COPIES[language];
    }
  }

  return UNSUBSCRIBE_PAGE_COPIES.en;
};
