import { t } from 'twenty-sdk/front-component';

import { type Translate } from '../../utils/translate.util';

export const translate: Translate = (message, values) => t(message, values);
