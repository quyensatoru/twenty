import { defineFrontComponent } from 'twenty-sdk/define';

import { EXPORT_PROSPECTS_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { ProspectExportPage } from './components/prospect-export-page';

export default defineFrontComponent({
  universalIdentifier: EXPORT_PROSPECTS_FRONT_COMPONENT_UID,
  name: 'export-prospects',
  description:
    'Standalone prospect export with configurable filters, columns, a preview and CSV/Excel downloads. No record selection required.',
  isHeadless: false,
  component: ProspectExportPage,
});
