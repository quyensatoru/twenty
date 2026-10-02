import { defineApplication } from 'twenty-sdk/define';

import { APPLICATION_UID } from './constants/universal-identifiers';

export default defineApplication({
  universalIdentifier: APPLICATION_UID,
  displayName: 'Customer Support',
  description:
    'Merchant master data shared across apps: the merchant record itself, browsed and maintained here rather than from whichever app happens to reference it.',
  applicationVariables: {},
});
