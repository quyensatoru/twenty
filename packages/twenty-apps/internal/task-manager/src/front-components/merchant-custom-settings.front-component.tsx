import { defineFrontComponent } from 'twenty-sdk/define';
import { useRecordId } from 'twenty-sdk/front-component';

import { MERCHANT_CUSTOM_SETTINGS_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { MerchantCustomSettingsPanel } from './components/merchant-custom-settings-panel';

const MerchantCustomSettings = () => (
  <MerchantCustomSettingsPanel merchantId={useRecordId() ?? null} />
);

export default defineFrontComponent({
  universalIdentifier: MERCHANT_CUSTOM_SETTINGS_FRONT_COMPONENT_UID,
  name: 'merchant-custom-settings',
  description:
    "A merchant's custom settings, shaped by the schema its app declares and written through the app's scoped routes.",
  component: MerchantCustomSettings,
});
