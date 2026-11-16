import { t } from 'twenty-sdk/front-component';

import { translateGeneratedText } from '../../utils/generated-text.util';

export const displayGeneratedText = (text: string | null | undefined): string =>
  text === null || text === undefined || text.length === 0
    ? ''
    : translateGeneratedText(text, (message, values) => t(message, values));
