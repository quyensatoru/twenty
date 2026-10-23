import { defineFrontComponent } from 'twenty-sdk/define';

import { DISCOUNTS_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { DiscountConsole } from './components/discount-console';

export default defineFrontComponent({
  universalIdentifier: DISCOUNTS_FRONT_COMPONENT_UID,
  name: 'discounts',
  description:
    'Plan discount codes of every app: create one for a merchant, see whether its app took it, and send it again.',
  component: DiscountConsole,
});
